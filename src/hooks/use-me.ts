"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProfile, fetchProfileFromSSO } from "@/lib/auth/api";
import type { AuthResponse } from "@/lib/auth/types";
import { useAuthStore } from "@/store/auth";

/** TTL for me query: refetch after 5 minutes when stale */
const ME_STALE_TIME_MS = 5 * 60 * 1000;

export const ME_QUERY_KEY = ["me"] as const;

/**
 * Fetches current user profile with service-level RBAC permissions merged in.
 *
 * Primary: ordering-backend GET /api/v1/{tenant}/auth/me — merges JWT claims with
 * service-level roles/permissions from the local RBAC DB (Layer 3 of Trinity pattern).
 * Fallback: SSO GET /api/v1/auth/me — used when the user is not yet JIT-synced (404)
 * or when the tenant slug is not known yet.
 *
 * The 401 interceptor in base.ts skips /auth/me URLs, so this never triggers a logout loop.
 */
export function useMe(enabled: boolean = true) {
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const tenantSlug = useAuthStore((s) => s.user?.tenant_slug);

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async (): Promise<AuthResponse> => {
      const slug =
        tenantSlug ??
        (typeof window !== "undefined" ? localStorage.getItem("tenantSlug") : null);

      if (slug) {
        try {
          // Primary: ordering-backend /auth/me enriches JWT permissions with service-level RBAC
          return await fetchProfile(slug);
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          // 404 = user not yet JIT-synced into ordering-backend; use SSO profile as fallback
          if (status === 404) {
            return await fetchProfileFromSSO(accessToken ?? "");
          }
          // 401/403/5xx propagate — retry logic and 401 interceptor handle them
          throw err;
        }
      }

      // No tenant slug available yet — SSO /auth/me as fallback
      return await fetchProfileFromSSO(accessToken ?? "");
    },
    staleTime: ME_STALE_TIME_MS,
    gcTime: ME_STALE_TIME_MS * 2,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    enabled: enabled && !!accessToken,
  });
}
