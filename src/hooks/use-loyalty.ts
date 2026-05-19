"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getLoyaltyAccount,
  getLoyaltyTransactions,
  getTierBenefits,
  registerLoyaltyAccount,
} from "@/lib/api/loyalty";
import { useOrgSlug } from "@/providers/org-slug-provider";

export const loyaltyKeys = {
  all: ["loyalty"] as const,
  account: () => [...loyaltyKeys.all, "account"] as const,
  transactions: (filters: Record<string, unknown>) =>
    [...loyaltyKeys.all, "transactions", filters] as const,
  tierBenefits: () => [...loyaltyKeys.all, "tier-benefits"] as const,
};

export function useLoyaltyAccount() {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: loyaltyKeys.account(),
    queryFn: () => getLoyaltyAccount(slug),
    staleTime: 5 * 60_000,
  });
}

export function useLoyaltyTransactions(params?: { limit?: number; page?: number }) {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: loyaltyKeys.transactions(params ?? {}),
    queryFn: () => getLoyaltyTransactions(slug, params),
    staleTime: 60_000,
  });
}

export function useTierBenefits() {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: loyaltyKeys.tierBenefits(),
    queryFn: () => getTierBenefits(slug),
    staleTime: 30 * 60_000,
  });
}

export function useRegisterLoyalty() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => registerLoyaltyAccount(slug),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: loyaltyKeys.account() });
    },
  });
}
