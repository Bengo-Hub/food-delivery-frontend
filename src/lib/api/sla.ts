import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// Wire format matches ordering-backend internal/modules/sla/domain.go (the
// structs carry explicit snake_case json tags) and the response envelopes in
// internal/http/handlers/sla/handler.go:
//   - SLAMetric          (domain.go:33–48)   — list / breached item
//   - SLASummary         (domain.go:104–113) — GET /sla/stats body
//   - TypeSummary        (domain.go:116–122) — SLASummary.by_type values
//   - ListMetrics  →  { metrics, total }     (handler.go:115–118)
//   - GetBreached  →  { metrics, total }     (handler.go:197–200)
//   - GetStats     →  SLASummary             (handler.go:173)
//
// Routes are mounted under /api/v1/{tenant}/sla/* (handler.go:37–48). All read
// endpoints are guarded by AnalyticsView == "ordering.analytics.view". The
// {tenant} segment is the org slug, consistent with every other ordering route
// via useOrgSlug().

/** MetricType — domain.go:12–20. */
export type SlaMetricType =
  | "order_to_ready"
  | "order_to_pickup"
  | "order_to_delivery"
  | "ready_to_pickup"
  | "pickup_to_delivery"
  | "first_response_time"
  | "ticket_resolution_time";

/** MetricStatus — domain.go:25–30. */
export type SlaMetricStatus = "tracking" | "met" | "breached" | "cancelled";

/** SLAMetric — domain.go:33–48. */
export interface SlaMetric {
  id: string;
  tenant_id: string;
  order_id: string;
  metric_type: SlaMetricType | string;
  target_seconds: number;
  actual_seconds?: number | null;
  status: SlaMetricStatus | string;
  breach_percentage?: number | null;
  started_at: string;
  ended_at?: string | null;
  measured_at: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** TypeSummary — domain.go:116–122. */
export interface SlaTypeSummary {
  total: number;
  met: number;
  breached: number;
  compliance_rate: number;
  average_seconds: number;
}

/** SLASummary — domain.go:104–113 (GET /sla/stats). */
export interface SlaSummary {
  tenant_id: string;
  period: string;
  total_metrics: number;
  met_metrics: number;
  breached_metrics: number;
  compliance_rate: number;
  average_breach_percentage: number;
  by_type?: Record<string, SlaTypeSummary> | null;
}

/** Optional filters for GET /sla/metrics — handler.go:75–107. */
export interface SlaMetricListParams {
  orderId?: string;
  metricType?: SlaMetricType | string;
  status?: SlaMetricStatus | string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface SlaMetricListResult {
  metrics: SlaMetric[];
  total: number;
}

// ─── API Functions ───────────────────────────────────────────────────

/** List SLA metrics for the tenant. Unwraps the { metrics, total } envelope. */
export async function listSlaMetrics(
  slug: string,
  params: SlaMetricListParams = {},
): Promise<SlaMetricListResult> {
  const res = await api.get(`${slug}/sla/metrics`, { params });
  const body = res.data ?? {};
  return {
    metrics: body.metrics ?? [],
    total: body.total ?? 0,
  };
}

/** Get aggregate SLA statistics for the tenant (defaults to last 7 days). */
export async function getSlaStats(
  slug: string,
  params: { from?: string; to?: string } = {},
): Promise<SlaSummary | null> {
  const res = await api.get(`${slug}/sla/stats`, { params });
  return res.data ?? null;
}

/** List recent breached SLA metrics. Unwraps the { metrics, total } envelope. */
export async function listBreachedSlaMetrics(
  slug: string,
  params: { limit?: number } = {},
): Promise<SlaMetricListResult> {
  const res = await api.get(`${slug}/sla/breached`, { params });
  const body = res.data ?? {};
  return {
    metrics: body.metrics ?? [],
    total: body.total ?? 0,
  };
}
