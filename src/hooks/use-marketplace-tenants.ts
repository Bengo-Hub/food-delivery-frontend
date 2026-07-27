"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMarketplaceTenants } from "@/lib/api/marketplace";

/** Marketplace-visible tenants for the platform landing page (root, no tenant slug). */
export function useMarketplaceTenants(useCase?: string, page = 1, limit = 24) {
  return useQuery({
    queryKey: ["marketplace-tenants", useCase ?? "", page, limit],
    queryFn: () => fetchMarketplaceTenants(useCase, page, limit),
    staleTime: 60 * 1000,
    retry: 1,
  });
}
