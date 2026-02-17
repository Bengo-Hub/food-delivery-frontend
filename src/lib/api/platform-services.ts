import axios from "axios";

/**
 * Cross-service API clients for tenant settings pages.
 * Each service has its own base URL configured via env vars.
 */

function createClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
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
