import type { AxiosError } from "axios";
import { create } from "zustand";

import { attachAuthTokenGetter } from "@/lib/api/base";
import { attachPlatformAuthTokenGetter } from "@/lib/api/platform-services";
import {
    buildAuthorizeUrl,
    buildLogoutUrl,
    exchangeCodeForTokens,
    fetchOrderSummary,
    fetchProfile,
    fetchProfileFromSSO,
    revokeServerSession,
    updatePreferences,
    updateProfile,
    updateSecurity,
} from "@/lib/auth/api";
import {
    consumeState,
    consumeVerifier,
    generateCodeChallenge,
    generateCodeVerifier,
    generateState,
    storeState,
    storeVerifier,
} from "@/lib/auth/pkce";
import { loadAuthState, persistAuthState } from "@/lib/auth/session";
import type {
    AuthResponse,
    OrderSummary,
    PreferencesUpdateInput,
    ProfileUpdateInput,
    SecurityUpdateInput,
    SessionTokens,
    UserProfile,
} from "@/lib/auth/types";
import { toast } from "@/lib/toast";

type AuthStatus = "idle" | "loading" | "authenticated" | "syncing" | "error";

interface AuthState {
  status: AuthStatus;
  error: string | null;
  session: SessionTokens | null;
  user: UserProfile | null;
  orders: OrderSummary[];
  lastAuthenticatedAt: number | null;
  /** Sync user/roles/permissions from GET /auth/me (e.g. from useMe query). */
  syncFromProfile: (response: AuthResponse) => void;
  initialize: () => Promise<void>;
  /** @param tenant Optional tenant slug (e.g. from path orgSlug); defaults to urban-loft for token/tenant sync. */
  redirectToSSO: (returnTo?: string, tenant?: string) => Promise<void>;
  handleSSOCallback: (code: string, callbackUrl: string, tenantSlug?: string) => Promise<void>;
  /** Clear local session state without SSO redirect (used by 401 handler on public pages). */
  clearLocalSession: () => void;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<void>;
  updatePreferences: (input: PreferencesUpdateInput) => Promise<void>;
  updateSecurity: (input: SecurityUpdateInput) => Promise<void>;
  refreshOrders: () => Promise<void>;
  hydrateFromWebAuthn: (tokens: { accessToken: string; refreshToken: string; expiresIn: number }, tenantSlug?: string) => Promise<void>;
  /** Subscription info loaded lazily after auth — never blocks login. */
  subscriptionInfo: Record<string, unknown> | null | undefined;
  setSubscriptionInfo: (info: Record<string, unknown> | null) => void;
}

function applyAuthResponse(set: (value: Partial<AuthState>) => void, response: AuthResponse) {
  if (typeof window !== "undefined") {
    if (response.tenant_id) localStorage.setItem("tenantId", response.tenant_id);
    if (response.tenant_slug) localStorage.setItem("tenantSlug", response.tenant_slug);
  }
  const newState = {
    status: "authenticated" as const,
    session: response.session,
    user: response.user,
    error: null,
    lastAuthenticatedAt: Date.now(),
  };
  persistAuthState(newState);
  set(newState);
}

async function hydrateOrders(set: (value: Partial<AuthState>) => void) {
  try {
    const orders = await fetchOrderSummary();
    set({ orders });
    return orders;
  } catch {
    set({ orders: [] });
    return [];
  }
}

function isAxiosAuthError(error: unknown): error is AxiosError {
  return typeof error === "object" && error !== null && (error as AxiosError).isAxiosError === true;
}

function extractStatus(error: unknown): number | undefined {
  if (isAxiosAuthError(error)) {
    return error.response?.status;
  }
  return undefined;
}

function clearSession(set: (value: Partial<AuthState>) => void) {
  if (typeof window !== "undefined") {
    localStorage.removeItem("tenantId");
    // Keep tenantSlug so next login can still resolve org; optional: localStorage.removeItem("tenantSlug");
  }
  persistAuthState({ session: null, user: null });
  set({
    status: "idle",
    user: null,
    session: null,
    orders: [],
    error: null,
    lastAuthenticatedAt: null,
  });
}

function getInitialAuthState(): Pick<AuthState, "session" | "user" | "status" | "error" | "orders"> {
  const loaded = loadAuthState();
  const status = loaded.session && loaded.user ? "authenticated" : "idle";
  return { ...loaded, status, error: null, orders: [] };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialAuthState(),
  lastAuthenticatedAt: null,
  subscriptionInfo: undefined,
  setSubscriptionInfo: (info) => set({ subscriptionInfo: info }),

  hydrateFromWebAuthn: async (tokens, tenantSlug) => {
    set({ status: "syncing", error: null });
    try {
      const session: SessionTokens = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
        sessionId: "",
      };
      persistAuthState({ session, user: null });
      set({ session });

      if (tenantSlug && typeof window !== "undefined") {
        localStorage.setItem("tenantSlug", tenantSlug);
      }

      const ssoResponse = await fetchProfileFromSSO(session.accessToken);
      const payload: AuthResponse = {
        session: { ...session, sessionId: ssoResponse.session?.sessionId ?? "" },
        user: ssoResponse.user,
      };
      if (ssoResponse.tenant_id != null) payload.tenant_id = ssoResponse.tenant_id;
      if (ssoResponse.tenant_slug != null) payload.tenant_slug = ssoResponse.tenant_slug;
      applyAuthResponse(set, payload);
      if (typeof window !== "undefined" && payload.user?.email) {
        localStorage.setItem("sso_last_email", payload.user.email);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Biometric sign-in failed";
      set({ status: "error", error: message });
      throw error;
    }
  },

  syncFromProfile: (response) => {
    applyAuthResponse(set, response);
    // Do NOT call hydrateOrders here — it hits the backend which may 401
    // before JIT sync completes, triggering the on401 interceptor.
    // Orders will be fetched lazily when the user navigates to orders pages.
  },

  initialize: async () => {
    const { session, user } = get();
    if (!session) {
      set({ status: "idle", user: null, error: null, orders: [] });
      return;
    }

    // Hydrate from storage if user profile exists and token hasn't expired (60s buffer).
    if (user && session) {
      const expiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : 0;
      if (expiresAt && Date.now() < expiresAt - 60_000) {
        set({ status: "authenticated" });
        return;
      }
    }

    // Fetch profile from SSO (not backend — avoids 401 during JIT sync)
    try {
      set({ status: "loading", error: null });
      const ssoResponse = await fetchProfileFromSSO(session.accessToken);
      const payload: AuthResponse = {
        session: { ...session, sessionId: ssoResponse.session?.sessionId ?? "" },
        user: ssoResponse.user,
      };
      if (ssoResponse.tenant_id != null) payload.tenant_id = ssoResponse.tenant_id;
      if (ssoResponse.tenant_slug != null) payload.tenant_slug = ssoResponse.tenant_slug;
      applyAuthResponse(set, payload);
    } catch (error) {
      const status = extractStatus(error);
      if (status === 401) {
        clearSession(set);
        toast.error("Session expired. Please sign in again.");
        return;
      }
      // 403 = authenticated but lacks permission or subscription — do NOT clear session
      if (status === 403) {
        return;
      }
      if (user && session) {
        set({ status: "authenticated" });
      } else {
        set({ status: "error", error: "Connection failed" });
      }
    }
  },

  /**
   * Redirect the user to the SSO authorization page.
   * Generates PKCE code verifier/challenge and stores in sessionStorage.
   */
  redirectToSSO: async (returnTo?: string, tenant?: string) => {
    set({ status: "loading", error: null });
    try {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const state = generateState();

      storeVerifier(verifier);
      storeState(state);

      // Store returnTo so the callback page knows where to redirect after sync
      if (returnTo && typeof window !== "undefined") {
        sessionStorage.setItem("sso_return_to", returnTo);
      }

      // Build the callback URL for this frontend
      const callbackUrl = typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname.split("/").slice(0, 2).join("/")}/auth/callback`
        : "";

      // Pass tenant so auth-api can mint token for that org; default urban-loft per plan.
      const authorizeUrl = buildAuthorizeUrl({
        codeChallenge: challenge,
        state,
        redirectUri: callbackUrl,
        tenant: tenant ?? "urban-loft",
      });

      if (typeof window !== "undefined") {
        window.location.href = authorizeUrl;
      }
    } catch (error) {
      set({ status: "error", error: "Failed to start sign-in. Please try again." });
      toast.error("Failed to start sign-in.");
      throw error;
    }
  },

  /**
   * Handle the SSO callback: exchange auth code for tokens, then sync user.
   * @param tenantSlug Optional tenant slug (e.g. from path); required so fetchProfile can call GET /api/v1/{tenant}/auth/me.
   */
  handleSSOCallback: async (code: string, callbackUrl: string, tenantSlug?: string) => {
    set({ status: "syncing", error: null });

    const verifier = consumeVerifier();
    const storedState = consumeState();

    if (!verifier) {
      set({ status: "error", error: "Authentication session expired. Please try again." });
      return;
    }

    if (tenantSlug && typeof window !== "undefined") {
      window.localStorage.setItem("tenantSlug", tenantSlug);
    }

    try {
      // Step 1: Exchange auth code for tokens at SSO
      const tokens = await exchangeCodeForTokens({
        code,
        codeVerifier: verifier,
        redirectUri: callbackUrl,
      });

      // Step 2: Store session tokens
      const session: SessionTokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? "",
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        sessionId: "",
      };
      persistAuthState({ session, user: null });
      set({ session });

      // Step 3: Fetch profile from SSO /me (always available, no JIT sync needed).
      // Do NOT call backend APIs here — the user may not be JIT-synced yet and
      // any 401 from backend calls triggers the on401 interceptor which clears
      // the session and causes a redirect loop.
      try {
        const ssoResponse = await fetchProfileFromSSO(session.accessToken);
        const payload: AuthResponse = {
          session: { ...session, sessionId: ssoResponse.session?.sessionId ?? "" },
          user: ssoResponse.user,
        };
        if (ssoResponse.tenant_id != null) payload.tenant_id = ssoResponse.tenant_id;
        if (ssoResponse.tenant_slug != null) payload.tenant_slug = ssoResponse.tenant_slug;
        applyAuthResponse(set, payload);
        if (typeof window !== "undefined" && payload.user?.email) {
          localStorage.setItem("sso_last_email", payload.user.email);
        }
        toast.success("Welcome back!");
      } catch (ssoErr) {
        // SSO /me failed — set error state so callback page shows retry button.
        // Never set "authenticated" without a user — it causes the callback to hang.
        const msg = ssoErr instanceof Error ? ssoErr.message : "Failed to load profile";
        set({ status: "error", session, error: msg });
        toast.error("Failed to load your profile. Please try again.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-in failed";
      set({ status: "error", error: message });
      toast.error("Sign-in failed. Please try again.");
    }
  },

  clearLocalSession: () => {
    clearSession(set);
  },

  logout: async () => {
    // Revoke the backend session (Redis session_token keys + DB sessions) while
    // the access token is still available, before clearing local state.
    await revokeServerSession(get().session?.accessToken);
    clearSession(set);
    // Clear Zustand persist storage to prevent rehydration of stale session
    if (typeof window !== "undefined") {
      try { localStorage.removeItem("ordering-auth-storage"); } catch { /* no-op */ }
      try { localStorage.removeItem("tenantId"); } catch { /* no-op */ }
      try { sessionStorage.clear(); } catch { /* no-op */ }
      // Redirect to SSO logout → clears session cookie → redirects to accounts login page
      // Use accounts URL (not app URL) so user lands on login page, not a redirect loop
      const returnTo = encodeURIComponent(window.location.origin);
      window.location.href = buildLogoutUrl(`https://accounts.codevertexitsolutions.com/login?return_to=${returnTo}`);
    }
  },

  updateProfile: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updateProfile(input);
      applyAuthResponse(set, response);
      toast.success("Profile updated successfully.");
    } catch (error) {
      set({ status: "error", error: "Could not update profile right now." });
      toast.error("Failed to update profile.");
      throw error;
    }
  },

  updatePreferences: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updatePreferences(input);
      applyAuthResponse(set, response);
      toast.success("Preferences updated.");
    } catch (error) {
      set({ status: "error", error: "Could not update preferences right now." });
      toast.error("Failed to update preferences.");
      throw error;
    }
  },

  updateSecurity: async (input) => {
    set({ status: "loading", error: null });
    try {
      const response = await updateSecurity(input);
      applyAuthResponse(set, response);
      toast.success("Security settings updated.");
    } catch (error) {
      set({ status: "error", error: "Unable to update security settings." });
      toast.error("Failed to update security settings.");
      throw error;
    }
  },

  refreshOrders: async () => {
    try {
      const orders = await fetchOrderSummary();
      set({ orders });
    } catch {
      // silently fail
    }
  },
}));

attachAuthTokenGetter(() => useAuthStore.getState().session?.accessToken ?? null);
// Keep cross-service clients (notifications/subscriptions/treasury) authenticated
// with the same SSO bearer token as the main api client.
attachPlatformAuthTokenGetter(() => useAuthStore.getState().session?.accessToken ?? null);
