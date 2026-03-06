"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchProfile } from "@/lib/auth/api";
import type { AuthResponse } from "@/lib/auth/types";

/** TTL for me query: refetch after 5 minutes when stale */
const ME_STALE_TIME_MS = 5 * 60 * 1000;

export const ME_QUERY_KEY = ["me"] as const;

/**
 * Fetches current user profile (roles + permissions) from ordering-backend GET /auth/me.
 * Use for nav visibility, route protection, and permission checks.
 * Only runs when enabled (e.g. when session token exists).
 */
export function useMe(enabled: boolean = true) {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async (): Promise<AuthResponse> => fetchProfile(),
    staleTime: ME_STALE_TIME_MS,
    gcTime: ME_STALE_TIME_MS * 2,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
    enabled,
  });
}
