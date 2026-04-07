"use client";

import { useQuery } from "@tanstack/react-query";

import { checkZone, type ZoneCheckResult } from "@/lib/api/zones";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const zoneKeys = {
  all: ["zones"] as const,
  check: (lat: number, lng: number) => [...zoneKeys.all, "check", lat, lng] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/**
 * Check if coordinates are within a delivery zone.
 * Returns ZoneCheckResult if serviceable, null if not.
 */
export function useZoneCheck(lat: number | null, lng: number | null) {
  const slug = useOrgSlug();
  return useQuery<ZoneCheckResult | null>({
    queryKey: zoneKeys.check(lat ?? 0, lng ?? 0),
    queryFn: () => checkZone(slug, lat!, lng!),
    enabled: lat != null && lng != null,
    staleTime: 60_000,
  });
}
