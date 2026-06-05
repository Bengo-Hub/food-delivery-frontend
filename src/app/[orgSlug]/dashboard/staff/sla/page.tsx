"use client";

import { AlertTriangle, CheckCircle2, Gauge, Loader2, Timer } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreachedSlaMetrics, useSlaStats } from "@/hooks/use-sla";
import type { SlaMetric, SlaSummary } from "@/lib/api/sla";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSeconds(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins ? `${hours}h ${remMins}m` : `${hours}h`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function humanMetricType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Summary stat cards ──────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SummarySection() {
  const { data: stats, isLoading } = useSlaStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || stats.total_metrics === 0) {
    return (
      <div className="py-10 text-center">
        <Gauge className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No SLA metrics recorded for the selected period yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Gauge}
          label="Compliance Rate"
          value={formatPercent(stats.compliance_rate)}
          hint={stats.period || undefined}
        />
        <StatCard
          icon={Timer}
          label="Total Metrics"
          value={String(stats.total_metrics)}
        />
        <StatCard
          icon={CheckCircle2}
          label="Met"
          value={String(stats.met_metrics)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Breached"
          value={String(stats.breached_metrics)}
          hint={`Avg breach ${formatPercent(stats.average_breach_percentage)}`}
        />
      </div>

      <ByTypeBreakdown stats={stats} />
    </div>
  );
}

function ByTypeBreakdown({ stats }: { stats: SlaSummary }) {
  const entries = Object.entries(stats.by_type ?? {});
  if (entries.length === 0) return null;

  return (
    <div className="divide-y rounded-lg border border-border">
      <div className="grid grid-cols-[1.5fr_repeat(4,1fr)] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Metric Type</span>
        <span className="text-right">Total</span>
        <span className="text-right">Met</span>
        <span className="text-right">Breached</span>
        <span className="text-right">Compliance</span>
      </div>
      {entries.map(([type, summary]) => (
        <div
          key={type}
          className="grid grid-cols-[1.5fr_repeat(4,1fr)] items-center gap-3 px-4 py-3 text-sm"
        >
          <span className="font-medium">{humanMetricType(type)}</span>
          <span className="text-right">{summary.total}</span>
          <span className="text-right text-emerald-600">{summary.met}</span>
          <span className="text-right text-destructive">{summary.breached}</span>
          <span className="text-right">{formatPercent(summary.compliance_rate)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Breached orders table ────────────────────────────────────────────────────

function BreachedTable() {
  const { data, isLoading } = useBreachedSlaMetrics(50);
  const metrics = data?.metrics ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="py-10 text-center">
        <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-600" />
        <p className="text-sm text-muted-foreground">No breached SLAs. Nice work.</p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border border-border">
      <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr_1fr] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Order</span>
        <span>Metric</span>
        <span className="text-right">Target</span>
        <span className="text-right">Actual</span>
        <span className="text-right">Breach</span>
        <span>Measured</span>
      </div>
      {metrics.map((m: SlaMetric) => (
        <div
          key={m.id}
          className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-3 px-4 py-3 text-sm"
        >
          <code
            className="truncate font-mono text-xs text-muted-foreground"
            title={m.order_id}
          >
            {m.order_id}
          </code>
          <span className="flex items-center gap-2">
            {humanMetricType(String(m.metric_type))}
            {m.status === "breached" ? (
              <Badge variant="outline" className="text-destructive">
                Breached
              </Badge>
            ) : null}
          </span>
          <span className="text-right">{formatSeconds(m.target_seconds)}</span>
          <span className="text-right">{formatSeconds(m.actual_seconds)}</span>
          <span className="text-right text-destructive">
            {formatPercent(m.breach_percentage)}
          </span>
          <span className="text-xs text-muted-foreground">
            {m.measured_at ? new Date(m.measured_at).toLocaleString() : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SlaDashboardPage() {
  return (
    <RequireAuth
      roles={["admin", "superuser", "manager"]}
      permissions={["ordering.analytics.view"]}
      permissionOperator="or"
    >
      <SiteShell>
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Operations
            </p>
            <h1 className="text-2xl font-bold">SLA Performance</h1>
            <p className="text-sm text-muted-foreground">
              Service-level metrics for fulfilment and support. Compliance figures
              cover the last 7 days.
            </p>
          </header>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="size-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SummarySection />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5" />
                  Breached Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BreachedTable />
              </CardContent>
            </Card>
          </div>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
