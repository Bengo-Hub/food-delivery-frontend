/**
 * Storefront "Top Deals" API client.
 *
 * Mirrors promo-banners.ts: a thin read-through of ordering-backend's
 * GET /{tenant}/promotions/deals, which itself proxies pos-api's active,
 * currently-in-window Promotion+PromotionRule records (posdiscounts.Discount).
 * Also owns resolveDealItems, the deal-to-catalog-item matcher shared by every
 * home view that renders a per-item deals grid (retail, food) — kept here rather
 * than duplicated per view.
 */

import { api } from "./base";
import type { MenuItem } from "@/types/catalog";

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
  /** Renders a countdown-to-endAt badge on the deal's grid card instead of a plain discount
   *  badge. Sourced from the same Promotion.metadata["banner"]["is_flash_sale"] flag the
   *  banner carousel already reads. */
  isFlashSale: boolean;
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
  is_flash_sale?: boolean;
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
    isFlashSale: !!d.is_flash_sale,
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

/** Resolve the (item, matching deal) pairs for a "Top Deals"/"Today's offers" item grid:
 *  cross-references each deal's rule.scope_ids against the loaded catalog items, matching
 *  item-scoped deals by item id/inventoryId and category-scoped deals by categoryId.
 *  "all"-scope deals are skipped here — they're banner-appropriate, not a per-item grid
 *  concern. Shared by every home view that renders a deals grid (retail, food). */
export function resolveDealItems(items: MenuItem[], deals: Deal[]): { item: MenuItem; deal: Deal }[] {
  const out: { item: MenuItem; deal: Deal }[] = [];
  const seen = new Set<string>();
  for (const deal of deals) {
    const rule = deal.rule;
    if (!rule || rule.scopeType === "all") continue;
    if (rule.discountType === "bogo") continue; // doesn't reduce to a single price badge
    for (const item of items) {
      if (seen.has(item.id)) continue;
      const matches =
        rule.scopeType === "item"
          ? rule.scopeIds.includes(item.id) || (item.inventoryId != null && rule.scopeIds.includes(item.inventoryId))
          : rule.scopeIds.includes(item.categoryId);
      if (matches) {
        seen.add(item.id);
        out.push({ item, deal });
      }
    }
  }
  return out;
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
