"use client";

import { useQuery } from "@tanstack/react-query";

import { getPaymentMethods, type PaymentMethodsResponse } from "@/lib/api/payment-methods";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const paymentMethodKeys = {
  all: ["payment-methods"] as const,
  list: (fulfillmentType?: string) => [...paymentMethodKeys.all, fulfillmentType] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

export function usePaymentMethods(fulfillmentType?: string) {
  const slug = useOrgSlug();
  return useQuery<PaymentMethodsResponse>({
    queryKey: paymentMethodKeys.list(fulfillmentType),
    queryFn: () => getPaymentMethods(slug, fulfillmentType),
    staleTime: 60_000,
  });
}
