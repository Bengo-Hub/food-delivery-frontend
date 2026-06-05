"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deactivateGateway,
  listAvailableGateways,
  listSelectedGateways,
  selectGateway,
  type AvailableGateway,
  type SelectedGateway,
} from "@/lib/api/gateways";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const gatewayKeys = {
  all: ["gateways"] as const,
  available: (slug: string) => [...gatewayKeys.all, "available", slug] as const,
  selected: (slug: string) => [...gatewayKeys.all, "selected", slug] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** List the payment gateways available to the tenant. */
export function useAvailableGateways() {
  const slug = useOrgSlug();
  return useQuery<AvailableGateway[]>({
    queryKey: gatewayKeys.available(slug),
    queryFn: () => listAvailableGateways(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

/** List the gateways the tenant has selected/enabled. */
export function useSelectedGateways() {
  const slug = useOrgSlug();
  return useQuery<SelectedGateway[]>({
    queryKey: gatewayKeys.selected(slug),
    queryFn: () => listSelectedGateways(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/** Select (enable) a gateway, invalidating the gateway lists on success. */
export function useSelectGateway() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { gatewayType: string; isPrimary?: boolean }) =>
      selectGateway(slug, vars.gatewayType, vars.isPrimary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatewayKeys.available(slug) });
      queryClient.invalidateQueries({ queryKey: gatewayKeys.selected(slug) });
    },
  });
}

/** Deactivate (disable) a gateway, invalidating the gateway lists on success. */
export function useDeactivateGateway() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gatewayType: string) => deactivateGateway(slug, gatewayType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatewayKeys.available(slug) });
      queryClient.invalidateQueries({ queryKey: gatewayKeys.selected(slug) });
    },
  });
}
