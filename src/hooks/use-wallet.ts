"use client";

import { useQuery } from "@tanstack/react-query";

import { getWalletBalance, getWalletTransactions } from "@/lib/api/wallet";
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
