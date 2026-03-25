"use client";

import { useEffect, useMemo } from "react";

import { getUseCaseCopy, type UseCaseCopy, type UseCaseKey } from "@/lib/use-case-copy";
import { useTenantBranding } from "@/providers/branding-provider";
import { useDiningModeStore } from "@/store/dining-mode";

export interface TenantConfig {
  /** Raw use_case value from auth-api tenant */
  useCase: string;
  /** Resolved copy strings for this use case */
  copy: UseCaseCopy;
  /** Convenience flags */
  isHospitality: boolean;
  isRetail: boolean;
  isPharmacy: boolean;
  isServices: boolean;
  isQuickService: boolean;
  isManufacturing: boolean;
  isEcommerce: boolean;
  isWarehousing: boolean;
  /** Feature flags derived from use case */
  supportsPickup: boolean;
  supportsDelivery: boolean;
  supportsScheduling: boolean;
  supportsAppointments: boolean;
  requiresAgeVerification: boolean;
}

/** Use cases where pickup makes sense */
const PICKUP_USE_CASES = new Set<string>([
  "hospitality",
  "retail",
  "quick_service",
  "pharmacy",
  "services",
]);

/** Use cases that may require age verification for some items */
const AGE_VERIFY_USE_CASES = new Set<string>(["pharmacy", "retail"]);

/** Use cases that support appointment booking */
const APPOINTMENT_USE_CASES = new Set<string>(["services"]);

/**
 * Hook that provides tenant use-case configuration and industry-appropriate copy.
 * Reads the tenant use_case from the branding provider and syncs it
 * to the dining-mode store.
 */
export function useTenantConfig(): TenantConfig {
  const { tenant } = useTenantBranding();
  const setTenantUseCase = useDiningModeStore((s) => s.setTenantUseCase);

  const useCase = tenant?.useCase ?? "other";

  // Sync use case to dining-mode store so pickup/delivery modes update
  useEffect(() => {
    if (useCase) {
      setTenantUseCase(useCase);
    }
  }, [useCase, setTenantUseCase]);

  return useMemo<TenantConfig>(() => {
    const copy = getUseCaseCopy(useCase);
    return {
      useCase,
      copy,
      isHospitality: useCase === "hospitality",
      isRetail: useCase === "retail",
      isPharmacy: useCase === "pharmacy",
      isServices: useCase === "services",
      isQuickService: useCase === "quick_service",
      isManufacturing: useCase === "manufacturing",
      isEcommerce: useCase === "e_commerce",
      isWarehousing: useCase === "warehousing",
      supportsPickup: PICKUP_USE_CASES.has(useCase),
      supportsDelivery: true, // all use cases support delivery
      supportsScheduling: true, // all use cases support scheduling
      supportsAppointments: APPOINTMENT_USE_CASES.has(useCase),
      requiresAgeVerification: AGE_VERIFY_USE_CASES.has(useCase),
    };
  }, [useCase]);
}
