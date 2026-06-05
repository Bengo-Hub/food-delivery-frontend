"use client";

import {
  Bike,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGuestOrder, rateGuestOrder, type Order } from "@/lib/api/orders";
import { formatDateTime } from "@/lib/datetime";
import { orgRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useOrgSlug } from "@/providers/org-slug-provider";

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

function StarSelector({
  value,
  onChange,
  label,
  idPrefix,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  idPrefix: string;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || value) >= n;
          return (
            <button
              key={`${idPrefix}-${n}`}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => onChange(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emphasis/40"
            >
              <Star
                className={cn(
                  "size-7",
                  active ? "text-amber-400 fill-amber-400" : "text-muted-foreground",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-6",
            rating >= n ? "text-amber-400 fill-amber-400" : "text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}

function RateOrderCard({
  order,
  orgSlug,
  orderId,
  queryKey,
  autoOpen,
}: {
  order: Order;
  orgSlug: string;
  orderId: string;
  queryKey: (string | undefined)[];
  autoOpen: boolean;
}) {
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [riderRating, setRiderRating] = useState(0);
  const [riderComment, setRiderComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const hasRider = !!order.riderName || !!order.deliveryAddress;
  const alreadyRated = order.rating != null && order.rating > 0;

  useEffect(() => {
    if (autoOpen && !alreadyRated) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [autoOpen, alreadyRated]);

  const mutation = useMutation({
    mutationFn: () => {
      const body: { rating: number; comment?: string; riderRating?: number; riderComment?: string } = {
        rating,
      };
      const trimmedComment = comment.trim();
      if (trimmedComment) body.comment = trimmedComment;
      if (hasRider && riderRating > 0) {
        body.riderRating = riderRating;
        const trimmedRiderComment = riderComment.trim();
        if (trimmedRiderComment) body.riderComment = trimmedRiderComment;
      }
      return rateGuestOrder(orgSlug, orderId, body);
    },
    onSuccess: () => {
      setSubmitted(true);
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  if (alreadyRated) {
    return (
      <Card ref={cardRef}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">You rated this order</p>
          <StarRow rating={order.rating ?? 0} />
          {order.ratingComment && (
            <p className="text-sm text-foreground">&ldquo;{order.ratingComment}&rdquo;</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card ref={cardRef}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thank you!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Thanks for rating your order. We appreciate your feedback.
          </p>
        </CardContent>
      </Card>
    );
  }

  const errMessage =
    mutation.error instanceof Error ? mutation.error.message : "Something went wrong. Please try again.";

  return (
    <Card ref={cardRef} className={cn(autoOpen && "ring-2 ring-brand-emphasis/40")}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rate your order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StarSelector
          value={rating}
          onChange={setRating}
          label="How was your order?"
          idPrefix="order"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more (optional)"
          rows={2}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emphasis/40"
        />

        {hasRider && (
          <>
            <StarSelector
              value={riderRating}
              onChange={setRiderRating}
              label="Rate your rider"
              idPrefix="rider"
            />
            <textarea
              value={riderComment}
              onChange={(e) => setRiderComment(e.target.value)}
              placeholder="How was the delivery? (optional)"
              rows={2}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emphasis/40"
            />
          </>
        )}

        {mutation.isError && <p className="text-sm text-destructive">{errMessage}</p>}

        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={rating < 1 || mutation.isPending}
          className="gap-2"
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Submit Rating
        </Button>
      </CardContent>
    </Card>
  );
}

function GuestOrderContent() {
  const orgSlug = useOrgSlug();
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const orderId = params.orderId;
  const sessionId = searchParams.get("session_id") ?? "";
  const autoOpenRating = searchParams.get("rate") === "1";

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["guest-order", orderId, sessionId],
    queryFn: () => getGuestOrder(orgSlug, orderId, sessionId),
    enabled: !!orderId,
    staleTime: 30_000,
    retry: 1,
  });

  const currentStep = order ? timelineIndex(order.status) : -1;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <p className="text-muted-foreground">Order not found or access denied.</p>
        <Button asChild variant="outline">
          <Link href={orgRoute(orgSlug, "/")}>Browse Menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto my-8 flex w-full max-w-2xl flex-col gap-6 px-4">
      {/* Payment success banner */}
      {["pending", "confirmed", "preparing"].includes(order.status) && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircle2 className="size-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Payment confirmed!</p>
            <p className="text-xs text-green-700">Your order has been received and is being processed.</p>
          </div>
        </div>
      )}

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

      {/* Timeline */}
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
                        <div className={cn("h-0.5 flex-1", reached ? "bg-brand-emphasis" : "bg-border")} />
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
                        <div className={cn("h-0.5 flex-1", i < currentStep ? "bg-brand-emphasis" : "bg-border")} />
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

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-2 text-sm">
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
              <span>{order.currency ?? "KES"} {order.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery & Payment */}
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

      {/* Rating */}
      {["delivered", "completed"].includes(order.status) && (
        <RateOrderCard
          order={order}
          orgSlug={orgSlug}
          orderId={orderId}
          queryKey={["guest-order", orderId, sessionId]}
          autoOpen={autoOpenRating}
        />
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="gap-2">
          <Link href={orgRoute(orgSlug, "/menu")}>Continue Shopping</Link>
        </Button>
        {!["delivered", "completed", "cancelled", "failed"].includes(order.status) && (
          <Button asChild variant="outline" className="gap-2">
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
      </div>
    </div>
  );
}

export default function GuestOrderPage() {
  return (
    <SiteShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        }
      >
        <GuestOrderContent />
      </Suspense>
    </SiteShell>
  );
}
