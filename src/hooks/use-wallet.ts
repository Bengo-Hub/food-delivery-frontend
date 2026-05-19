"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getWalletBalance, getWalletTransactions, initiateWalletTopUp } from "@/lib/api/wallet";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const walletKeys = {
  all: ["wallet"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  transactions: (params?: { limit?: number; offset?: number }) =>
    [...walletKeys.all, "transactions", params] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

export function useWalletBalance() {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => getWalletBalance(slug),
    staleTime: 30_000,
  });
}

export function useWalletTransactions(params?: { limit?: number; offset?: number }) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: walletKeys.transactions(params),
    queryFn: () => getWalletTransactions(slug, params),
    staleTime: 30_000,
  });
}

export function useInitiateWalletTopUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      amount,
      currency,
      customerEmail,
      paymentMethod,
    }: {
      amount: number;
      currency?: string;
      customerEmail?: string;
      paymentMethod?: string;
    }) => initiateWalletTopUp(amount, currency, customerEmail, paymentMethod),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      void queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
    },
  });
}
