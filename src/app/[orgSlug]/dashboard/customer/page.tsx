"use client";

import { BikeIcon, GiftIcon, Loader2, MapPinIcon, UtensilsIcon } from "lucide-react";
import Link from "next/link";

import { AuthorizationGate } from "@/components/auth/authorization-gate";
import { RequireAuth } from "@/components/auth/require-auth";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/hooks/use-orders";
import { formatDateTime } from "@/lib/datetime";
import { orgRoute } from "@/lib/routes";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";

export default function CustomerDashboardPage() {
  const orgSlug = useOrgSlug();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useOrders({ limit: 10 });
  const orders = data?.orders ?? [];

  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "enroute"].includes(o.status),
  );

  return (
    <RequireAuth roles={["customer"]}>
      <SiteShell>
        <div className="mx-auto my-12 flex w-full max-w-6xl flex-col gap-8 px-4">
          <header className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">
              Customer dashboard
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Hello {user?.fullName ?? "there"}, ready to dine?
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your delivery pipeline, loyalty journey, and saved delivery preferences from one
              place.
            </p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AuthorizationGate permissions={["orders:view"]}>
              <MetricCard
                title="Active orders"
                value={activeOrders.length}
                deltaLabel="Total orders"
                deltaValue={(data?.total ?? 0).toString()}
                icon={<UtensilsIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
            <AuthorizationGate permissions={["loyalty:view"]}>
              <MetricCard
                title="Loyalty points"
                value={user?.loyaltyPoints ?? 0}
                deltaLabel="Tier"
                deltaValue={user?.loyaltyPoints && user.loyaltyPoints > 2000 ? "Gold" : "Explorer"}
                icon={<GiftIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
            <AuthorizationGate permissions={["loyalty:redeem"]}>
              <MetricCard
                title="Available offers"
                value={user?.availableCoupons ?? 0}
                deltaLabel="Redeem via loyalty tab"
                deltaValue="Tap to view menu"
                icon={<GiftIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
            <AuthorizationGate permissions={["profile:update"]}>
              <MetricCard
                title="Saved address"
                value={user?.defaultLocationLabel ?? "Add default"}
                deltaLabel="Quick access"
                deltaValue="Edit in profile"
                icon={<MapPinIcon className="size-4 text-brand-emphasis" aria-hidden />}
              />
            </AuthorizationGate>
          </section>

          <AuthorizationGate permissions={["orders:view"]}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BikeIcon className="size-5 text-brand-emphasis" aria-hidden />
                    Latest deliveries
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={orgRoute(orgSlug, "/menu")}>Order Now</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Place your first order to see real-time delivery updates!
                    </p>
                    <Button asChild size="sm">
                      <Link href={orgRoute(orgSlug, "/menu")}>Browse Menu</Link>
                    </Button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <a
                      key={order.id}
                      href={`${
                        process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexitsolutions.com"
                      }/${orgSlug}/tracking?orderId=${encodeURIComponent(order.id)}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/60"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          #{order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length ?? 0} items &middot; KES{" "}
                          {order.grandTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt, {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          ["delivered", "completed"].includes(order.status)
                            ? "default"
                            : "soft"
                        }
                      >
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </a>
                  ))
                )}
              </CardContent>
            </Card>
          </AuthorizationGate>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
