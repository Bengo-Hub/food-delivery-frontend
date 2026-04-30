import axios from "axios";

// ─── Treasury-authenticated API client ───────────────────────────────
// Wallet data lives in treasury-api (not ordering-backend).
// This client points to treasury-api and injects the user's Bearer token
// so the /{tenant}/wallets/me endpoints can authenticate the request.

const TREASURY_API_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_TREASURY_API_URL) ||
  "http://localhost:4201";

const treasuryAuthApi = axios.create({
  baseURL: TREASURY_API_URL.endsWith("/") ? TREASURY_API_URL : `${TREASURY_API_URL}/`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Import the shared token getter registered by auth setup (same getter used by the ordering api client).
// We re-use the same localStorage/cookie approach: token is written by the auth session.
treasuryAuthApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Attach stored access token for treasury JWT auth
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach tenant headers so TenantV2 middleware can resolve the tenant
    const tenantId = localStorage.getItem("tenantId");
    if (tenantId) config.headers["X-Tenant-ID"] = tenantId;
    const tenantSlug = localStorage.getItem("tenantSlug");
    if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
  }
  return config;
});

// ─── Types ───────────────────────────────────────────────────────────

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  /** Maps to `transaction_type` returned by treasury-api */
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

// ─── API Functions ───────────────────────────────────────────────────

/**
 * Fetches the current user's wallet balance from treasury-api.
 * Endpoint: GET /api/v1/{tenantId}/wallets/me
 * tenantId is read from localStorage and injected via X-Tenant-ID header;
 * the URL param is also set to the tenant UUID so chi routing resolves correctly.
 */
export async function getWalletBalance(_slug: string): Promise<WalletBalance> {
  const tenantId =
    typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
  const path = tenantId
    ? `api/v1/${tenantId}/wallets/me`
    : `api/v1/me/wallets/me`; // fallback: TenantV2 will resolve from header
  const res = await treasuryAuthApi.get(path);
  const data = res.data;
  return {
    balance: typeof data.balance === "string" ? parseFloat(data.balance) : (data.balance ?? 0),
    currency: data.currency ?? "KES",
  };
}

/**
 * Fetches the current user's wallet transaction history from treasury-api.
 * Endpoint: GET /api/v1/{tenantId}/wallets/me/transactions
 */
export async function getWalletTransactions(
  _slug: string,
  params?: { limit?: number; offset?: number },
): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const tenantId =
    typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
  const path = tenantId
    ? `api/v1/${tenantId}/wallets/me/transactions`
    : `api/v1/me/wallets/me/transactions`;
  const res = await treasuryAuthApi.get(path, { params });
  const data = res.data;

  // Map treasury field names to the expected interface:
  // treasury returns: { id, amount, transaction_type, reference, description,
  //                     balance_before, balance_after, created_at }
  const transactions: WalletTransaction[] = (data.transactions ?? []).map(
    (t: Record<string, unknown>) => ({
      id: String(t.id ?? ""),
      type: String(t.transaction_type ?? t.type ?? ""),
      amount:
        typeof t.amount === "string"
          ? parseFloat(t.amount as string)
          : ((t.amount as number) ?? 0),
      currency: String(t.currency ?? "KES"),
      description: String(t.description ?? ""),
      createdAt: String(t.created_at ?? t.createdAt ?? ""),
    }),
  );

  return { transactions, total: data.total ?? transactions.length };
}
