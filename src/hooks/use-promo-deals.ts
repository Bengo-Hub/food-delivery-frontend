"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPromoDeals } from "@/lib/api/promo-deals";
import { useOrgSlug } from "@/providers/org-slug-provider";

/** Active, in-window storefront deals for the current tenant. Mirrors usePromoBanners. */
export function usePromoDeals() {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: ["promo-deals", slug],
    queryFn: () => fetchPromoDeals(slug),
    enabled: !!slug,
    staleTime: 60 * 1000, // 1 minute — matches the backend's own short cache TTL
    retry: 1,
  });
}
