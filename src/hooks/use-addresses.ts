"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  type CreateAddressRequest,
} from "@/lib/api/addresses";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const addressKeys = {
  all: ["addresses"] as const,
  list: () => [...addressKeys.all, "list"] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

export function useAddresses() {
  const slug = useOrgSlug();
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: () => getAddresses(slug),
    staleTime: 60_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

export function useCreateAddress() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAddressRequest) => createAddress(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}

export function useDeleteAddress() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAddress(slug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}

export function useSetDefaultAddress() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(slug, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.list() });
    },
  });
}
