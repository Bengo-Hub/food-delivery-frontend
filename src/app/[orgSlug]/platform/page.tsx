"use client";

import { Activity, LayoutDashboard, Loader2, Package, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { useAdminOrders } from "@/hooks/use-admin";

export default function PlatformDashboardPage({
  params,
}: {
  params: { orgSlug?: string };
}) {
  const orgSlug = params?.orgSlug as string;
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPlatformOwner = orgSlug === "codevertex";

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user && !isPlatformOwner) router.replace(`/${orgSlug}`);
  }, [user, isPlatformOwner, orgSlug, router]);

  const { data, isLoading } = useAdminOrders({ limit: 100 });

  const orders = data?.orders ?? [];
  const totalOrders = data?.total ?? 0;

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const processingCount = orders.filter((o) => ["confirmed", "preparing"].includes(o.status)).length;
  const deliveryCount = orders.filter((o) => ["ready", "out_for_delivery"].includes(o.status)).length;

  if (!isPlatformOwner) return null;

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-8">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Platform Operations
          </p>
          <h1 className="text-2xl font-bold">Global Order Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Monitor ecosystem-wide order flow and system health across all tenants.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-4">
          <MetricCard
            title="Total Active Orders"
            value={totalOrders}
            icon={<Activity className="size-4 text-primary" />}
          />
          <MetricCard
            title="Pending Actions"
            value={pendingCount}
            icon={<Loader2 className="size-4 text-amber-500" />}
          />
          <MetricCard
            title="Processing"
            value={processingCount}
            icon={<Package className="size-4 text-blue-500" />}
          />
          <MetricCard
            title="Delivery / Pickup"
            value={deliveryCount}
            icon={<LayoutDashboard className="size-4 text-green-500" />}
          />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search global orders by ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Package className="size-10 text-muted-foreground" />
              <p className="font-medium">No active global orders</p>
              <p className="text-sm text-muted-foreground">
                Orders from all tenants will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Global Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">#{order.orderNumber} - {order.customerName}</p>
                      <p className="text-xs text-muted-foreground">Status: {order.status.replace(/_/g, " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">KES {order.grandTotal.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SiteShell>
  );
}
