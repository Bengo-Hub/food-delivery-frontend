import { api } from "@/lib/api/base";
import type {
    AuthResponse,
    OrderSummary,
    Permission,
    PreferencesUpdateInput,
    ProfileUpdateInput,
    SecurityUpdateInput,
    UserProfile,
    UserRole,
} from "./types";

// SSO configuration
const SSO_BASE_URL =
  process.env.NEXT_PUBLIC_SSO_URL ?? "https://sso.codevertexitsolutions.com";
const SSO_CLIENT_ID = process.env.NEXT_PUBLIC_SSO_CLIENT_ID ?? "ordering-ui";

/**
 * Build the SSO authorize URL for OIDC Authorization Code + PKCE flow.
 */
export function buildAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
  redirectUri: string;
  scope?: string;
  tenant?: string;
}): string {
  const url = new URL("/api/v1/authorize", SSO_BASE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", SSO_CLIENT_ID);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope ?? "openid profile email offline_access");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (params.tenant) {
    url.searchParams.set("tenant", params.tenant);
  }
  return url.toString();
}

/**
 * Build the SSO signup URL for user registration.
 */
export function buildSignupUrl(returnTo: string, tenant?: string): string {
  const url = new URL("/signup", SSO_BASE_URL.replace("/api/v1", ""));
  url.searchParams.set("return_to", returnTo);
  if (tenant) {
    url.searchParams.set("tenant", tenant);
  }
  return url.toString();
}

/**
 * Build the SSO logout URL for single sign-out.
 */
export function buildLogoutUrl(postLogoutRedirectUri?: string): string {
  const url = new URL("/api/v1/auth/logout", SSO_BASE_URL);
  if (postLogoutRedirectUri) {
    url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  }
  return url.toString();
}

export async function refreshTokens(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  const response = await fetch(`${SSO_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken, client_id: SSO_CLIENT_ID }),
  });
  if (!response.ok) throw new Error("Token refresh failed");
  return response.json();
}

/**
 * Exchange an authorization code for tokens via the SSO token endpoint.
 * This is the PKCE code exchange step.
 */
export async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: SSO_CLIENT_ID,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(`${SSO_BASE_URL}/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description || errorData.error || "Token exchange failed");
  }

  return response.json();
}

/**
 * Resolve tenant slug for API calls: explicit param, or from localStorage (e.g. set by OrgSlugProvider).
 */
function getTenantSlug(tenantSlug?: string): string | null {
  if (tenantSlug != null && tenantSlug !== "") return tenantSlug;
  if (typeof window !== "undefined") return localStorage.getItem("tenantSlug");
  return null;
}

/**
 * Fetch the current user's profile from the ordering-backend.
 * Backend route is GET /api/v1/{tenant}/auth/me — tenant slug must be in path.
 * Use tenantSlug when available (e.g. from useOrgSlug()); otherwise reads from localStorage.
 */
export async function fetchProfile(tenantSlug?: string): Promise<AuthResponse> {
  const slug = getTenantSlug(tenantSlug);
  if (!slug) {
    return Promise.reject(new Error("Tenant slug required for /auth/me (set by URL or localStorage)"));
  }
  const { data } = await api.get<AuthResponse>(`${slug}/auth/me`);
  return data;
}

/** SSO /me response shape (auth-api GET /api/v1/auth/me). */
interface SSOMeResponse {
  id: string;
  email: string;
  profile?: Record<string, unknown>;
  roles?: string[];
  permissions?: string[];
  tenant_id?: string;
  tenant_slug?: string;
  tenant?: { id: string; name: string; slug: string };
}

/**
 * Fetch user profile from SSO when ordering-backend /auth/me is not ready (e.g. user not yet synced).
 * Caller must pass the access token; response is mapped to AuthResponse so the UI can show authenticated state.
 */
export async function fetchProfileFromSSO(accessToken: string): Promise<AuthResponse> {
  const res = await fetch(`${SSO_BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "Unauthorized" : "SSO /me failed");
  }
  const raw = (await res.json()) as SSOMeResponse;
  const profile = (raw.profile ?? {}) as Record<string, unknown>;
  const name = (profile.name as string) ?? (profile.full_name as string) ?? "";
  const tenantSlug = raw.tenant_slug ?? raw.tenant?.slug;
  const out: AuthResponse = {
    session: {
      accessToken,
      refreshToken: "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      sessionId: "",
    },
    user: {
      id: raw.id,
      email: raw.email,
      fullName: name || raw.email,
      phone: (profile.phone as string) ?? null,
      roles: (raw.roles ?? []) as UserRole[],
      permissions: (raw.permissions ?? []) as Permission[],
      isSuperUser: (raw.roles ?? []).includes("superuser"),
      avatarUrl: (profile.avatar_url as string) ?? null,
      loyaltyPoints: 0,
      availableCoupons: 0,
      defaultLocationLabel: null,
      twoFactorEnabled: false,
      backupCodesEnabled: false,
      preferences: {
        theme: "system",
        notifications: { email: true, sms: false, push: false },
        language: "en",
      },
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as UserProfile,
  };
  if (raw.tenant_id != null) out.tenant_id = raw.tenant_id;
  if (tenantSlug != null) out.tenant_slug = tenantSlug;
  return out;
}

/**
 * Update user profile via ordering-backend. Requires tenant in path.
 */
export async function updateProfile(input: ProfileUpdateInput, tenantSlug?: string): Promise<AuthResponse> {
  const slug = getTenantSlug(tenantSlug);
  if (!slug) return Promise.reject(new Error("Tenant slug required"));
  const { data } = await api.patch<AuthResponse>(`${slug}/users/profile`, input);
  return data;
}

/**
 * Update user preferences via ordering-backend. Requires tenant in path.
 */
export async function updatePreferences(input: PreferencesUpdateInput, tenantSlug?: string): Promise<AuthResponse> {
  const slug = getTenantSlug(tenantSlug);
  if (!slug) return Promise.reject(new Error("Tenant slug required"));
  const { data } = await api.patch<AuthResponse>(`${slug}/users/preferences`, input);
  return data;
}

/**
 * Update security settings via ordering-backend. Requires tenant in path.
 */
export async function updateSecurity(input: SecurityUpdateInput, tenantSlug?: string): Promise<AuthResponse> {
  const slug = getTenantSlug(tenantSlug);
  if (!slug) return Promise.reject(new Error("Tenant slug required"));
  const { data } = await api.post<AuthResponse>(`${slug}/users/security`, input);
  return data;
}

/**
 * Fetch the current user's recent order summary. Requires tenant in path.
 */
export async function fetchOrderSummary(tenantSlug?: string): Promise<OrderSummary[]> {
  const slug = getTenantSlug(tenantSlug);
  if (!slug) return Promise.reject(new Error("Tenant slug required"));
  const { data } = await api.get<OrderSummary[]>(`${slug}/customers/orders/summary`);
  return data;
}
