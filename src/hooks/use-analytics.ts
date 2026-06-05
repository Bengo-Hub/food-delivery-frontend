"use client";

import { useQuery } from "@tanstack/react-query";

import {
  AnalyticsFeatureDisabledError,
  getAnalyticsDashboardEmbed,
  getAnalyticsStatus,
  listAnalyticsDashboards,
  type AnalyticsDashboardEmbed,
  type AnalyticsDashboardInfo,
  type AnalyticsStatus,
} from "@/lib/api/analytics";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const analyticsKeys = {
  all: ["analytics"] as const,
  status: (slug: string) => [...analyticsKeys.all, "status", slug] as const,
  dashboards: (slug: string) =>
    [...analyticsKeys.all, "dashboards", slug] as const,
  embed: (slug: string, module: string) =>
    [...analyticsKeys.all, "embed", slug, module] as const,
};

// Don't retry when the feature is gated off — the answer won't change.
function noRetryOnFeatureDisabled(failureCount: number, error: unknown) {
  if (error instanceof AnalyticsFeatureDisabledError) return false;
  return failureCount < 2;
}

// ─── Queries ─────────────────────────────────────────────────────────

/** Whether the analytics (Superset) backend is wired up for the tenant. */
export function useAnalyticsStatus() {
  const slug = useOrgSlug();
  return useQuery<AnalyticsStatus>({
    queryKey: analyticsKeys.status(slug),
    queryFn: () => getAnalyticsStatus(slug),
    enabled: !!slug,
    staleTime: 5 * 60_000,
    retry: noRetryOnFeatureDisabled,
  });
}

/** List the analytics dashboards available to the tenant. */
export function useAnalyticsDashboards() {
  const slug = useOrgSlug();
  return useQuery<AnalyticsDashboardInfo[]>({
    queryKey: analyticsKeys.dashboards(slug),
    queryFn: () => listAnalyticsDashboards(slug),
    enabled: !!slug,
    staleTime: 5 * 60_000,
    retry: noRetryOnFeatureDisabled,
  });
}

/** Get a short-lived embed URL + token for a single dashboard module. */
export function useAnalyticsDashboardEmbed(module: string | null | undefined) {
  const slug = useOrgSlug();
  return useQuery<AnalyticsDashboardEmbed>({
    queryKey: analyticsKeys.embed(slug, module ?? ""),
    queryFn: () => getAnalyticsDashboardEmbed(slug, module as string),
    enabled: !!slug && !!module,
    // Embed tokens are short-lived; refetch fairly aggressively when stale.
    staleTime: 60_000,
    retry: noRetryOnFeatureDisabled,
  });
}
