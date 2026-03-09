"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyPromoCode,
  cancelOrder,
  createOrder,
  getOrder,
  getOrderTracking,
  getPaymentStatus,
  initiateMpesaPayment,
  listOrders,
  rateOrder,
  type CreateOrderRequest,
  type MpesaPaymentRequest,
} from "@/lib/api/orders";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  tracking: (id: string) => [...orderKeys.all, "tracking", id] as const,
  payment: (id: string) => [...orderKeys.all, "payment", id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** When refetchWhilePending, poll while order is not in a terminal state (track page: 10s; payment confirmation: 3s). */
export function useOrder(
  orderId: string,
  options?: { refetchWhilePending?: boolean; refetchIntervalMs?: number },
) {
  const slug = useOrgSlug();
  const intervalMs = options?.refetchIntervalMs ?? 10_000;
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(slug, orderId),
    enabled: !!orderId,
    staleTime: options?.refetchWhilePending ? 2_000 : 30_000,
    refetchInterval: (query) => {
      if (!options?.refetchWhilePending || !query.state.data) return false;
      const status = (query.state.data as { status?: string }).status;
      if (['delivered', 'completed', 'cancelled'].includes(status ?? '')) return false;
      return intervalMs;
    },
  });
}

export function useOrders(filters?: { status?: string; limit?: number; offset?: number }) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: orderKeys.list(filters ?? {}),
    queryFn: () => listOrders(slug, filters),
    staleTime: 60_000,
  });
}

export function useOrderTracking(orderId: string, enabled = true) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: orderKeys.tracking(orderId),
    queryFn: () => getOrderTracking(slug, orderId),
    enabled: enabled && !!orderId,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function usePaymentStatus(paymentIntentId: string, enabled = true) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: orderKeys.payment(paymentIntentId),
    queryFn: () => getPaymentStatus(slug, paymentIntentId),
    enabled: enabled && !!paymentIntentId,
    refetchInterval: 5_000,
    staleTime: 3_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

export function useCreateOrder() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => createOrder(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useCancelOrder() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      cancelOrder(slug, orderId, reason),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useRateOrder() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, rating, comment }: { orderId: string; rating: number; comment: string }) =>
      rateOrder(slug, orderId, rating, comment),
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
    },
  });
}

export function useInitiateMpesaPayment() {
  const slug = useOrgSlug();
  return useMutation({
    mutationFn: (data: MpesaPaymentRequest) => initiateMpesaPayment(slug, data),
  });
}

export function useApplyPromoCode() {
  const slug = useOrgSlug();
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) =>
      applyPromoCode(slug, code, subtotal),
  });
}
