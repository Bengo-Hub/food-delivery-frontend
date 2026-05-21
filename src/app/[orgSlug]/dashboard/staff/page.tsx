"use client";

import {
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Clock,
  Loader2,
  Package,
  Search,
  Truck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SiteShell } from "@/components/layout/site-shell";
import { SubscriptionBanner } from "@/components/subscription/subscription-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useAdminOrders, useAssignRider, useAvailableRiders, useUpdateOrderStatus, useDeleteAdminOrder } from "@/hooks/use-admin";
import { toast } from "@/lib/toast";
import type { AdminOrder } from "@/lib/api/admin";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

const STATUS_ACTIONS: Record<string, { next: string; label: string; variant: "default" | "outline" }[]> = {
  pending: [
    { next: "confirmed", label: "Accept Order", variant: "default" },
    { next: "cancelled", label: "Reject", variant: "outline" },
  ],
  confirmed: [
    { next: "preparing", label: "Start Preparing", variant: "default" },
  ],
  preparing: [
    { next: "ready", label: "Mark Ready", variant: "default" },
  ],
  ready: [
    { next: "out_for_delivery", label: "Hand to Rider", variant: "default" },
  ],
};

function statusBadgeVariant(status: string): "default" | "soft" | "outline" {
  switch (status) {
    case "pending":
      return "soft";
    case "confirmed":
    case "preparing":
      return "default";
    case "ready":
    case "out_for_delivery":
      return "outline";
    case "delivered":
    case "completed":
      return "default";
    case "cancelled":
    case "refunded":
      return "outline";
    default:
      return "soft";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="size-3.5" />;
    case "confirmed":
      return <CheckCircle2 className="size-3.5" />;
    case "preparing":
      return <ChefHat className="size-3.5" />;
    case "ready":
      return <Package className="size-3.5" />;
    case "out_for_delivery":
      return <Truck className="size-3.5" />;
    case "delivered":
    case "completed":
      return <CheckCircle2 className="size-3.5" />;
    case "cancelled":
      return <XCircle className="size-3.5" />;
    default:
      return <Clock className="size-3.5" />;
  }
}

export default function StaffDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [riderPickerOrderId, setRiderPickerOrderId] = useState<string | null>(null);

  const limit = 50;
  const filters = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    limit,
    page,
  };

  const { data, isLoading } = useAdminOrders(filters);
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteAdminOrder();
  const assignRider = useAssignRider();
  const { data: availableRiders = [], isLoading: ridersLoading } = useAvailableRiders(riderPickerOrderId !== null);

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Count by status for the summary cards
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: string) => {
      try {
        await updateStatus.mutateAsync({ orderId, status });
        toast.success(`Order status updated to ${status.replace(/_/g, " ")}`);
      } catch {
        toast.error("Failed to update order status");
      }
    },
    [updateStatus],
  );

  const handleAssignRider = useCallback(
    async (orderId: string, fleetMemberId: string) => {
      try {
        await assignRider.mutateAsync({ orderId, fleetMemberId });
        toast.success("Rider assigned successfully");
        setRiderPickerOrderId(null);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to assign rider");
      }
    },
    [assignRider],
  );

  return (
    <RequireAuth roles={["staff", "admin", "superuser", "member"]} roleOperator="or">
      <SiteShell>
        <SubscriptionBanner />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          {/* Header */}
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Staff Dashboard
            </p>
            <h1 className="text-2xl font-bold">Order Queue</h1>
            <p className="text-sm text-muted-foreground">
              Manage incoming orders and fulfillment workflow
            </p>
          </header>

          {/* Summary Cards */}
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <MetricCard
              title="Pending"
              value={pendingCount}
              icon={<Clock className="size-4 text-amber-500" />}
            />
            <MetricCard
              title="Preparing"
              value={preparingCount}
              icon={<ChefHat className="size-4 text-blue-500" />}
            />
            <MetricCard
              title="Ready for Pickup"
              value={readyCount}
              icon={<Package className="size-4 text-green-500" />}
            />
          </section>

          {/* Search + Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search orders by number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">{total} orders</p>
          </div>

          {/* Status Tabs */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Order List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Package className="size-10 text-muted-foreground" />
                <p className="font-medium">No orders found</p>
                <p className="text-sm text-muted-foreground">
                  {statusFilter !== "all"
                    ? `No ${statusFilter.replace(/_/g, " ")} orders right now.`
                    : "Orders will appear here as customers place them."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={(id) => deleteOrder.mutate(id)}
                  isUpdating={updateStatus.isPending || deleteOrder.isPending || assignRider.isPending}
                  onAssignRider={handleAssignRider}
                  availableRiders={availableRiders}
                  ridersLoading={ridersLoading}
                  showRiderPicker={riderPickerOrderId === order.id}
                  onToggleRiderPicker={(id) => setRiderPickerOrderId(riderPickerOrderId === id ? null : id)}
                />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-6"
          />
        </div>
      </SiteShell>
    </RequireAuth>
  );
}

function OrderCard({
  order,
  onStatusUpdate,
  onDelete,
  isUpdating,
  onAssignRider,
  availableRiders,
  ridersLoading,
  showRiderPicker,
  onToggleRiderPicker,
}: {
  order: AdminOrder;
  onStatusUpdate: (orderId: string, status: string) => void;
  onDelete: (orderId: string) => void;
  isUpdating: boolean;
  onAssignRider: (orderId: string, fleetMemberId: string) => void;
  availableRiders: import("@/lib/api/logistics").FleetMember[];
  ridersLoading: boolean;
  showRiderPicker: boolean;
  onToggleRiderPicker: (orderId: string) => void;
}) {
  const isDeliveryOrder = order.fulfillmentType === "delivery";
  const rawActions = STATUS_ACTIONS[order.status] ?? [];
  // For delivery orders at "ready" status, suppress the direct "Hand to Rider" status push —
  // the proper path is "Assign Rider" which creates a logistics task and triggers the NATS flow
  // that transitions the order to out_for_delivery automatically.
  const actions = isDeliveryOrder
    ? rawActions.filter((a) => a.next !== "out_for_delivery")
    : rawActions;
  const createdDate = new Date(order.createdAt);
  const minutesAgo = Math.round((Date.now() - createdDate.getTime()) / 60_000);
  const timeLabel =
    minutesAgo < 1
      ? "Just now"
      : minutesAgo < 60
        ? `${minutesAgo}m ago`
        : `${Math.round(minutesAgo / 60)}h ago`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              #{order.orderNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {order.customerName || "—"} &middot; {timeLabel}
              {order.source === "guest" && (
                <span className="ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">Guest</span>
              )}
              {order.channel && (
                <span className="ml-1 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{order.channel}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant(order.status)}>
              <span className="mr-1 inline-flex">{statusIcon(order.status)}</span>
              {order.status.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {order.paymentMethod === "mpesa"
                ? "M-Pesa"
                : order.paymentMethod === "paystack"
                  ? "Paystack"
                  : order.paymentMethod === "wallet"
                    ? "Wallet"
                    : order.paymentMethod === "cod" || order.paymentMethod === "cash"
                      ? "COD"
                      : order.paymentMethod || "—"}{" "}
              &middot; {order.paymentStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Item list */}
        <div className="mb-3 space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span>
                <span className="text-muted-foreground">{item.quantity}x</span>{" "}
                {item.name}
              </span>
              <span className="font-medium">KES {item.totalPrice.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div>
            <span className="text-sm font-bold">
              KES {order.grandTotal.toLocaleString()}
            </span>
            {order.deliveryAddress && order.deliveryAddress !== "Pickup" && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Deliver to: {order.deliveryAddress}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {actions.map((action) => (
              <Button
                key={action.next}
                size="sm"
                variant={action.variant}
                disabled={isUpdating}
                onClick={() => onStatusUpdate(order.id, action.next)}
              >
                {isUpdating ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                {action.label}
              </Button>
            ))}

            {/* Assign Rider button: delivery orders at "ready" status */}
            {order.status === "ready" && order.fulfillmentType === "delivery" && (
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => onToggleRiderPicker(order.id)}
                  className="gap-1.5"
                >
                  <UserCheck className="size-3.5" />
                  Assign Rider
                  <ChevronDown className="size-3" />
                </Button>
                {showRiderPicker && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-background shadow-lg">
                    {ridersLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="size-3 animate-spin" /> Loading riders…
                      </div>
                    ) : availableRiders.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No available riders</p>
                    ) : (
                      availableRiders.map((rider) => {
                        const name = rider.edges?.user?.full_name || rider.edges?.user?.email || rider.id;
                        return (
                          <button
                            key={rider.id}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                            onClick={() => onAssignRider(order.id, rider.id)}
                          >
                            <UserCheck className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              disabled={isUpdating}
              onClick={() => {
                if (window.confirm(`Delete order #${order.orderNumber}? This cannot be undone.`)) {
                  onDelete(order.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
