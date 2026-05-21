"use client";

import {
  ChevronRight,
  Clock,
  Loader2,
  Package,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrders } from "@/hooks/use-orders";
import { formatDateTime, formatRelativeTime } from "@/lib/datetime";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const ACTIVE_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "enroute",
];

function statusVariant(status: string): "default" | "soft" | "outline" {
  if (["delivered", "completed"].includes(status)) return "default";
  if (["cancelled", "failed"].includes(status)) return "outline";
  return "soft";
}

function statusIcon(status: string) {
  switch (status) {
    case "cancelled":
    case "failed":
      return <XCircle className="size-3.5" />;
    case "delivered":
    case "completed":
      return <Package className="size-3.5" />;
    default:
      return <Clock className="size-3.5" />;
  }
}

export default function OrdersPage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const handleReorder = (order: (typeof allOrders)[number]) => {
    if (!order.items || order.items.length === 0) return;
    for (const item of order.items) {
      addItem({
        id: item.menuItemId,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
      });
    }
    toast.success("Items added to cart");
    router.push(orgRoute(orgSlug, "/cart"));
  };

  // "active" is not a real backend status — fetch all and filter client-side.
  // "completed" maps to both "delivered" and "completed" statuses.
  const backendStatus =
    tab === "cancelled" ? "cancelled" : undefined;

  const filters: { status?: string; limit?: number } = { limit: 50 };
  if (backendStatus) filters.status = backendStatus;

  const { data, isLoading } = useOrders(filters);

  const allOrders = data?.orders ?? [];

  // Client-side tab filtering
  const tabFilteredOrders =
    tab === "active"
      ? allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status))
      : tab === "completed"
        ? allOrders.filter((o) => ["delivered", "completed"].includes(o.status))
        : allOrders;

  // Client-side search filtering on order number
  const orders = search.trim()
    ? tabFilteredOrders.filter((o) =>
        o.orderNumber.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : tabFilteredOrders;

  // Summary counts from the full list
  const activeCount = allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const completedCount = allOrders.filter((o) =>
    ["delivered", "completed"].includes(o.status),
  ).length;
  const cancelledCount = allOrders.filter((o) =>
    ["cancelled", "failed"].includes(o.status),
  ).length;

  return (
    <RequireAuth roles={["customer"]}>
      <SiteShell>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-8">
          {/* Header */}
          <header className="flex flex-col gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">
              My Orders
            </p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Order History
            </h1>
            <p className="text-sm text-muted-foreground">
              Track, reorder, and manage all your orders in one place.
            </p>
          </header>

          {/* Summary cards */}
          <section className="grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="text-center">
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-brand-emphasis">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-muted-foreground">{cancelledCount}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </CardContent>
            </Card>
          </section>

          {/* Filters: Tabs + Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full overflow-x-auto sm:w-auto">
                {STATUS_TABS.map((t) => (
                  <TabsTrigger key={t.key} value={t.key} className="min-w-[72px]">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-[44px] pl-9 sm:w-56"
              />
            </div>
          </div>

          {/* Order List */}
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <ShoppingBag className="size-12 text-muted-foreground/40" />
                  <p className="font-medium text-foreground">No orders found</p>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    {search
                      ? `No results for "${search}". Try a different search term.`
                      : tab === "all"
                        ? "Place your first order and it will appear here!"
                        : `No ${tab} orders to show.`}
                  </p>
                  {tab === "all" && !search && (
                    <Button asChild size="sm" className="mt-2">
                      <Link href={orgRoute(orgSlug, "/catalog")}>Browse Catalog</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => {
                const isCompleted = ["delivered", "completed"].includes(order.status);
                return (
                  <div key={order.id} className="group">
                    <Link
                      href={orgRoute(orgSlug, `/orders/${order.id}`)}
                      className="block"
                    >
                      <Card className="transition-colors hover:border-brand-emphasis/40 hover:bg-muted/30">
                        <CardContent className="flex items-center gap-4 py-4">
                          {/* Icon */}
                          <div className="hidden shrink-0 sm:block">
                            <div
                              className={cn(
                                "flex size-10 items-center justify-center rounded-full",
                                isCompleted
                                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                  : ["cancelled", "failed"].includes(order.status)
                                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                                    : "bg-brand-muted text-brand-emphasis",
                              )}
                            >
                              <ReceiptText className="size-5" />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">
                                #{order.orderNumber}
                              </p>
                              <Badge variant={statusVariant(order.status)} className="gap-1">
                                {statusIcon(order.status)}
                                {order.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {order.items?.length ?? 0} item
                              {(order.items?.length ?? 0) !== 1 ? "s" : ""} &middot; KES{" "}
                              {order.grandTotal.toLocaleString()}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatRelativeTime(order.createdAt)} &middot;{" "}
                              {formatDateTime(order.createdAt, {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </CardContent>
                      </Card>
                    </Link>

                    {/* Reorder button for completed orders */}
                    {isCompleted && (
                      <div className="mt-1 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => handleReorder(order)}
                        >
                          <RefreshCw className="size-3.5" />
                          Reorder
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
