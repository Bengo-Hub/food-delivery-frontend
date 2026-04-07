"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  checkout,
  guestCheckout,
  getFeeBreakdown,
  type CheckoutRequest,
  type CheckoutResponse,
  type GuestCheckoutRequest,
  type FeeBreakdown,
} from "@/lib/api/cart-api";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const cartApiKeys = {
  all: ["cart-api"] as const,
  feeBreakdown: (outletId: string, fulfillmentType: string) =>
    [...cartApiKeys.all, "fee-breakdown", outletId, fulfillmentType] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * Fetch fee breakdown from the backend (authenticated).
 * Requires outletId to identify which cart/outlet to compute fees for.
 * Pass fulfillmentType to get accurate delivery vs pickup fees.
 */
export function useFeeBreakdown(outletId: string | null, fulfillmentType = "delivery", sessionId?: string) {
  const slug = useOrgSlug();
  return useQuery<FeeBreakdown>({
    queryKey: cartApiKeys.feeBreakdown(outletId ?? "", fulfillmentType),
    queryFn: () => getFeeBreakdown(slug, outletId!, fulfillmentType, sessionId),
    enabled: !!outletId,
    staleTime: 60_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

export function useCheckout() {
  const slug = useOrgSlug();
  return useMutation<CheckoutResponse, Error, CheckoutRequest>({
    mutationFn: (data) => checkout(slug, data),
  });
}

export function useGuestCheckout() {
  const slug = useOrgSlug();
  return useMutation<CheckoutResponse, Error, GuestCheckoutRequest>({
    mutationFn: (data) => guestCheckout(slug, data),
  });
}
