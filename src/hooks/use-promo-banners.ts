"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPromoBanners } from "@/lib/api/promo-banners";
import { useOrgSlug } from "@/providers/org-slug-provider";

/** Active storefront promotion banners for the current tenant, scoped to `useCase` when given. */
export function usePromoBanners(useCase?: string) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: ["promo-banners", slug, useCase ?? ""],
    queryFn: () => fetchPromoBanners(slug, useCase),
    enabled: !!slug,
    staleTime: 60 * 1000, // 1 minute — matches the backend's own short cache TTL
    retry: 1,
  });
}
