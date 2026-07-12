"use client";

import { AlertTriangle, ArrowLeft, CalendarClock, CreditCard, Loader2, MapPin, ShoppingBag, Store, Ticket, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { AddressSelector } from "@/components/checkout/address-selector";
import { AttendeeInfoSection } from "@/components/checkout/attendee-info-section";
import { CheckoutModeChooser } from "@/components/checkout/checkout-mode-chooser";
import { DeliveryNotesSection } from "@/components/checkout/delivery-notes-section";
import { FeeBreakdownCard } from "@/components/checkout/fee-breakdown";
import { FulfillmentToggle } from "@/components/checkout/fulfillment-toggle";
import { GuestContactForm } from "@/components/checkout/guest-contact-form";
import { OrderSuccess } from "@/components/checkout/order-success";
import { OrderSummarySection } from "@/components/checkout/order-summary-section";
import { PromoCodeSection } from "@/components/checkout/promo-code-section";
import { SchedulePicker } from "@/components/checkout/schedule-picker";
import { SlideToConfirm } from "@/components/checkout/slide-to-confirm";
import { SmallOrderWarning } from "@/components/checkout/small-order-warning";
import {
  TreasuryPaymentModal,
} from "@/components/checkout/treasury-payment-modal";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import {
  useCheckoutState,
  type CheckoutPaymentOption,
  type CheckoutPaymentOptionId,
} from "@/hooks/use-checkout-state";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { orgRoute } from "@/lib/routes";

const SMALL_ORDER_THRESHOLD = 500;

export default function CheckoutPage() {
  // Single hook call — guarantees stable hook count across all render paths
  const state = useCheckoutState();
  const { hasFeature } = useSubscription();
  // Plan-driven storefront features (exempt tenants pass via hasFeature).
  const showPromoCodes = hasFeature("promo_codes");
  const showScheduledDelivery = hasFeature("scheduled_delivery");
  const showWalletPay = hasFeature("wallet");

  // Intercept wallet payment requests from the treasury-ui iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "treasury:wallet_payment_request") {
        state.handleWalletPayment();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [state.handleWalletPayment]);

  // Derive content based on state — no early returns, keeping hook count stable
  let content: React.ReactNode;

  if (state.items.length === 0 && state.step !== "success") {
    // Empty cart
    content = (
      <div className="container mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16">
        <ShoppingBag className="size-12 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">Add some items before checking out.</p>
        <Button asChild>
          <Link href={orgRoute(state.orgSlug, "/catalog")}>Browse Catalog</Link>
        </Button>
      </div>
    );
  } else if (state.checkoutMode === "choose" && state.status !== "authenticated") {
    // Guest vs sign-in chooser
    content = (
      <CheckoutModeChooser
        onChooseGuest={() => state.setCheckoutMode("guest")}
        onChooseSignIn={state.handleSignInForCheckout}
      />
    );
  } else if (state.step === "success") {
    // Order placed
    content = <OrderSuccess orderId={state.orderId!} />;
  } else {
    // Main checkout review
    content = (
      <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <button
            onClick={() => state.router.back()}
            className="flex size-11 items-center justify-center rounded-lg hover:bg-muted active:bg-muted/80"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-xl font-bold sm:text-2xl">Checkout</h1>
        </div>

        <div className="space-y-4 pb-28 sm:space-y-6 sm:pb-6">
          {/* Guest contact info */}
          {state.isGuestMode && (
            <GuestContactForm
              email={state.guestEmail}
              phone={state.guestPhone}
              name={state.guestName}
              onEmailChange={state.setGuestEmail}
              onPhoneChange={state.setGuestPhone}
              onNameChange={state.setGuestName}
              onSignIn={state.handleSignInForCheckout}
            />
          )}

          {/* Event tickets need no delivery/pickup/fees — show a short note instead. */}
          {state.isTicketOnly && (
            <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <Ticket className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Event tickets</p>
                <p className="mt-1 text-muted-foreground">
                  Your tickets (with QR codes) are emailed to you right after payment — no delivery or pickup needed.
                </p>
              </div>
            </div>
          )}

          {/* Per-ticket attendee details (optional) — collects name+email per seat
              and writes them to each ticket line's metadata.attendees. */}
          {state.isTicketOnly && <AttendeeInfoSection items={state.items} />}

          {/* Appointment bookings (salon/spa/services) need no delivery/pickup — the
              customer visits the provider at the time chosen on the service page. Show
              the booked time(s) instead of a fulfillment picker. */}
          {state.isAppointmentOnly && <AppointmentSummary items={state.items} />}

          {!state.noFulfillment && (
            <>
              {/* 1. LOCATION — Address selector for delivery/schedule, outlet selector for pickup */}
              {state.fulfillmentMode !== "pickup" ? (
                <AddressSelector
                  addresses={state.addresses}
                  selectedId={state.selectedAddressId}
                  onSelect={state.setSelectedAddressId}
                  onGuestLocationSelect={state.setGuestDeliveryLocation}
                  guestAddress={state.guestDeliveryLocation}
                  onAddNew={() => {/* handled inside modal */}}
                  isGuest={state.isGuestMode}
                  scheduledTime={state.scheduledTime}
                  onSchedule={state.handleScheduleSelect}
                />
              ) : state.outlets.length > 0 ? (
                <PickupOutletSelector
                  outlets={state.outlets}
                  selectedId={state.selectedPickupOutletId ?? state.outletId}
                  onSelect={state.setSelectedPickupOutletId}
                />
              ) : null}

              {/* Zone validation error */}
              {state.isOutsideDeliveryZone && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <p className="font-medium">We don&apos;t deliver to this address</p>
                    <p className="mt-1 text-muted-foreground">
                      The selected address is outside our delivery area. Please choose a different address.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. FULFILLMENT — Delivery / Pickup / Schedule toggle.
                  Scheduled delivery is a plan-gated feature; hide the option when
                  the tenant's plan lacks it (core delivery/pickup stay available). */}
              <FulfillmentToggle
                mode={state.fulfillmentMode}
                onModeChange={state.handleFulfillmentChange}
                deliveryTotal={state.zoneResult?.delivery_fee ?? state.feeBreakdown?.delivery_fee ?? 0}
                pickupTotal={0}
                estimatedTime={state.estimatedTime}
                allowSchedule={showScheduledDelivery}
              />

              {/* Schedule picker */}
              {showScheduledDelivery && state.fulfillmentMode === "schedule" && (
                <SchedulePicker onSchedule={state.handleScheduleSelect} />
              )}

              {/* Delivery notes (delivery/schedule only) */}
              {state.fulfillmentMode !== "pickup" && (
                <DeliveryNotesSection value={state.deliveryNotes} onChange={state.setDeliveryNotes} />
              )}
            </>
          )}

          {/* 3. ORDER — Items summary */}
          <OrderSummarySection items={state.items} />

          {/* Promo code — plan-gated; hidden when the tenant's plan lacks promo codes */}
          {showPromoCodes && (
            <PromoCodeSection
              code={state.promoCode}
              message={state.promoMessage}
              discount={state.discount}
              isPending={state.promoIsPending}
              onCodeChange={state.setPromoCode}
              onApply={state.handleApplyPromo}
            />
          )}

          {/* Small order warning */}
          {state.feeBreakdown && state.feeBreakdown.small_order_fee > 0 && (
            <SmallOrderWarning
              currentSubtotal={state.feeBreakdown.subtotal}
              threshold={SMALL_ORDER_THRESHOLD}
              fee={state.feeBreakdown.small_order_fee}
            />
          )}

          {/* 4. FEES — Breakdown (+ deposit split for booking-deposit carts) */}
          <FeeBreakdownCard
            feeBreakdown={state.feeBreakdown ?? null}
            loading={state.feesLoading}
            deposit={state.depositBreakdown}
          />

          {/* 5. PAYMENT METHOD — choose how to pay */}
          {state.paymentOptions.length > 0 && (
            <PaymentMethodSelector
              options={state.paymentOptions}
              selected={state.selectedOptionId}
              onSelect={state.setSelectedOptionId}
            />
          )}

          {/* Error message */}
          {state.orderError && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">Order could not be placed</p>
              <p className="mt-1 text-muted-foreground">{state.orderError}</p>
              <p className="mt-2 text-muted-foreground">Check your details and try again.</p>
            </div>
          )}

          {/* 5. PLACE ORDER — disabled until address selected (delivery) or pickup chosen */}
          <SlideToConfirm
            onConfirm={state.handlePlaceOrder}
            loading={state.isPlacingOrder}
            disabled={!state.noFulfillment && state.fulfillmentMode !== "pickup" && !state.hasDeliveryAddress}
            total={state.grandTotal}
            {...(state.hasBookingDeposit
              ? { label: `Pay deposit - KES ${state.depositAmount.toLocaleString()}` }
              : {})}
          />
        </div>
      </div>
    );
  }

  return (
    <SiteShell hideBottomNav hideSidebar>
      {content}

      {/* Wallet payment option — shown inline when payment step is active and user has balance.
          Plan-gated: hidden when the tenant's plan lacks the wallet feature. */}
      {showWalletPay && state.showPaymentModal && !state.isGuestMode && state.walletBalance !== null && state.walletBalance > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-4 shadow-lg sm:relative sm:bottom-auto sm:border sm:rounded-xl sm:mt-0 sm:mx-auto sm:max-w-md sm:z-auto">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pay with Wallet</p>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="size-4 text-primary" />
              <span>Balance: <span className="font-semibold">{state.walletCurrency} {state.walletBalance.toLocaleString()}</span></span>
            </div>
            {state.walletBalance >= state.paymentAmount ? (
              <Button
                size="sm"
                onClick={() => state.handleWalletPayment()}
                disabled={state.walletPaymentPending}
              >
                {state.walletPaymentPending && <Loader2 className="mr-1 size-3 animate-spin" />}
                Pay {state.paymentCurrency} {state.paymentAmount.toLocaleString()}
              </Button>
            ) : (
              <span className="text-xs text-destructive">Insufficient balance</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">or choose another payment method below</p>
        </div>
      )}

      {/* Treasury payment modal — always rendered to keep hook count stable.
          The modal internally returns null when open=false. */}
      <TreasuryPaymentModal
        open={state.showPaymentModal}
        onOpenChange={state.handlePaymentModalClose}
        paymentIntentId={state.paymentIntentId ?? ""}
        initiateUrl={state.initiateUrl ?? ""}
        customerEmail={state.isGuestMode ? state.guestEmail : (state.user?.email ?? "")}
        tenantSlug={state.orgSlug}
        amount={state.paymentAmount}
        currency={state.paymentCurrency}
        description={`Order ${state.orderId ?? ""}`}
        referenceId={state.orderId ?? ""}
        referenceType="order"
        onPaymentConfirmed={state.handlePaymentConfirmed}
        onPaymentFailed={state.handlePaymentFailed}
      />
    </SiteShell>
  );
}

// ─── Payment Method Selector ────────────────────────────────────────

interface PaymentMethodSelectorProps {
  options: CheckoutPaymentOption[];
  selected: CheckoutPaymentOptionId | undefined;
  onSelect: (id: CheckoutPaymentOptionId) => void;
}

function PaymentMethodSelector({ options, selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <CreditCard className="size-4 text-primary" />
        <span>Payment Method</span>
      </div>
      <div className="space-y-2" role="radiogroup" aria-label="Payment method">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border-2",
                  isSelected ? "border-primary" : "border-muted-foreground/40",
                )}
              >
                {isSelected && <div className="size-2.5 rounded-full bg-primary" />}
              </div>
              <span className="min-w-0 flex-1 text-sm font-medium">{opt.label}</span>
              {opt.method === "wallet" && <Wallet className="size-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Appointment Summary (services / salon / spa bookings) ──────────
// Booking carts carry the chosen date+time on each line's metadata (set on the
// service detail page). We surface it here in place of the delivery/pickup picker.

interface AppointmentSummaryItem {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
}

function formatApptDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // already human-readable — show as-is
  return d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function AppointmentSummary({ items }: { items: AppointmentSummaryItem[] }) {
  return (
    <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <CalendarClock className="size-4 text-primary" />
        <span>Your appointment</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const meta = item.metadata ?? {};
          const date = formatApptDate(meta.appointment_date);
          const time = typeof meta.appointment_time === "string" ? meta.appointment_time : null;
          return (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 font-medium">{item.name}</span>
              <span className="shrink-0 text-right text-muted-foreground">
                {date}
                {date && time ? " · " : ""}
                {time}
                {!date && !time ? "Time to be confirmed" : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        No delivery or pickup needed — just arrive at the provider at your booked time.
      </p>
    </section>
  );
}

// ─── Pickup Outlet Selector ─────────────────────────────────────────

interface PickupOutletSelectorProps {
  outlets: Array<{ id: string; name: string; address?: string }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function PickupOutletSelector({ outlets, selectedId, onSelect }: PickupOutletSelectorProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Store className="size-4 text-primary" />
        <span>Pickup Location</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Select the outlet where you&apos;ll pick up your order.
      </p>
      <div className="space-y-2">
        {outlets.map((outlet) => {
          const selected = selectedId === outlet.id;
          return (
            <button
              key={outlet.id}
              type="button"
              onClick={() => onSelect(outlet.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <div className={cn(
                "flex size-5 items-center justify-center rounded-full border-2",
                selected ? "border-primary" : "border-muted-foreground/40",
              )}>
                {selected && <div className="size-2.5 rounded-full bg-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{outlet.name}</p>
                {outlet.address && (
                  <p className="truncate text-xs text-muted-foreground">{outlet.address}</p>
                )}
              </div>
              <MapPin className={cn("size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground/40")} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
