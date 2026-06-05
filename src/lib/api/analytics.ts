import type { AxiosError } from "axios";

import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// Wire format matches ordering-backend internal/modules/analytics/domain.go
// and the response envelopes in internal/http/handlers/analytics/handler.go:
//   - DashboardInfo   (domain.go:28–35)   — items in GET /analytics/dashboards
//   - DashboardEmbed  (domain.go:20–26)   — GET /analytics/dashboards/{module}/embed
//   - ListDashboards  →  { data: DashboardInfo[] }  (handler.go:73–75)
//   - GetDashboardInfo →  DashboardInfo             (handler.go:107)
//   - GetDashboardEmbed → DashboardEmbed            (handler.go:156)
//   - GetStatus       →  { enabled, superset_url }  (handler.go:166–172)
//
// Routes are mounted under /api/v1/{tenant}/analytics/* (handler.go:36–48). The
// whole group is guarded by RequireAuth + RequirePlan("PROFESSIONAL") +
// RequireFeature("advanced_analytics") (handler.go:37–39), so any request can
// come back 403 with a subscription/upgrade payload — callers should treat that
// as "feature not enabled" rather than a hard error. The {tenant} segment is the
// org slug, consistent with every other ordering route via useOrgSlug().

/** DashboardModule — domain.go:9–18. */
export type AnalyticsDashboardModule =
  | "orders"
  | "revenue"
  | "customers"
  | "operations"
  | "subscription";

/** DashboardInfo — domain.go:28–35. */
export interface AnalyticsDashboardInfo {
  id: number;
  module: AnalyticsDashboardModule | string;
  title: string;
  description?: string;
  url?: string;
}

/** DashboardEmbed — domain.go:20–26. */
export interface AnalyticsDashboardEmbed {
  module: AnalyticsDashboardModule | string;
  url: string;
  token: string;
  expires_at: string;
}

/** GET /analytics/status — handler.go:166–172. */
export interface AnalyticsStatus {
  enabled: boolean;
  superset_url: string;
}

/**
 * Thrown when the analytics feature is gated off (advanced_analytics not on the
 * tenant's plan). The base client surfaces these as 403 with a subscription /
 * upgrade payload; we normalise that here so the UI can render an upgrade state.
 */
export class AnalyticsFeatureDisabledError extends Error {
  readonly code = "feature_disabled";
  constructor(message = "Advanced analytics is not enabled on your plan.") {
    super(message);
    this.name = "AnalyticsFeatureDisabledError";
  }
}

function isFeatureDisabled(err: unknown): boolean {
  const ax = err as AxiosError<{ code?: string; upgrade?: boolean }>;
  // Treat any 403 on the analytics group as a feature/plan gate. The whole route
  // group is wrapped in RequirePlan("PROFESSIONAL") + RequireFeature(
  // "advanced_analytics") (handler.go:38–39), so a 403 here always means the
  // tenant's plan doesn't include advanced analytics — the page should render
  // the upgrade state rather than a hard error.
  return ax?.response?.status === 403;
}

// ─── API Functions ───────────────────────────────────────────────────

/** List available analytics dashboards. Unwraps the { data } envelope. */
export async function listAnalyticsDashboards(
  slug: string,
): Promise<AnalyticsDashboardInfo[]> {
  try {
    const res = await api.get(`${slug}/analytics/dashboards`);
    const body = res.data ?? {};
    return (body.data ?? body) as AnalyticsDashboardInfo[];
  } catch (err) {
    if (isFeatureDisabled(err)) throw new AnalyticsFeatureDisabledError();
    throw err;
  }
}

/** Get info for a single dashboard module. */
export async function getAnalyticsDashboardInfo(
  slug: string,
  module: string,
): Promise<AnalyticsDashboardInfo> {
  try {
    const res = await api.get(`${slug}/analytics/dashboards/${module}`);
    return res.data as AnalyticsDashboardInfo;
  } catch (err) {
    if (isFeatureDisabled(err)) throw new AnalyticsFeatureDisabledError();
    throw err;
  }
}

/** Get an embed URL (and short-lived token) for a dashboard module. */
export async function getAnalyticsDashboardEmbed(
  slug: string,
  module: string,
): Promise<AnalyticsDashboardEmbed> {
  try {
    const res = await api.get(`${slug}/analytics/dashboards/${module}/embed`);
    return res.data as AnalyticsDashboardEmbed;
  } catch (err) {
    if (isFeatureDisabled(err)) throw new AnalyticsFeatureDisabledError();
    throw err;
  }
}

/** Get analytics service status (whether Superset is wired up). */
export async function getAnalyticsStatus(
  slug: string,
): Promise<AnalyticsStatus> {
  try {
    const res = await api.get(`${slug}/analytics/status`);
    const body = res.data ?? {};
    return {
      enabled: !!body.enabled,
      superset_url: body.superset_url ?? "",
    };
  } catch (err) {
    if (isFeatureDisabled(err)) throw new AnalyticsFeatureDisabledError();
    throw err;
  }
}
