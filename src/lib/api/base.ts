import axios from "axios";

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4005/api/v1/";
const NORMALISED_BASE_URL = DEFAULT_BASE_URL.endsWith("/")
  ? DEFAULT_BASE_URL
  : `${DEFAULT_BASE_URL}/`;

let accessTokenGetter: () => string | null = () => null;

export const api = axios.create({
  baseURL: NORMALISED_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = accessTokenGetter();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If the body is FormData, let the browser set the Content-Type with boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  if (typeof window !== "undefined") {
    const tenantId = localStorage.getItem("tenantId");
    if (tenantId) {
      config.headers["X-Tenant-ID"] = tenantId;
    }
    const tenantSlug = localStorage.getItem("tenantSlug");
    if (tenantSlug) {
      config.headers["X-Tenant-Slug"] = tenantSlug;
    }
  }

  // Debug: Log headers to verify sync (safe in development/local)
  if (process.env.NODE_ENV === "development") {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      auth: config.headers.Authorization ? "Bearer ***" : "none",
      tenantId: config.headers["X-Tenant-ID"],
      tenantSlug: config.headers["X-Tenant-Slug"],
    });
  }

  return config;
});

export function attachAuthTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

let on401Callback: (() => void) | null = null;
let onSubscription403Callback: ((data: any) => void) | null = null;

/** Register a callback to run when any API response is 401 (e.g. clear session / redirect to auth). */
export function setOn401(callback: (() => void) | null) {
  on401Callback = callback;
}

/** Register a callback for subscription-related 403 errors (code=subscription_inactive, upgrade=true). */
export function setOnSubscription403(callback: ((data: any) => void) | null) {
  onSubscription403Callback = callback;
}

// Retry on 429 (rate limit) with exponential backoff
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      const retryCount = error.config?._retryCount ?? 0;
      if (retryCount < 3) {
        error.config._retryCount = retryCount + 1;
        // Exponential backoff: 1s, 2s, 4s (respect Retry-After header if present)
        const retryAfter = error.response?.headers?.['retry-after'];
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return api.request(error.config);
      }
    }

    if (error.response?.status === 401) {
      // If token is already cleared (explicit logout in progress), skip entirely
      if (!accessTokenGetter()) return Promise.reject(error);

      const url: string = error.config?.url ?? "";
      if (!url.includes("/auth/me") && !error.config?._retried) {
        const { refreshAccessToken } = await import("@/lib/auth/token-refresh");
        const newToken = await refreshAccessToken();

        if (newToken) {
          error.config._retried = true;
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }

        on401Callback?.();
      }
    }
    if (error.response?.status === 403 && onSubscription403Callback) {
      const data = error.response?.data;
      if (data?.code === 'subscription_inactive' || data?.upgrade === true) {
        onSubscription403Callback(data);
      }
    }
    return Promise.reject(error);
  },
);
