"use client";

import { useMemo } from "react";

import { getUseCaseCopy, type UseCaseCopy } from "@/lib/use-case-copy";
import { orderingConfigFor, normalizeOrderingUseCase, type OrderingConfig, type OrderingProfile } from "@/lib/use-case-config";
import { useTenantBranding } from "@/providers/branding-provider";
import { useOutletFilterStore } from "@/store/outlet-filter";

export interface ResolvedOrderingConfig {
  /** Effective raw use_case driving the storefront (selected outlet › tenant). */
  useCase: string;
  /** Canonical behavioural profile. */
  profile: OrderingProfile;
  /** Behavioural flags (layout / CTA / dietary / booking). */
  config: OrderingConfig;
  /** Industry terminology strings. */
  copy: UseCaseCopy;
}

/**
 * useOrderingConfig resolves the storefront's effective use_case and returns the
 * matching behavioural config + copy. Resolution order: an explicit `override`
 * (e.g. the outlet currently being browsed) › the HQ/admin selected outlet ›
 * the tenant's own use_case. This is the storefront analogue of pos-ui's
 * `useTerminal().cfg` — the single source of truth views read to adapt per
 * vertical (food vs retail vs pharmacy vs services vs ticketing).
 */
export function useOrderingConfig(override?: string | null): ResolvedOrderingConfig {
  const { tenant } = useTenantBranding();
  const selectedOutlet = useOutletFilterStore((s) => s.selectedOutlet);

  const useCase =
    (override && override.trim()) ||
    (selectedOutlet?.useCase && selectedOutlet.useCase.trim()) ||
    tenant?.useCase ||
    "other";

  return useMemo<ResolvedOrderingConfig>(
    () => ({
      useCase,
      profile: normalizeOrderingUseCase(useCase),
      config: orderingConfigFor(useCase),
      copy: getUseCaseCopy(useCase),
    }),
    [useCase],
  );
}
