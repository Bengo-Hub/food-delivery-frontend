"use client";

import {
  Activity,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Loader2,
  MapPin,
  Package,
  Search,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth";
import { useAdminOrders } from "@/hooks/use-admin";
import { useBaseQuery } from "@/hooks/use-base-query";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface FeeConfig {
  serviceFeePercent: number;
  packagingFee: number;
  smallOrderFee: number;
  smallOrderThreshold: number;
  deliveryFeeBase: number;
}

interface UseCaseConfig {
  useCase: string;
  outlets: { id: string; name: string; useCase: string }[];
}

interface PaymentGatewayStatus {
  paystack: { configured: boolean; mode: string };
  mpesa: { configured: boolean; mode: string };
}

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  active: boolean;
}

/* ─── Page ───────────────────────────────────────────────────────────── */

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

  const { data: feeConfig } = useBaseQuery<FeeConfig>(
    ["platform", "fees"],
    { url: `/v1/${orgSlug}/admin/config/fees`, method: "GET" },
    { enabled: isPlatformOwner, placeholderData: { serviceFeePercent: 0, packagingFee: 0, smallOrderFee: 0, smallOrderThreshold: 0, deliveryFeeBase: 0 } },
  );

  const { data: useCaseConfig } = useBaseQuery<UseCaseConfig>(
    ["platform", "use-case"],
    { url: `/v1/${orgSlug}/admin/config/use-case`, method: "GET" },
    { enabled: isPlatformOwner, placeholderData: { useCase: "restaurant", outlets: [] } },
  );

  const { data: paymentStatus } = useBaseQuery<PaymentGatewayStatus>(
    ["platform", "payment-status"],
    { url: `/v1/${orgSlug}/admin/config/payment-status`, method: "GET" },
    { enabled: isPlatformOwner, placeholderData: { paystack: { configured: false, mode: "test" }, mpesa: { configured: false, mode: "test" } } },
  );

  const { data: deliveryZones } = useBaseQuery<DeliveryZone[]>(
    ["platform", "delivery-zones"],
    { url: `/v1/${orgSlug}/admin/delivery-zones`, method: "GET" },
    { enabled: isPlatformOwner, placeholderData: [] },
  );

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

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">
              <ShoppingBag className="mr-1.5 size-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="use-case">
              <Settings className="mr-1.5 size-4" />
              Use-Case Config
            </TabsTrigger>
            <TabsTrigger value="fees">
              <DollarSign className="mr-1.5 size-4" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="mr-1.5 size-4" />
              Payment Gateways
            </TabsTrigger>
            <TabsTrigger value="zones">
              <MapPin className="mr-1.5 size-4" />
              Delivery Zones
            </TabsTrigger>
          </TabsList>

          {/* ─── Orders Tab (existing content) ─────────────────────── */}
          <TabsContent value="orders" className="space-y-6">
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
          </TabsContent>

          {/* ─── Use-Case Config Tab ───────────────────────────────── */}
          <TabsContent value="use-case" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tenant Use-Case</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Current Use-Case:</span>
                  <Badge variant="soft" className="text-sm capitalize">
                    {useCaseConfig?.useCase ?? "restaurant"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  The use-case determines menu structure, order flow, and checkout behavior for each outlet.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Per-Outlet Use-Cases</CardTitle>
              </CardHeader>
              <CardContent>
                {(useCaseConfig?.outlets?.length ?? 0) === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No outlets configured yet. Create outlets from the admin panel.
                  </p>
                ) : (
                  <div className="divide-y">
                    {useCaseConfig?.outlets.map((outlet) => (
                      <div key={outlet.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium">{outlet.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {outlet.id}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {outlet.useCase}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Fee Configuration Tab ─────────────────────────────── */}
          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fee Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Service Fee
                    </p>
                    <p className="text-2xl font-semibold">
                      {feeConfig?.serviceFeePercent ?? 0}%
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Packaging Fee
                    </p>
                    <p className="text-2xl font-semibold">
                      KES {(feeConfig?.packagingFee ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Small Order Fee
                    </p>
                    <p className="text-2xl font-semibold">
                      KES {(feeConfig?.smallOrderFee ?? 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applies to orders below KES {(feeConfig?.smallOrderThreshold ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Delivery Fee (Base)
                    </p>
                    <p className="text-2xl font-semibold">
                      KES {(feeConfig?.deliveryFeeBase ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Payment Gateway Status Tab ────────────────────────── */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="size-5" />
                    Paystack
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={paymentStatus?.paystack?.configured ? "default" : "outline"}>
                      {paymentStatus?.paystack?.configured ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mode</span>
                    <span className="text-sm font-medium capitalize">
                      {paymentStatus?.paystack?.mode ?? "test"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="size-5" />
                    M-Pesa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={paymentStatus?.mpesa?.configured ? "default" : "outline"}>
                      {paymentStatus?.mpesa?.configured ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Mode</span>
                    <span className="text-sm font-medium capitalize">
                      {paymentStatus?.mpesa?.mode ?? "test"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Delivery Zones Tab ────────────────────────────────── */}
          <TabsContent value="zones" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">Delivery Zones</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/${orgSlug}/admin/delivery-zones`)}
                >
                  <MapPin className="mr-1.5 size-4" />
                  Manage Geofences
                </Button>
              </CardHeader>
              <CardContent>
                {(deliveryZones?.length ?? 0) === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No delivery zones configured. Click &quot;Manage Geofences&quot; to set up zones.
                  </p>
                ) : (
                  <div className="divide-y">
                    {deliveryZones?.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="text-sm font-medium">{zone.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Base fee: KES {zone.fee.toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={zone.active ? "default" : "outline"}>
                          {zone.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SiteShell>
  );
}
