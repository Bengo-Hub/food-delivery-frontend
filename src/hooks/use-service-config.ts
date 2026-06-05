"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listAdminServiceConfig,
  listServiceConfig,
  updateAdminServiceConfig,
  updateServiceConfig,
  type ServiceConfigItem,
} from "@/lib/api/settings";

// ─── Tenant UUID helper ──────────────────────────────────────────────
//
// The service-config endpoints parse the {tenant} path segment as a UUID
// (no slug fallback), so these hooks read the tenant UUID from localStorage
// ("tenantId") rather than the org slug used by most other endpoints.

function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tenantId");
}

// ─── Query Keys ──────────────────────────────────────────────────────

export const serviceConfigKeys = {
  all: ["service-config"] as const,
  tenant: (tenantId: string) =>
    [...serviceConfigKeys.all, "tenant", tenantId] as const,
  admin: (tenantId: string) =>
    [...serviceConfigKeys.all, "admin", tenantId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** Lists merged tenant+platform service configs (secrets masked). */
export function useServiceConfig() {
  const tenantId = getTenantId();
  return useQuery<ServiceConfigItem[]>({
    queryKey: serviceConfigKeys.tenant(tenantId ?? ""),
    queryFn: () => listServiceConfig(tenantId!),
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

/** Lists platform default service configs (unmasked) — superuser-only. */
export function useAdminServiceConfig(enabled: boolean = true) {
  const tenantId = getTenantId();
  return useQuery<ServiceConfigItem[]>({
    queryKey: serviceConfigKeys.admin(tenantId ?? ""),
    queryFn: () => listAdminServiceConfig(tenantId!),
    enabled: enabled && !!tenantId,
    staleTime: 60_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * Upsert a tenant service-config override. Objects/arrays are JSON-stringified
 * by the underlying api helper.
 */
export function useUpdateServiceConfig() {
  const queryClient = useQueryClient();
  const tenantId = getTenantId();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => {
      if (!tenantId) {
        throw new Error("Missing tenant ID — please sign in again.");
      }
      return updateServiceConfig(tenantId, key, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceConfigKeys.all });
      // fee_config is mirrored into tenant config; refresh that too.
      queryClient.invalidateQueries({ queryKey: ["tenant-config"] });
    },
  });
}

/** Upsert a platform default config value — superuser-only on the backend. */
export function useUpdateAdminServiceConfig() {
  const queryClient = useQueryClient();
  const tenantId = getTenantId();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => {
      if (!tenantId) {
        throw new Error("Missing tenant ID — please sign in again.");
      }
      return updateAdminServiceConfig(tenantId, key, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceConfigKeys.all });
    },
  });
}
