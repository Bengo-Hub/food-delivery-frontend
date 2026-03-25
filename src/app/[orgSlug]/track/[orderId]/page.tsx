"use client";

import {
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Map,
  MapPin,
  Package,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TrackingIframeModal } from "@bengo-hub/shared-ui-lib";

import { SiteShell } from "@/components/layout/site-shell";
import { RiderCard } from "@/components/tracking/rider-card";
import { StatusTimeline } from "@/components/tracking/status-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrder } from "@/hooks/use-orders";
import { useOrderSSE } from "@/hooks/use-order-sse";
import { formatDateTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────

function etaCountdown(eta: string | null): string | null {
  if (!eta) return null;
  const diff = new Date(eta).getTime() - Date.now();
  if (diff <= 0) return "Arriving now";
  const mins = Math.ceil(diff / 60_000);
  return mins === 1 ? "~1 min" : `~${mins} mins`;
}

// ─── Page ────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
  const params = useParams<{ orgSlug: string; orderId: string }>();
  const orderId = params.orderId;
  const orgSlug = params.orgSlug;

  const logisticsUrl =
    process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ??
    "https://logistics.codevertexitsolutions.com";

  // Fetch initial order data (with polling fallback when SSE is down)
  const { data: order, isLoading: orderLoading } = useOrder(orderId, {
    refetchWhilePending: true,
    refetchIntervalMs: 10_000,
  });

  // SSE for real-time updates
  const sse = useOrderSSE(orderId);

  // Merge SSE status over order data
  const currentStatus = sse.status ?? (order as { status?: string } | undefined)?.status ?? "pending";
  const riderName = (order as { riderName?: string } | undefined)?.riderName ?? null;
  const riderPhone = (order as { riderPhone?: string } | undefined)?.riderPhone ?? null;
  const rider = riderName
    ? { name: riderName, phone: riderPhone ?? "", vehicleType: "motorcycle" as const }
    : null;

  // ETA from SSE or order data
  const etaRaw = sse.eta ?? (order as { estimatedDeliveryAt?: string } | undefined)?.estimatedDeliveryAt ?? null;
  const [etaText, setEtaText] = useState<string | null>(null);

  useEffect(() => {
    setEtaText(etaCountdown(etaRaw));
    if (!etaRaw) return;
    const interval = setInterval(() => {
      setEtaText(etaCountdown(etaRaw));
    }, 15_000);
    return () => clearInterval(interval);
  }, [etaRaw]);

  // Events for timeline
  const sseEvents = useMemo(
    () => sse.events.map((e) => ({ status: e.type, timestamp: e.timestamp })),
    [sse.events],
  );

  // Tracking modal
  const [trackingOpen, setTrackingOpen] = useState(false);

  // Collapsible order details
  const [detailsOpen, setDetailsOpen] = useState(false);

  const typedOrder = order as {
    id?: string;
    orderNumber?: string;
    status?: string;
    items?: { menuItemId: string; name: string; quantity: number; unitPrice: number; totalPrice: number }[];
    grandTotal?: number;
    deliveryAddress?: string;
    currency?: string;
    createdAt?: string;
  } | undefined;

  // ─── Render ──────────────────────────────────────────────────────

  if (orderLoading && !order) {
    return (
      <SiteShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading order...</p>
        </div>
      </SiteShell>
    );
  }

  if (!order) {
    return (
      <SiteShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Package className="size-12 text-muted-foreground/40" />
          <p className="font-medium text-foreground">Order not found</p>
        </div>
      </SiteShell>
    );
  }

  const isTerminal = ["delivered", "completed", "cancelled", "failed"].includes(currentStatus);

  return (
    <SiteShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-4 sm:gap-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-emphasis">
                Live Tracking
              </p>
              <h1 className="text-2xl font-semibold text-foreground">
                Order #{typedOrder?.orderNumber ?? orderId}
              </h1>
            </div>
            <Badge
              variant={isTerminal ? "default" : "soft"}
              className="gap-1 capitalize"
            >
              {isTerminal ? (
                <Package className="size-3.5" />
              ) : (
                <Clock className="size-3.5" />
              )}
              {currentStatus.replace(/_/g, " ")}
            </Badge>
          </div>

          {/* SSE connection indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                sse.connected ? "bg-green-500" : "bg-yellow-500",
              )}
            />
            {sse.connected ? "Live updates active" : "Reconnecting..."}
          </div>
        </header>

        {/* ETA */}
        {etaText && !isTerminal && (
          <Card className="border-brand-emphasis/30 bg-brand-muted/30">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm text-muted-foreground">Estimated arrival</p>
                <p className="text-2xl font-bold text-brand-emphasis">{etaText}</p>
              </div>
              <Clock className="size-8 text-brand-emphasis/60" />
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline currentStatus={currentStatus} events={sseEvents} />
          </CardContent>
        </Card>

        {/* Rider Card */}
        {rider && <RiderCard rider={rider} />}

        {/* Collapsible Order Details */}
        <Card>
          <button
            type="button"
            className="flex w-full items-center justify-between px-6 py-4 text-left"
            onClick={() => setDetailsOpen((prev) => !prev)}
          >
            <span className="font-semibold text-foreground">Order Details</span>
            {detailsOpen ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </button>
          {detailsOpen && (
            <CardContent className="border-t pt-4">
              {/* Items */}
              {typedOrder?.items && typedOrder.items.length > 0 && (
                <div className="space-y-2">
                  {typedOrder.items.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-muted-foreground">
                        KES {item.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-2 font-semibold">
                    <span>Total</span>
                    <span>
                      {typedOrder.currency ?? "KES"}{" "}
                      {typedOrder.grandTotal?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Delivery address */}
              {typedOrder?.deliveryAddress && (
                <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{typedOrder.deliveryAddress}</span>
                </div>
              )}

              {/* Placed time */}
              {typedOrder?.createdAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Placed{" "}
                  {formatDateTime(typedOrder.createdAt, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Track on map */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setTrackingOpen(true)}
        >
          <Map className="size-4" />
          Track on map
        </Button>

        <TrackingIframeModal
          open={trackingOpen}
          onOpenChange={setTrackingOpen}
          trackingCode={orderId}
          logisticsUiUrl={logisticsUrl}
        />
      </div>
    </SiteShell>
  );
}
