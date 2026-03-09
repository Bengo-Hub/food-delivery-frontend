"use client";

import { ArrowLeft, CheckCircle2, CreditCard, Loader2, MapPin, Phone, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApplyPromoCode, useCreateOrder, useInitiateMpesaPayment, useOrder } from "@/hooks/use-orders";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useCartStore, type CartItem } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";

type PaymentMethod = "mpesa" | "cod";
type CheckoutStep = "review" | "payment" | "processing" | "awaiting_mpesa" | "success";

export default function CheckoutPage() {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const diningMode = useDiningModeStore((s) => s.mode);
  const deliveryLocation = useDiningModeStore((s) => s.deliveryLocation);

  const [step, setStep] = useState<CheckoutStep>("review");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone || "");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const createOrder = useCreateOrder();
  const initiateMpesa = useInitiateMpesaPayment();
  const applyPromo = useApplyPromoCode();

  const cartSubtotal = subtotal();
  const deliveryFee = diningMode === "delivery" ? (cartSubtotal > 2000 ? 0 : 150) : 0;
  const total = cartSubtotal - discount + deliveryFee;

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
    if (paymentMethod === "mpesa" && !mpesaPhone.trim()) {
      toast.error("Please enter your M-Pesa phone number");
      return;
    }

    if (diningMode === "delivery" && !deliveryLocation) {
      toast.error("Please set a delivery address");
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

      const orderPayload: Parameters<typeof createOrder.mutateAsync>[0] = {
        outletId,
        idempotencyKey,
        items: items.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total,
        })),
        deliveryAddress: deliveryLocation?.address || "Pickup",
        deliveryNotes,
        paymentMethod,
      };
      if (deliveryLocation) {
        orderPayload.deliveryLat = deliveryLocation.latitude;
        orderPayload.deliveryLng = deliveryLocation.longitude;
      }
      if (promoCode) {
        orderPayload.promoCode = promoCode;
      }
      const order = await createOrder.mutateAsync(orderPayload);

      setOrderId(order.id);

      if (paymentMethod === "mpesa") {
        // Initiate M-Pesa STK Push
        await initiateMpesa.mutateAsync({
          orderId: order.id,
          phoneNumber: mpesaPhone.startsWith("0") ? `254${mpesaPhone.slice(1)}` : mpesaPhone,
        });
        toast.success("M-Pesa payment request sent! Check your phone.");
        setStep("awaiting_mpesa");
        return;
      }

      clearCart();
      setStep("success");
    } catch (error) {
      setStep("payment");
      const message = error instanceof Error ? error.message : "Failed to place order. Please try again.";
      setOrderError(message);
      toast.error(message);
      console.error("Order placement failed:", error);
    }
  };

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

        {step === "awaiting_mpesa" && orderId ? (
          <AwaitingMpesaView
            orderId={orderId}
            onPaymentConfirmed={() => {
              clearCart();
              setStep("success");
            }}
          />
        ) : step === "success" ? (
          <SuccessView orderId={orderId!} paymentMethod={paymentMethod} />
        ) : (
          <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-6">
            {/* Delivery Info */}
            {diningMode === "delivery" && (
              <section className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4 text-primary" />
                  <span>Delivery Address</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {deliveryLocation?.address || "No delivery address set"}
                </p>
                <Input
                  className="mt-3 min-h-[44px]"
                  placeholder="Delivery notes (e.g., gate code, landmarks)"
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

            {/* Payment Method */}
            <section className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="size-4 text-primary" />
                <span>Payment Method</span>
              </div>
              <div className="mt-3 space-y-2">
                <PaymentOption
                  label="M-Pesa"
                  description="Pay via Safaricom M-Pesa STK Push"
                  selected={paymentMethod === "mpesa"}
                  onClick={() => setPaymentMethod("mpesa")}
                />
                <PaymentOption
                  label="Cash on Delivery"
                  description="Pay when your order arrives"
                  selected={paymentMethod === "cod"}
                  onClick={() => setPaymentMethod("cod")}
                />
              </div>

              {paymentMethod === "mpesa" && (
                <div className="mt-4">
                  <label className="mb-1 block text-xs text-muted-foreground">M-Pesa Phone Number</label>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      placeholder="0712345678"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      type="tel"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Price Breakdown */}
            <section className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>KES {cartSubtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-KES {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span>{deliveryFee === 0 ? <span className="text-green-600">Free</span> : `KES ${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span>KES {total.toLocaleString()}</span>
                </div>
              </div>
            </section>

            {/* Failed order submission error - keep form data, allow retry */}
            {orderError ? (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-medium">Order could not be placed</p>
                <p className="mt-1 text-muted-foreground">{orderError}</p>
                <p className="mt-2 text-muted-foreground">Check your details and try again.</p>
              </div>
            ) : null}

            {/* Place Order Button - Desktop inline */}
            <div className="hidden sm:block">
              <Button
                className="w-full min-h-[48px]"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={step === "processing" || createOrder.isPending}
              >
                {step === "processing" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order - KES ${total.toLocaleString()}`
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky order button */}
      {step !== "success" && step !== "awaiting_mpesa" && items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-3 safe-area-pb sm:hidden">
          <Button
            className="w-full min-h-[48px] text-base"
            size="lg"
            onClick={handlePlaceOrder}
            disabled={step === "processing" || createOrder.isPending}
          >
            {step === "processing" ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              `Place Order - KES ${total.toLocaleString()}`
            )}
          </Button>
        </div>
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

function PaymentOption({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-h-[52px] items-center gap-3 rounded-xl border p-3.5 text-left transition-colors active:scale-[0.98] ${
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      }`}
    >
      <div
        className={`flex size-5 items-center justify-center rounded-full border-2 ${
          selected ? "border-primary" : "border-muted-foreground/40"
        }`}
      >
        {selected && <div className="size-2.5 rounded-full bg-primary" />}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

const MPESA_POLL_MS = 3_000;
const PAYMENT_TIMEOUT_MS = 2 * 60 * 1_000;

function AwaitingMpesaView({ orderId, onPaymentConfirmed }: { orderId: string; onPaymentConfirmed: () => void }) {
  const orgSlug = useOrgSlug();
  const { data: order } = useOrder(orderId, { refetchWhilePending: true, refetchIntervalMs: MPESA_POLL_MS });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), PAYMENT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!order) return;
    const paid = order.paymentStatus === "paid" || order.paymentStatus === "authorized";
    const confirmed = ["confirmed", "preparing", "ready", "picked_up", "enroute", "delivered", "completed"].includes(order.status ?? "");
    if (paid || confirmed) onPaymentConfirmed();
  }, [order, onPaymentConfirmed]);

  if (timedOut) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Phone className="size-10 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Payment taking longer than expected</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You can track your order below. If you completed M-Pesa on your phone, the order will update shortly.
          </p>
        </div>
        <div className="space-y-3 w-full max-w-xs">
          <Button asChild className="w-full">
            <Link href={orgRoute(orgSlug, `/track/${orderId}`)}>Track Your Order</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href={orgRoute(orgSlug, "/menu")}>Back to Menu</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Check your phone</h2>
        <p className="mt-2 text-muted-foreground">
          Complete the M-Pesa prompt on your phone to confirm payment. This page will update automatically.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Polling for confirmation every few seconds…</p>
    </div>
  );
}

function SuccessView({ orderId, paymentMethod }: { orderId: string; paymentMethod: PaymentMethod }) {
  const orgSlug = useOrgSlug();
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="size-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Order Placed!</h2>
        <p className="mt-2 text-muted-foreground">
          {paymentMethod === "mpesa"
            ? "Payment confirmed. You can track your order below."
            : "Your order has been placed. Pay on delivery."}
        </p>
      </div>
      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link href={orgRoute(orgSlug, `/track/${orderId}`)}>Track Your Order</Link>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href={orgRoute(orgSlug, "/menu")}>Continue Browsing</Link>
        </Button>
      </div>
    </div>
  );
}
