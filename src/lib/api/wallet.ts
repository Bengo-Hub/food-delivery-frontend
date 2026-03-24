import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
}

// ─── API Functions ───────────────────────────────────────────────────

export async function getWalletBalance(slug: string): Promise<WalletBalance> {
  const res = await api.get(`${slug}/wallet/balance`);
  return res.data;
}

export async function getWalletTransactions(
  slug: string,
  params?: { limit?: number; offset?: number },
): Promise<{ transactions: WalletTransaction[]; total: number }> {
  const res = await api.get(`${slug}/wallet/transactions`, { params });
  return res.data;
}
