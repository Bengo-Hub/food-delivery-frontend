"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getSlaStats,
  listBreachedSlaMetrics,
  listSlaMetrics,
  type SlaMetricListParams,
  type SlaMetricListResult,
  type SlaSummary,
} from "@/lib/api/sla";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const slaKeys = {
  all: ["sla"] as const,
  stats: (slug: string) => [...slaKeys.all, "stats", slug] as const,
  metrics: (slug: string, params: SlaMetricListParams) =>
    [...slaKeys.all, "metrics", slug, params] as const,
  breached: (slug: string, limit: number) =>
    [...slaKeys.all, "breached", slug, limit] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** Aggregate SLA statistics for the tenant (last 7 days by default). */
export function useSlaStats() {
  const slug = useOrgSlug();
  return useQuery<SlaSummary | null>({
    queryKey: slaKeys.stats(slug),
    queryFn: () => getSlaStats(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

/** List SLA metrics for the tenant. */
export function useSlaMetrics(params: SlaMetricListParams = {}) {
  const slug = useOrgSlug();
  return useQuery<SlaMetricListResult>({
    queryKey: slaKeys.metrics(slug, params),
    queryFn: () => listSlaMetrics(slug, params),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

/** List recent breached SLA metrics. */
export function useBreachedSlaMetrics(limit = 50) {
  const slug = useOrgSlug();
  return useQuery<SlaMetricListResult>({
    queryKey: slaKeys.breached(slug, limit),
    queryFn: () => listBreachedSlaMetrics(slug, { limit }),
    enabled: !!slug,
    staleTime: 30_000,
  });
}
