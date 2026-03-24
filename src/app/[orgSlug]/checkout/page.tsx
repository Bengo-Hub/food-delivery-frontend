"use client";

import { ArrowLeft, CheckCircle2, Loader2, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AddressSelector } from "@/components/checkout/address-selector";
import { FeeBreakdownCard } from "@/components/checkout/fee-breakdown";
import { FulfillmentToggle } from "@/components/checkout/fulfillment-toggle";
import { SchedulePicker } from "@/components/checkout/schedule-picker";
import { SlideToConfirm } from "@/components/checkout/slide-to-confirm";
import { SmallOrderWarning } from "@/components/checkout/small-order-warning";
import {
  TreasuryPaymentModal,
  type PaymentResult,
} from "@/components/checkout/treasury-payment-modal";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddresses } from "@/hooks/use-addresses";
import { useCheckout, useFeeBreakdown } from "@/hooks/use-cart-api";
import { useApplyPromoCode } from "@/hooks/use-orders";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useCartStore, type CartItem } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";

type FulfillmentMode = "delivery" | "pickup" | "schedule";
type CheckoutStep = "review" | "processing" | "payment" | "success";

// Hardcoded small-order threshold / fee (backend will override via fee breakdown)
const SMALL_ORDER_THRESHOLD = 500;
const SMALL_ORDER_FEE = 296;

export default function CheckoutPage() {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clear);
  const orderNotes = useCartStore((s) => s.orderNotes);
  const requestUtensils = useCartStore((s) => s.requestUtensils);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const diningMode = useDiningModeStore((s) => s.mode);
  const setDiningMode = useDiningModeStore((s) => s.setMode);
  const isScheduled = useDiningModeStore((s) => s.isScheduled);
  const setIsScheduled = useDiningModeStore((s) => s.setIsScheduled);
  const scheduledTime = useDiningModeStore((s) => s.scheduledTime);
  const setScheduledTime = useDiningModeStore((s) => s.setScheduledTime);

  const [step, setStep] = useState<CheckoutStep>("review");
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>(
    isScheduled ? "schedule" : diningMode,
  );
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Treasury payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentCurrency, setPaymentCurrency] = useState("KES");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Hooks
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const checkoutMutation = useCheckout();
  const applyPromo = useApplyPromoCode();

  // Fee breakdown — we use a synthetic cartId derived from items hash to cache
  const cartId = items.length > 0
    ? items.map((i) => `${i.id}:${i.quantity}`).join(",")
    : null;
  const { data: feeBreakdown, isLoading: feesLoading } = useFeeBreakdown(cartId);

  const cartSubtotal = subtotal();
  const grandTotal = feeBreakdown?.grand_total ?? cartSubtotal - discount;

  // Auto-select default address
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddressId(defaultAddr?.id ?? addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  // Sync fulfillment mode to dining mode store
  const handleFulfillmentChange = useCallback(
    (mode: FulfillmentMode) => {
      setFulfillmentMode(mode);
      if (mode === "schedule") {
        setIsScheduled(true);
        // Keep underlying dining mode as delivery for scheduled orders
        setDiningMode("delivery");
      } else {
        setIsScheduled(false);
        setScheduledTime(null);
        setDiningMode(mode as "delivery" | "pickup");
      }
    },
    [setDiningMode, setIsScheduled, setScheduledTime],
  );

  const handleScheduleSelect = useCallback(
    (date: Date) => {
      setScheduledTime({
        date,
        label: date.toLocaleString("en-US", {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      });
    },
    [setScheduledTime],
  );

  // Redirect to auth if not logged in
  if (status !== "authenticated") {
    return (
      <SiteShell>
        <div className="container mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16">
          <h1 className="text-2xl font-bold">Sign in to continue</h1>
          <p className="text-muted-foreground">You need to be signed in to place an order.</p>
          <Button asChild>
            <Link href={orgRoute(orgSlug, "/auth")}>Sign In</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  // Empty cart
  if (items.length === 0 && step !== "success") {
    return (
      <SiteShell>
        <div className="container mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16">
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground">Add some items before checking out.</p>
          <Button asChild>
            <Link href={orgRoute(orgSlug, "/menu")}>Browse Menu</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const result = await applyPromo.mutateAsync({ code: promoCode, subtotal: cartSubtotal });
      if (result.valid) {
        setDiscount(result.discount);
        setPromoMessage(result.message);
        toast.success("Promo code applied!");
      } else {
        setPromoMessage(result.message);
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to apply promo code");
    }
  };

  const handlePlaceOrder = async () => {
    // Validate delivery address for delivery/schedule modes
    if (fulfillmentMode !== "pickup" && !selectedAddressId && addresses.length > 0) {
      toast.error("Please select a delivery address");
      return;
    }

    if (fulfillmentMode === "schedule" && !scheduledTime) {
      toast.error("Please select a scheduled time");
      return;
    }

    setStep("processing");
    setOrderError(null);

    try {
      const outletId = items[0]?.outletId || "";
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const payload: Parameters<typeof checkoutMutation.mutateAsync>[0] = {
        outletId,
        fulfillmentType: fulfillmentMode,
        items: items.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
        })),
        idempotencyKey,
      };
      if (fulfillmentMode !== "pickup" && selectedAddressId) {
        payload.deliveryAddressId = selectedAddressId;
      }
      if (deliveryNotes) payload.deliveryNotes = deliveryNotes;
      if (promoCode) payload.promoCode = promoCode;
      if (orderNotes) payload.orderNotes = orderNotes;
      if (requestUtensils) payload.requestUtensils = requestUtensils;
      if (scheduledTime) payload.scheduledAt = scheduledTime.date.toISOString();

      const result = await checkoutMutation.mutateAsync(payload);

      setOrderId(result.orderId);
      setPaymentIntentId(result.paymentIntentId);
      setPaymentAmount(result.amount);
      setPaymentCurrency(result.currency || "KES");
      setStep("payment");
      setShowPaymentModal(true);
    } catch (error) {
      setStep("review");
      const message =
        error instanceof Error ? error.message : "Failed to place order. Please try again.";
      setOrderError(message);
      toast.error(message);
      console.error("Order placement failed:", error);
    }
  };

  const handlePaymentConfirmed = useCallback(
    (_result: PaymentResult) => {
      setShowPaymentModal(false);
      clearCart();
      setStep("success");
    },
    [clearCart],
  );

  const handlePaymentFailed = useCallback((error: string) => {
    toast.error(error || "Payment failed. You can try again.");
  }, []);

  const handlePaymentModalClose = useCallback(
    (open: boolean) => {
      setShowPaymentModal(open);
      if (!open && step === "payment") {
        // User closed modal without paying — go back to review
        setStep("review");
      }
    },
    [step],
  );

  return (
    <SiteShell hideBottomNav hideSidebar>
      <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="flex size-11 items-center justify-center rounded-lg hover:bg-muted active:bg-muted/80"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-xl font-bold sm:text-2xl">Checkout</h1>
        </div>

        {step === "success" ? (
          <SuccessView orderId={orderId!} />
        ) : (
          <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-6">
            {/* Fulfillment Toggle */}
            <FulfillmentToggle
              mode={fulfillmentMode}
              onModeChange={handleFulfillmentChange}
              deliveryTotal={feeBreakdown?.delivery_fee ?? 0}
              pickupTotal={0}
              estimatedTime="35-50 min"
            />

            {/* Schedule Picker */}
            {fulfillmentMode === "schedule" && (
              <SchedulePicker onSchedule={handleScheduleSelect} />
            )}

            {/* Address Selector (delivery / schedule) */}
            {fulfillmentMode !== "pickup" && (
              <AddressSelector
                addresses={addresses}
                selectedId={selectedAddressId}
                onSelect={setSelectedAddressId}
                onAddNew={() => {
                  // Navigate to location picker or open a modal
                  router.push(orgRoute(orgSlug, "/account/addresses/new"));
                }}
              />
            )}

            {/* Delivery Notes (delivery / schedule) */}
            {fulfillmentMode !== "pickup" && (
              <section className="rounded-xl border border-border p-4">
                <label className="mb-2 block text-sm font-medium">Delivery Notes</label>
                <Input
                  className="min-h-[44px]"
                  placeholder="Gate code, landmarks, instructions..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                />
              </section>
            )}

            {/* Order Items */}
            <section className="rounded-xl border border-border p-4">
              <h2 className="mb-3 text-sm font-medium">Order Summary</h2>
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <OrderItemRow key={item.id} item={item} />
                ))}
              </div>
            </section>

            {/* Promo Code */}
            <section className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag className="size-4 text-primary" />
                <span>Promo Code</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="min-h-[44px]"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={applyPromo.isPending}
                  className="min-h-[44px] shrink-0"
                >
                  {applyPromo.isPending ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
              {promoMessage && (
                <p className={`mt-2 text-xs ${discount > 0 ? "text-green-600" : "text-destructive"}`}>
                  {promoMessage}
                </p>
              )}
            </section>

            {/* Small Order Warning */}
            {feeBreakdown && feeBreakdown.small_order_fee > 0 && (
              <SmallOrderWarning
                currentSubtotal={feeBreakdown.subtotal}
                threshold={SMALL_ORDER_THRESHOLD}
                fee={feeBreakdown.small_order_fee}
              />
            )}

            {/* Fee Breakdown */}
            <FeeBreakdownCard feeBreakdown={feeBreakdown ?? null} loading={feesLoading} />

            {/* Error message */}
            {orderError && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-medium">Order could not be placed</p>
                <p className="mt-1 text-muted-foreground">{orderError}</p>
                <p className="mt-2 text-muted-foreground">Check your details and try again.</p>
              </div>
            )}

            {/* Place Order */}
            <SlideToConfirm
              onConfirm={handlePlaceOrder}
              loading={step === "processing" || checkoutMutation.isPending}
              total={grandTotal}
            />
          </div>
        )}
      </div>

      {/* Treasury Payment Modal */}
      {paymentIntentId && (
        <TreasuryPaymentModal
          open={showPaymentModal}
          onOpenChange={handlePaymentModalClose}
          paymentIntentId={paymentIntentId}
          tenantSlug={orgSlug}
          amount={paymentAmount}
          currency={paymentCurrency}
          description={`Order ${orderId ?? ""}`}
          onPaymentConfirmed={handlePaymentConfirmed}
          onPaymentFailed={handlePaymentFailed}
        />
      )}
    </SiteShell>
  );
}

function OrderItemRow({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {item.quantity}
        </span>
        <span className="text-sm">{item.name}</span>
      </div>
      <span className="text-sm font-medium">KES {item.total.toLocaleString()}</span>
    </div>
  );
}

function SuccessView({ orderId }: { orderId: string }) {
  const orgSlug = useOrgSlug();
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="size-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Order Placed!</h2>
        <p className="mt-2 text-muted-foreground">
          Payment confirmed. You can track your order below.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Button asChild className="w-full">
          <a
            href={`${
              process.env.NEXT_PUBLIC_LOGISTICS_UI_URL ?? "https://logistics.codevertexitsolutions.com"
            }/${orgSlug}/tracking?orderId=${encodeURIComponent(orderId)}`}
          >
            Track Your Order
          </a>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href={orgRoute(orgSlug, "/menu")}>Continue Browsing</Link>
        </Button>
      </div>
    </div>
  );
}
