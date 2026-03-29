"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProfileFromSSO } from "@/lib/auth/api";
import type { AuthResponse } from "@/lib/auth/types";
import { useAuthStore } from "@/store/auth";

/** TTL for me query: refetch after 5 minutes when stale */
const ME_STALE_TIME_MS = 5 * 60 * 1000;

export const ME_QUERY_KEY = ["me"] as const;

/**
 * Fetches current user profile (roles + permissions) from SSO auth-api GET /api/v1/auth/me.
 * Uses SSO directly (no JIT sync delay). Use for nav visibility, route protection, and permission checks.
 */
export function useMe(enabled: boolean = true) {
  const accessToken = useAuthStore((s) => s.session?.accessToken);

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async (): Promise<AuthResponse> => fetchProfileFromSSO(accessToken ?? ""),
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
