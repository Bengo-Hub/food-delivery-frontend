import axios from "axios";

/**
 * Cross-service API clients for tenant settings pages.
 * Each service has its own base URL configured via env vars.
 *
 * These services authenticate the same SSO JWT issued by the central auth
 * provider (same token the main `api` client in base.ts sends). The token is
 * provided via `attachPlatformAuthTokenGetter`, registered from the auth store
 * (see store/auth.ts) so it stays in sync with the session.
 */

let accessTokenGetter: () => string | null = () => null;

/**
 * Register a getter that returns the current SSO access token. Mirrors
 * base.ts's `attachAuthTokenGetter` so cross-service clients send the same
 * `Authorization: Bearer <token>` as the main api client.
 */
export function attachPlatformAuthTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

function createClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    // Attach the SSO bearer token so these services can authenticate the
    // request (previously only tenant headers were sent, which the services
    // reject -> tabs silently degraded to empty states).
    const token = accessTokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof window !== "undefined") {
      const tenantId = localStorage.getItem("tenantId");
      if (tenantId) config.headers["X-Tenant-ID"] = tenantId;
      const tenantSlug = localStorage.getItem("tenantSlug");
      if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
    }
    return config;
  });

  return client;
}

export const treasuryApi = createClient(
  process.env.NEXT_PUBLIC_TREASURY_API_URL || "http://localhost:4201",
);

export const notificationsApi = createClient(
  process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || "http://localhost:4301",
);

export const subscriptionsApi = createClient(
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || "http://localhost:4401",
);
