"use client";

import {
    ArrowLeft,
    Bike,
    Check,
    ChefHat,
    Clock,
    CreditCard,
    Loader2,
    MapPin,
    Package,
    Phone,
    RefreshCw,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCancelOrder, useOrder, useOrderTracking } from "@/hooks/use-orders";
import { formatDateTime } from "@/lib/datetime";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useCartStore } from "@/store/cart";

const ORDER_TIMELINE = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Package },
  { key: "out_for_delivery", label: "On the Way", icon: Bike },
  { key: "delivered", label: "Delivered", icon: Check },
] as const;

function timelineIndex(status: string): number {
  const idx = ORDER_TIMELINE.findIndex((s) => s.key === status);
  return idx === -1 ? -1 : idx;
}

function statusVariant(status: string): "default" | "soft" | "outline" {
  if (["delivered", "completed"].includes(status)) return "default";
  if (["cancelled", "failed"].includes(status)) return "outline";
  return "soft";
}

export default function OrderDetailPage() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;

  const { data: order, isLoading } = useOrder(orderId);
  const { data: tracking } = useOrderTracking(orderId, !!order && !["delivered", "completed", "cancelled"].includes(order.status));
  const cancelOrder = useCancelOrder();
  const addItem = useCartStore((s) => s.addItem);

  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const isActive = order && !["delivered", "completed", "cancelled", "failed"].includes(order.status);
  const canCancel = order && ["pending", "confirmed"].includes(order.status);
  const currentStep = order ? timelineIndex(order.status) : -1;

  function handleReorder() {
    if (!order) return;
    for (const item of order.items) {
      addItem({
        id: item.menuItemId,
        name: item.name,
        price: item.unitPrice,
        quantity: item.quantity,
      });
    }
    toast.success("Items added to cart!");
    router.push(orgRoute(orgSlug, "/cart"));
  }

  function handleCancel() {
    if (!order || !cancelReason.trim()) return;
    cancelOrder.mutate(
      { orderId: order.id, reason: cancelReason.trim() },
      {
        onSuccess: () => {
          toast.success("Order cancelled");
          setShowCancelReason(false);
        },
        onError: () => toast.error("Failed to cancel order"),
      },
    );
  }

  return (
    <RequireAuth roles={["customer", "member", "staff", "admin", "superuser", "manager", "cashier"]}>
      <SiteShell>
        <div className="mx-auto my-8 flex w-full max-w-2xl flex-col gap-6 px-4">
          {/* Back button */}
          <Link
            href={orgRoute(orgSlug, "/orders")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>

          {isLoading || !order ? (
            <div className="flex justify-center py-20">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">
                    Order #{order.orderNumber}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Placed{" "}
                    {formatDateTime(order.createdAt, {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant={statusVariant(order.status)} className="w-fit text-sm">
                  {order.status.replace(/_/g, " ")}
                </Badge>
              </header>

              {/* Timeline (only for active/completed orders, not cancelled) */}
              {order.status !== "cancelled" && order.status !== "failed" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {ORDER_TIMELINE.map((step, i) => {
                        const StepIcon = step.icon;
                        const reached = i <= currentStep;
                        const isCurrent = i === currentStep;
                        return (
                          <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
                            <div className="flex w-full items-center">
                              {i > 0 && (
                                <div
                                  className={cn(
                                    "h-0.5 flex-1",
                                    reached ? "bg-brand-emphasis" : "bg-border",
                                  )}
                                />
                              )}
                              <div
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-full transition-colors",
                                  isCurrent
                                    ? "bg-brand-emphasis text-brand-contrast ring-2 ring-brand-emphasis/30"
                                    : reached
                                      ? "bg-brand-emphasis text-brand-contrast"
                                      : "bg-muted text-muted-foreground",
                                )}
                              >
                                <StepIcon className="size-4" />
                              </div>
                              {i < ORDER_TIMELINE.length - 1 && (
                                <div
                                  className={cn(
                                    "h-0.5 flex-1",
                                    i < currentStep ? "bg-brand-emphasis" : "bg-border",
                                  )}
                                />
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-center text-[10px] leading-tight sm:text-xs truncate max-w-[60px] sm:max-w-none",
                                reached ? "font-medium text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rider info (if tracking) */}
              {isActive && tracking?.riderName && (
                <Card>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-brand-muted text-brand-emphasis">
                      <Bike className="size-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{tracking.riderName}</p>
                      <p className="text-xs text-muted-foreground">
                        Your rider{tracking.eta ? ` — ETA ${tracking.eta}` : ""}
                      </p>
                    </div>
                    {tracking.riderPhone && (
                      <a
                        href={`tel:${tracking.riderPhone}`}
                        className="flex size-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
                        aria-label="Call rider"
                      >
                        <Phone className="size-4" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x KES {item.unitPrice.toLocaleString()}
                        </p>
                      </div>
                      <p className="shrink-0 font-medium text-foreground">
                        KES {item.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  ))}

                  <div className="border-t border-border pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>KES {order.subtotal.toLocaleString()}</span>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery</span>
                        <span>KES {order.deliveryFee.toLocaleString()}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-KES {order.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                      <span>Total</span>
                      <span>
                        {order.currency ?? "KES"} {order.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery & Payment Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="size-4 text-brand-emphasis" />
                      Delivery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {order.deliveryAddress || "Pickup"}
                    </p>
                    {order.estimatedDeliveryAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        ETA:{" "}
                        {formatDateTime(order.estimatedDeliveryAt, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="size-4 text-brand-emphasis" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm capitalize text-muted-foreground">
                      {order.paymentMethod?.replace(/_/g, " ") ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Status:{" "}
                      <span className="capitalize">
                        {order.paymentStatus?.replace(/_/g, " ") ?? "—"}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleReorder}
                >
                  <RefreshCw className="size-4" />
                  Reorder
                </Button>

                {isActive && (
                  <Button variant="outline" className="gap-2" asChild>
                    <a
                      href={`${
                        process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexitsolutions.com"
                      }/${orgSlug}/tracking?orderId=${encodeURIComponent(order.id)}`}
                    >
                      <Bike className="size-4" />
                      Track Delivery
                    </a>
                  </Button>
                )}

                {canCancel && !showCancelReason && (
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowCancelReason(true)}
                  >
                    <XCircle className="size-4" />
                    Cancel Order
                  </Button>
                )}
              </div>

              {/* Cancel reason input */}
              {showCancelReason && (
                <Card className="border-destructive/50">
                  <CardContent className="flex flex-col gap-3 py-4">
                    <p className="text-sm font-medium text-foreground">
                      Why are you cancelling this order?
                    </p>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g., Changed my mind, ordered by mistake..."
                      className="min-h-[80px] w-full rounded-md border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!cancelReason.trim() || cancelOrder.isPending}
                        onClick={handleCancel}
                      >
                        {cancelOrder.isPending ? (
                          <Loader2 className="mr-1 size-4 animate-spin" />
                        ) : null}
                        Confirm Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowCancelReason(false)}
                      >
                        Keep Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
