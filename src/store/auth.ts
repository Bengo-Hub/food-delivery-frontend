import type { AxiosError } from "axios";
import { create } from "zustand";

import { attachAuthTokenGetter } from "@/lib/api/base";
import {
    buildAuthorizeUrl,
    buildLogoutUrl,
    exchangeCodeForTokens,
    fetchOrderSummary,
    fetchProfile,
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
  /** Sync user/roles/permissions from GET /auth/me (e.g. from useMe query). */
  syncFromProfile: (response: AuthResponse) => void;
  initialize: () => Promise<void>;
  /** @param tenant Optional tenant slug (e.g. from path orgSlug); defaults to urban-loft for token/tenant sync. */
  redirectToSSO: (returnTo?: string, tenant?: string) => Promise<void>;
  handleSSOCallback: (code: string, callbackUrl: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => Promise<void>;
  updatePreferences: (input: PreferencesUpdateInput) => Promise<void>;
  updateSecurity: (input: SecurityUpdateInput) => Promise<void>;
  refreshOrders: () => Promise<void>;
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
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...loadAuthState(),
  status: "idle",
  error: null,
  orders: [],

  syncFromProfile: (response) => {
    applyAuthResponse(set, response);
    void hydrateOrders(set);
  },

  initialize: async () => {
    const { session, user } = get();
    if (!session) {
      set({ status: "idle", user: null, error: null, orders: [] });
      return;
    }

    // Optimistically set authenticated if we have user and session
    if (user && session) {
      set({ status: "authenticated" });
      hydrateOrders(set);
      return;
    }

    try {
      set({ status: "loading", error: null });
      const response = await fetchProfile();
      applyAuthResponse(set, response);
      await hydrateOrders(set);
    } catch (error) {
      const status = extractStatus(error);
      if (status === 401 || status === 403) {
        clearSession(set);
        toast.error("Session expired. Please sign in again.");
      } else {
        // For network errors, keep cached session for offline access
        if (user && session) {
          set({ status: "authenticated" });
        } else {
          set({ status: "error", error: "Connection failed" });
        }
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
   */
  handleSSOCallback: async (code: string, callbackUrl: string) => {
    set({ status: "syncing", error: null });

    const verifier = consumeVerifier();
    const storedState = consumeState();

    if (!verifier) {
      set({ status: "error", error: "Authentication session expired. Please try again." });
      return;
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

      // Step 3: Wait for user sync via NATS and fetch profile from ordering-backend
      // The SSO publishes auth.user.created/login → ordering-backend subscribes and syncs user
      let syncAttempts = 0;
      const maxAttempts = 10;
      const pollInterval = 1000; // 1 second

      while (syncAttempts < maxAttempts) {
        try {
          const response = await fetchProfile();
          applyAuthResponse(set, {
            session: { ...session, sessionId: response.session?.sessionId ?? "" },
            user: response.user,
          });
          await hydrateOrders(set);
          toast.success("Welcome back!");
          return;
        } catch (err) {
          const httpStatus = extractStatus(err);
          // 404 means user not yet synced, keep polling
          if (httpStatus === 404 || httpStatus === 401) {
            syncAttempts++;
            await new Promise((r) => setTimeout(r, pollInterval));
            continue;
          }
          throw err;
        }
      }

      // If sync didn't complete, still set authenticated with SSO tokens
      // The user can try refreshing later
      set({
        status: "authenticated",
        session,
        error: null,
      });
      toast.info("Signed in. Your profile is still syncing.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-in failed";
      set({ status: "error", error: message });
      toast.error("Sign-in failed. Please try again.");
    }
  },

  logout: async () => {
    try {
      toast.success("Signed out successfully.");
    } catch {
      toast.info("Signed out.");
    } finally {
      clearSession(set);
      // Redirect to SSO logout for single sign-out
      if (typeof window !== "undefined") {
        window.location.href = buildLogoutUrl(window.location.origin);
      }
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
