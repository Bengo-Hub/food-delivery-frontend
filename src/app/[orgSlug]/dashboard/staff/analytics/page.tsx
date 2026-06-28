"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  DollarSign,
  ExternalLink,
  Loader2,
  Lock,
  RefreshCcw,
  Settings2,
  ShoppingBag,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAnalyticsDashboardEmbed,
  useAnalyticsDashboards,
  useAnalyticsStatus,
} from "@/hooks/use-analytics";
import { AnalyticsFeatureDisabledError } from "@/lib/api/analytics";
import type { AnalyticsDashboardInfo } from "@/lib/api/analytics";

const SUBSCRIBE_URL =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_UI_URL ||
  "https://pricing.codevertexitsolutions.com";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MODULE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  orders: ShoppingBag,
  revenue: DollarSign,
  customers: Users,
  operations: ClipboardList,
  subscription: BarChart3,
};

function moduleIcon(module: string) {
  return MODULE_ICONS[module] ?? BarChart3;
}

function humanModule(module: string): string {
  return module.charAt(0).toUpperCase() + module.slice(1);
}

function isFeatureDisabled(err: unknown): boolean {
  return err instanceof AnalyticsFeatureDisabledError;
}

// ── Upgrade / feature-disabled state ─────────────────────────────────────────

function FeatureDisabledState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Lock className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          Advanced analytics not enabled on your plan
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Upgrade to the Professional plan (or higher) to unlock dashboards for
          orders, revenue, customers and operations.
        </p>
      </div>
      <Button size="sm" className="gap-1.5" asChild>
        <Link href={`${SUBSCRIBE_URL}/subscribe`}>
          <Zap className="size-3.5" />
          Upgrade plan
        </Link>
      </Button>
    </div>
  );
}

// ── Embedded dashboard ───────────────────────────────────────────────────────

function DashboardEmbed({ module }: { module: string }) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAnalyticsDashboardEmbed(module);

  if (isFeatureDisabled(error)) {
    return <FeatureDisabledState />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data?.url) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            This dashboard isn&apos;t available right now
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            The analytics service may still be configuring this dashboard. Try
            again in a moment.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => void refetch()}
        >
          <RefreshCcw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="size-3.5" />
          )}
          Refresh
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" asChild>
          <a href={data.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            Open
          </a>
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <iframe
          key={data.url}
          src={data.url}
          title={`${humanModule(module)} analytics dashboard`}
          className="h-[600px] w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}

// ── Dashboard picker (cards + tabs) ──────────────────────────────────────────

function DashboardCard({
  dashboard,
  active,
  onSelect,
}: {
  dashboard: AnalyticsDashboardInfo;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = moduleIcon(String(dashboard.module));
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50",
      ].join(" ")}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold capitalize">
          {dashboard.title || humanModule(String(dashboard.module))}
        </p>
        {dashboard.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {dashboard.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function AnalyticsContent() {
  const { hasFeature, isLoading: subLoading } = useSubscription();
  const {
    data: dashboards,
    isLoading,
    isError,
    error,
  } = useAnalyticsDashboards();
  const { data: status } = useAnalyticsStatus();

  const [activeModule, setActiveModule] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const order = ["orders", "revenue", "customers", "operations", "subscription"];
    return [...(dashboards ?? [])].sort(
      (a, b) =>
        order.indexOf(String(a.module)) - order.indexOf(String(b.module)),
    );
  }, [dashboards]);

  useEffect(() => {
    if (!activeModule && sorted.length > 0) {
      setActiveModule(String(sorted[0]!.module));
    }
  }, [sorted, activeModule]);

  // Plan-level gate: hide dashboards when the tenant's plan lacks advanced analytics.
  // Exempt tenants (platform owner / demo / service_charge) pass via hasFeature.
  if (isFeatureDisabled(error) || (!subLoading && !hasFeature("advanced_analytics"))) {
    return <FeatureDisabledState />;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-10 text-center">
        <AlertTriangle className="mx-auto mb-2 size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load analytics dashboards. Please try again later.
        </p>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="py-10 text-center">
        <BarChart3 className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No analytics dashboards are configured for your account yet.
        </p>
        {status && !status.enabled ? (
          <p className="mt-1 text-xs text-muted-foreground">
            The analytics service is not enabled on the server.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard picker cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((d) => (
          <DashboardCard
            key={String(d.module)}
            dashboard={d}
            active={activeModule === String(d.module)}
            onSelect={() => setActiveModule(String(d.module))}
          />
        ))}
      </div>

      {/* Tabs mirror the cards for quick switching on smaller screens */}
      {activeModule ? (
        <Tabs
          value={activeModule}
          onValueChange={setActiveModule}
          className="w-full"
        >
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            {sorted.map((d) => {
              const Icon = moduleIcon(String(d.module));
              return (
                <TabsTrigger
                  key={String(d.module)}
                  value={String(d.module)}
                  className="gap-1.5 capitalize"
                >
                  <Icon className="size-3.5" />
                  {d.title || humanModule(String(d.module))}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      ) : null}

      {/* Embedded dashboard for the selected module */}
      {activeModule ? <DashboardEmbed module={activeModule} /> : null}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboardPage() {
  const { data: status } = useAnalyticsStatus();

  return (
    <RequireAuth
      roles={["admin", "superuser", "manager"]}
      permissions={["ordering.analytics.view"]}
      permissionOperator="or"
    >
      <SiteShell>
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Insights
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Analytics</h1>
              {status?.enabled ? (
                <Badge variant="outline" className="gap-1 text-emerald-600">
                  <Settings2 className="size-3" />
                  Live
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Interactive dashboards for orders, revenue, customers and
              operations. Available on the Professional plan and above.
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Dashboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalyticsContent />
            </CardContent>
          </Card>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
