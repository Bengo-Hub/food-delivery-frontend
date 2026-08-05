/**
 * Shared helpers for the per-profile homepage views (food/retail/services).
 * Extracted from the old monolithic src/app/[orgSlug]/page.tsx so all three
 * views (and the thin shell) can reuse the same outlet-filter/card mapping
 * logic instead of re-implementing it per view.
 */

import { orgRoute } from "@/lib/routes";
import type { OutletCardProps } from "@/components/outlet/outlet-card";
import type { ActiveFilters } from "@/components/layout/filter-bar";
import type { OutletFilters } from "@/types/catalog";

/** Convert ActiveFilters from the filter bar into OutletFilters for the API */
export function toOutletFilters(
  f: ActiveFilters,
  location?: { latitude: number; longitude: number } | null,
): OutletFilters {
  const out: OutletFilters = {};
  if (f.sortBy) out.sort = f.sortBy;
  if (f.minRating) out.minRating = f.minRating;
  if (f.highestRated && !f.minRating) out.minRating = 4.0;
  if (f.maxTime) out.maxDeliveryTime = f.maxTime;
  if (f.offers) out.offers = true;
  if (f.pickupOnly) out.pickup = true;
  if (f.scheduledOnly) out.scheduled = true;
  if (f.categories.length > 0) out.cuisines = f.categories;
  if (f.maxDistance && location) {
    out.maxDistance = f.maxDistance;
    out.lat = location.latitude;
    out.lng = location.longitude;
  }
  if (f.deliveryFee) {
    if (f.deliveryFee === "free") out.maxDeliveryFee = 0;
    else if (f.deliveryFee === "under-50") out.maxDeliveryFee = 50;
    else if (f.deliveryFee === "under-100") out.maxDeliveryFee = 100;
  }
  return out;
}

/** Map API outlet to OutletCardProps */
export function toCardProps(
  o: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    deliveryTime: string;
    deliveryFee: string;
    cuisines: string[];
    businessType?: string | undefined;
    isOpen: boolean;
    promoted?: boolean;
    offerBadge?: string;
    image?: string | undefined;
    discount?: number;
  },
  orgSlug: string,
  // Tenant's own resolved use_case — used only when this specific outlet's
  // use_case hasn't synced yet, so its card renders the tenant's real vertical
  // icon instead of silently defaulting to a food/restaurant illustration.
  fallbackUseCase?: string,
): OutletCardProps {
  return {
    id: o.id,
    name: o.name,
    rating: o.rating,
    reviewCount: o.reviewCount,
    deliveryTime: o.deliveryTime,
    deliveryFee: o.deliveryFee,
    cuisines: o.cuisines,
    businessType: o.businessType || fallbackUseCase,
    isOpen: o.isOpen,
    href: orgRoute(orgSlug, `/outlet/${o.id}`),
    ...(o.promoted && { promoted: o.promoted }),
    ...(o.offerBadge && { offerBadge: o.offerBadge }),
    ...(o.image && { image: o.image }),
    ...(o.discount && { promoBadge: `-${o.discount}%` }),
  };
}
