"use client";

import { useEffect, useMemo } from "react";

import { useBrandConfig } from "@/hooks/use-brand";
import { getUseCaseCopy, type UseCaseCopy } from "@/lib/use-case-copy";
import { orderingConfigFor, normalizeOrderingUseCase, type OrderingConfig, type OrderingProfile } from "@/lib/use-case-config";
import { useDiningModeStore } from "@/store/dining-mode";
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
 * the tenant's own use_case (from ordering-backend's /config — see useBrandConfig,
 * the single source of truth for all tenant display data). This is the storefront
 * analogue of pos-ui's `useTerminal().cfg` — the single source of truth views read
 * to adapt per vertical (food vs retail vs pharmacy vs services vs ticketing).
 *
 * Also syncs the TENANT-level use_case into the dining-mode store (drives
 * pickup/delivery availability) — but only when called with no `override`, so a
 * page browsing one specific outlet's vertical (e.g. the outlet-detail page passing
 * `outlet.businessType`) never skews the global dining-mode toggle away from the
 * tenant's own default. This absorbs what used to be a second, separate hook
 * (use-tenant-config.ts) whose only other job (a `copy` lookup) duplicated this one.
 */
export function useOrderingConfig(override?: string | null): ResolvedOrderingConfig {
  const { data: brandConfig } = useBrandConfig();
  const selectedOutlet = useOutletFilterStore((s) => s.selectedOutlet);
  const setTenantUseCase = useDiningModeStore((s) => s.setTenantUseCase);

  const useCase =
    (override && override.trim()) ||
    (selectedOutlet?.useCase && selectedOutlet.useCase.trim()) ||
    brandConfig?.useCase ||
    "other";

  useEffect(() => {
    if (!override && brandConfig?.useCase) {
      setTenantUseCase(brandConfig.useCase);
    }
  }, [override, brandConfig?.useCase, setTenantUseCase]);

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
