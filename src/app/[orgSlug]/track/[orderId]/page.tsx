"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Clock,
  Loader2,
  MapPin,
  Package,
  Phone,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { useCancelOrder, useOrder, useOrderTracking } from "@/hooks/use-orders";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready", icon: Package },
  { key: "picked_up", label: "Picked Up", icon: Truck },
  { key: "enroute", label: "On the Way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

function getStepIndex(status: string): number {
  const aliases: Record<string, string> = {
    in_transit: "enroute",
    en_route: "enroute",
    completed: "delivered",
  };
  const normalized = aliases[status] || status;
  const idx = STATUS_STEPS.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

export default function TrackOrderPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const orderId = params.orderId;

  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: tracking } = useOrderTracking(orderId, !!order && order.status !== "delivered" && order.status !== "cancelled");
  const cancelOrder = useCancelOrder();

  if (isLoading) {
    return (
      <SiteShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </SiteShell>
    );
  }

  if (error || !order) {
    return (
      <SiteShell>
        <div className="container mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-16">
          <XCircle className="size-12 text-destructive" />
          <h1 className="text-xl font-bold">Order not found</h1>
          <Button asChild variant="outline">
            <Link href={orgRoute(orgSlug, "/dashboard/customer")}>Go to Dashboard</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered" || order.status === "completed";
  const currentStepIndex = getStepIndex(order.status);
  const canCancel = ["pending", "confirmed"].includes(order.status);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await cancelOrder.mutateAsync({ orderId, reason: "Customer requested cancellation" });
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
    }
  };

  return (
    <SiteShell>
      <div className="container mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Track Order</h1>
            <p className="text-sm text-muted-foreground">#{order.orderNumber}</p>
          </div>
        </div>

        {/* Status Timeline */}
        {isCancelled ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <XCircle className="size-6 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Order Cancelled</p>
              <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
            </div>
          </div>
        ) : (
          <section className="mb-6 rounded-xl border border-border p-4">
            <div className="relative space-y-0">
              {STATUS_STEPS.map((step, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const Icon = step.icon;

                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Vertical line + dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full ${
                          isActive
                            ? isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCurrent && !isDelivered ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Icon className="size-4" />
                        )}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`h-8 w-0.5 ${
                            idx < currentStepIndex ? "bg-primary" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                    {/* Label */}
                    <div className={`pb-6 pt-1 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      <p className={`text-sm ${isCurrent ? "font-semibold" : "font-normal"}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ETA Card */}
        {tracking?.eta && !isDelivered && !isCancelled && (
          <section className="mb-6 rounded-xl border border-border bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span className="text-sm font-medium">Estimated delivery: {tracking.eta}</span>
            </div>
          </section>
        )}

        {/* Rider Info */}
        {(tracking?.riderName || order.riderName) && !isCancelled && (
          <section className="mb-6 rounded-xl border border-border p-4">
            <h2 className="mb-3 text-sm font-medium">Your Rider</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Truck className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tracking?.riderName || order.riderName}</p>
                  <p className="text-xs text-muted-foreground">{tracking?.riderPhone || order.riderPhone}</p>
                </div>
              </div>
              {(tracking?.riderPhone || order.riderPhone) && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${tracking?.riderPhone || order.riderPhone}`}>
                    <Phone className="mr-1 size-3" /> Call
                  </a>
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Delivery Address */}
        {order.deliveryAddress && order.deliveryAddress !== "Pickup" && (
          <section className="mb-6 rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="size-4 text-primary" />
              <span>Delivery Address</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{order.deliveryAddress}</p>
          </section>
        )}

        {/* Order Details */}
        <section className="mb-6 rounded-xl border border-border p-4">
          <h2 className="mb-3 text-sm font-medium">Order Details</h2>
          <div className="divide-y divide-border">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{item.quantity}x</span>
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="text-sm font-medium">KES {item.totalPrice.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t border-border pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>KES {order.subtotal.toLocaleString()}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-KES {order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span>
                {order.deliveryFee === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  `KES ${order.deliveryFee.toLocaleString()}`
                )}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <span>Total</span>
              <span>KES {order.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-3">
          {canCancel && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Cancel Order
            </Button>
          )}
          <Button variant="outline" className="w-full" asChild>
            <Link href={orgRoute(orgSlug, "/dashboard/customer")}>Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </SiteShell>
  );
}
