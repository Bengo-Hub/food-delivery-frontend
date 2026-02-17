import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface LoyaltyBalance {
  balance: number;
  balanceValue: number;
  currency: string;
}

export interface TierBenefits {
  pointsMultiplier: number;
  freeDelivery: boolean;
  prioritySupport: boolean;
  exclusiveOffers: boolean;
}

export interface LoyaltyAccount {
  id: string;
  balancePoints: number;
  balanceValue: number;
  tier: string;
  lifetimePoints: number;
  tierBenefits: TierBenefits;
  currency: string;
}

export interface LoyaltyTransaction {
  id: string;
  accountId: string;
  orderId: string | null;
  points: number;
  transactionType: "earn" | "redeem" | "expire" | "adjustment" | "bonus";
  description: string;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export interface LoyaltyTransactionsResponse {
  data: LoyaltyTransaction[];
  total: number;
  limit: number;
  page: number;
}

export interface TierBenefitsResponse {
  tier: string;
  lifetimePoints: number;
  pointsMultiplier: number;
  freeDelivery: boolean;
  prioritySupport: boolean;
  exclusiveOffers: boolean;
  tierThresholds: Record<string, number>;
}

// ─── API Functions ───────────────────────────────────────────────────

export async function getLoyaltyBalance(tenantSlug: string): Promise<LoyaltyBalance> {
  const res = await api.get(`${tenantSlug}/loyalty/balance`);
  return res.data;
}

export async function getLoyaltyAccount(tenantSlug: string): Promise<LoyaltyAccount> {
  const res = await api.get(`${tenantSlug}/loyalty/account`);
  return res.data;
}

export async function getLoyaltyTransactions(
  tenantSlug: string,
  params?: { limit?: number; page?: number },
): Promise<LoyaltyTransactionsResponse> {
  const res = await api.get(`${tenantSlug}/loyalty/transactions`, { params });
  return res.data;
}

export async function getTierBenefits(tenantSlug: string): Promise<TierBenefitsResponse> {
  const res = await api.get(`${tenantSlug}/loyalty/tier-benefits`);
  return res.data;
}
