/**
 * Storefront "Top Deals" API client.
 *
 * Mirrors promo-banners.ts: a thin read-through of ordering-backend's
 * GET /{tenant}/promotions/deals, which itself proxies pos-api's active,
 * currently-in-window Promotion+PromotionRule records (posdiscounts.Discount).
 * This module owns no discount logic beyond typing/shaping the response —
 * cross-referencing scope_ids against catalog items happens in the retail
 * home view, not here.
 */

import { api } from "./base";

export type DealScopeType = "all" | "category" | "item";
export type DealDiscountType = "percentage" | "fixed_amount" | "fixed_price" | "bogo";

export interface DealRule {
  scopeType: DealScopeType;
  scopeIds: string[];
  discountType: DealDiscountType;
  discountValue: number;
  maxDiscount: number;
}

export interface Deal {
  id: string;
  name: string;
  startAt: string;
  endAt: string | null;
  rule: DealRule | null;
}

/** Backend deal shape (ordering-backend -> pos-api S2S response, snake_case, passed through as-is). */
interface BackendDealRule {
  scope_type: DealScopeType;
  scope_ids: string[] | null;
  discount_type: DealDiscountType;
  discount_value: number;
  max_discount: number;
}

interface BackendDeal {
  id: string;
  name: string;
  start_at: string;
  end_at: string | null;
  rule: BackendDealRule | null;
}

function backendDealToDeal(d: BackendDeal): Deal {
  return {
    id: d.id,
    name: d.name,
    startAt: d.start_at,
    endAt: d.end_at ?? null,
    rule: d.rule
      ? {
          scopeType: d.rule.scope_type,
          scopeIds: d.rule.scope_ids ?? [],
          discountType: d.rule.discount_type,
          discountValue: d.rule.discount_value,
          maxDiscount: d.rule.max_discount,
        }
      : null,
  };
}

/** Fetch active, in-window storefront deals for a tenant. Never throws — a promotions
 *  integration hiccup must never break the storefront homepage. */
export async function fetchPromoDeals(tenantSlug: string): Promise<Deal[]> {
  try {
    const res = await api.get<BackendDeal[]>(`${tenantSlug}/promotions/deals`);
    const items = Array.isArray(res.data) ? res.data : [];
    return items.map(backendDealToDeal);
  } catch {
    return [];
  }
}

/** Compute a display badge ("-20%" / "-KES 150") for a deal's discount. Returns
 *  null for discount types that don't reduce cleanly to a single badge (bogo). */
export function dealBadge(rule: DealRule | null | undefined): string | null {
  if (!rule) return null;
  if (rule.discountType === "percentage") return `-${rule.discountValue}%`;
  if (rule.discountType === "fixed_amount") return `-KES ${rule.discountValue.toLocaleString()}`;
  return null;
}

/** Compute the discounted price for an item given its original price and a deal's rule. */
export function applyDeal(originalPrice: number, rule: DealRule | null | undefined): number {
  if (!rule) return originalPrice;
  if (rule.discountType === "percentage") {
    const discount = Math.min(
      originalPrice * (rule.discountValue / 100),
      rule.maxDiscount > 0 ? rule.maxDiscount : Infinity,
    );
    return Math.max(0, originalPrice - discount);
  }
  if (rule.discountType === "fixed_amount") {
    return Math.max(0, originalPrice - rule.discountValue);
  }
  if (rule.discountType === "fixed_price") {
    return Math.max(0, rule.discountValue);
  }
  return originalPrice;
}
