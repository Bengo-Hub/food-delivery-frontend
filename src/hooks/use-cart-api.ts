"use client";

import { useQuery } from "@tanstack/react-query";

import { getFeeBreakdown, type FeeBreakdown } from "@/lib/api/cart-api";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const cartApiKeys = {
  all: ["cart-api"] as const,
  feeBreakdown: (cartId: string) => [...cartApiKeys.all, "fee-breakdown", cartId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

export function useFeeBreakdown(cartId: string | null) {
  const slug = useOrgSlug();
  return useQuery<FeeBreakdown>({
    queryKey: cartApiKeys.feeBreakdown(cartId ?? ""),
    queryFn: () => getFeeBreakdown(slug, cartId!),
    enabled: !!cartId,
    staleTime: 30_000,
  });
}
