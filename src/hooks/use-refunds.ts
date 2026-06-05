"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRefund,
  getRefund,
  listRefunds,
  type CreateRefundRequest,
  type Refund,
  type RefundListParams,
  type RefundListResult,
} from "@/lib/api/refunds";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const refundKeys = {
  all: ["refunds"] as const,
  list: (slug: string, params: RefundListParams) =>
    [...refundKeys.all, "list", slug, params] as const,
  detail: (slug: string, id: string) => [...refundKeys.all, "detail", slug, id] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** List refunds for the current tenant. */
export function useRefunds(params: RefundListParams = {}) {
  const slug = useOrgSlug();
  return useQuery<RefundListResult>({
    queryKey: refundKeys.list(slug, params),
    queryFn: () => listRefunds(slug, params),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

/** Get a single refund by ID. */
export function useRefund(id: string | null | undefined) {
  const slug = useOrgSlug();
  return useQuery<Refund>({
    queryKey: refundKeys.detail(slug, id ?? ""),
    queryFn: () => getRefund(slug, id as string),
    enabled: !!slug && !!id,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/** Create a refund, invalidating the refund list(s) on success. */
export function useCreateRefund() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRefundRequest) => createRefund(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
    },
  });
}
