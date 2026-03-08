import { api } from "@/lib/api/base";
import type {
    AuthResponse,
    OrderSummary,
    PreferencesUpdateInput,
    ProfileUpdateInput,
    SecurityUpdateInput,
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
