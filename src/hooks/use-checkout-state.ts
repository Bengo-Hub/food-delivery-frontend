"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAddresses } from "@/hooks/use-addresses";
import { useCheckout, useGuestCheckout, useFeeBreakdown } from "@/hooks/use-cart-api";
import { useOutlet } from "@/hooks/use-catalog";
import { useApplyPromoCode } from "@/hooks/use-orders";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useZoneCheck } from "@/hooks/use-zones";
import { apiErrorMessage } from "@/lib/api/error-message";
import { api } from "@/lib/api/base";
import { payOrderWithWallet } from "@/lib/api/orders";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";
import type { PaymentResult } from "@/components/checkout/treasury-payment-modal";

export type FulfillmentMode = "delivery" | "pickup" | "schedule";
export type CheckoutStep = "review" | "processing" | "payment" | "success";

/**
 * Stable identifier for a selectable checkout payment option. Several options can
 * map to the same backend `method` (e.g. pay-now M-Pesa vs M-Pesa-on-collection
 * both send `mpesa`), so the UI tracks the OPTION id to drive post-place behavior.
 */
export type CheckoutPaymentOptionId =
  | "paystack_now"
  | "mpesa_now"
  | "wallet"
  | "cod_collection"
  | "mpesa_collection";

/** A payment method the customer can select at checkout. */
export interface CheckoutPaymentOption {
  /** Stable option identifier; distinguishes pay-now vs pay-on-collection. */
  id: CheckoutPaymentOptionId;
  /** Backend method key sent as `paymentMethod` (e.g. "mpesa", "paystack", "cod", "wallet"). */
  method: string;
  /** Human-readable label shown in the selector (adapts to delivery/pickup). */
  label: string;
  /**
   * Pay-now options open the treasury payment modal so the customer pays
   * immediately. Pay-on-collection options place the order pending and settle
   * later (cash at handover / staff STK / guest order page).
   */
  payNow: boolean;
}

const SMALL_ORDER_THRESHOLD = 500;

export function useCheckoutState() {
  const router = useRouter();
  const orgSlug = useOrgSlug();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clear);
  const orderNotes = useCartStore((s) => s.orderNotes);
  const requestUtensils = useCartStore((s) => s.requestUtensils);
  const sessionId = useCartStore((s) => s.sessionId);
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const redirectToSSO = useAuthStore((s) => s.redirectToSSO);
  const diningMode = useDiningModeStore((s) => s.mode);
  const setDiningMode = useDiningModeStore((s) => s.setMode);
  const isScheduled = useDiningModeStore((s) => s.isScheduled);
  const setIsScheduled = useDiningModeStore((s) => s.setIsScheduled);
  const scheduledTime = useDiningModeStore((s) => s.scheduledTime);
  const setScheduledTime = useDiningModeStore((s) => s.setScheduledTime);

  // Event tickets check out on their own (no delivery/pickup/fees/preferences). A cart is
  // ticket-only when every line carries metadata.is_ticket (enforced by the cart mixing guard).
  const isTicketOnly = useMemo(
    () => items.length > 0 && items.every((i) => (i.metadata as { is_ticket?: boolean } | undefined)?.is_ticket === true),
    [items],
  );

  // Appointment/service carts (salon/spa/services vertical) are booked for a date+time —
  // the date/time is captured on the product page into each line's metadata.is_service.
  // Like tickets, they have no delivery/pickup/address/delivery-fee: the customer visits
  // the provider at the chosen time. Detected the same metadata-driven way as isTicketOnly.
  const isAppointmentOnly = useMemo(
    () => items.length > 0 && items.every((i) => (i.metadata as { is_service?: boolean } | undefined)?.is_service === true),
    [items],
  );

  // Booking carts (tickets or appointments) skip the whole delivery/pickup fulfillment flow.
  const noFulfillment = isTicketOnly || isAppointmentOnly;

  // Step & fulfillment
  const [step, setStep] = useState<CheckoutStep>("review");
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>(
    isScheduled ? "schedule" : diningMode,
  );

  // Promo
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");

  // Delivery
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [initiateUrl, setInitiateUrl] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentCurrency, setPaymentCurrency] = useState("KES");
  const [orderId, setOrderId] = useState<string | null>(null);

  // Guest
  const [checkoutMode, setCheckoutMode] = useState<"choose" | "guest" | "authenticated">(
    status === "authenticated" ? "authenticated" : "choose",
  );
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestDeliveryLocation, setGuestDeliveryLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  // Wallet payment state
  const [walletPaymentPending, setWalletPaymentPending] = useState(false);

  // Selected payment OPTION id (distinguishes pay-now vs pay-on-collection even
  // when two options share the same backend `paymentMethod`).
  const [selectedOptionId, setSelectedOptionId] = useState<
    CheckoutPaymentOptionId | undefined
  >(undefined);

  // Queries & mutations
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const checkoutMutation = useCheckout();
  const guestCheckoutMutation = useGuestCheckout();
  const applyPromo = useApplyPromoCode();
  const { data: paymentMethodsData } = usePaymentMethods(fulfillmentMode);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // Zone check — use saved address coords OR guest-picked location coords
  const deliveryLat = fulfillmentMode !== "pickup"
    ? (selectedAddress?.lat ?? guestDeliveryLocation?.lat ?? null)
    : null;
  const deliveryLng = fulfillmentMode !== "pickup"
    ? (selectedAddress?.lng ?? guestDeliveryLocation?.lng ?? null)
    : null;
  const { data: zoneResult, isLoading: zoneLoading, isError: zoneError } = useZoneCheck(deliveryLat, deliveryLng);

  const hasDeliveryAddress = !!(selectedAddress || guestDeliveryLocation);
  const isOutsideDeliveryZone =
    fulfillmentMode !== "pickup" && hasDeliveryAddress && !zoneLoading && (zoneError || !zoneResult);

  // Resolve outlet ID — from cart item or fetch first outlet as fallback
  const cartOutletId = items[0]?.outletId || null;
  const { data: outlets = [] } = useQuery({
    queryKey: ["checkout-outlets", orgSlug],
    queryFn: async () => {
      const res = await api.get(`${orgSlug}/outlets?limit=10`);
      return res.data?.data ?? [];
    },
    enabled: !cartOutletId, // only fetch if cart items don't have outletId
    staleTime: 5 * 60_000,
  });
  const outletId = cartOutletId || outlets[0]?.id || null;
  const [selectedPickupOutletId, setSelectedPickupOutletId] = useState<string | null>(null);

  const { data: remoteFees, isLoading: feesLoading } = useFeeBreakdown(outletId, fulfillmentMode, sessionId);

  const cartSubtotal = subtotal();
  const deliveryFee = zoneResult?.delivery_fee ?? remoteFees?.delivery_fee ?? 0;

  // Use backend fee breakdown when available and non-zero; otherwise compute locally
  const feeBreakdown: import("@/lib/api/cart-api").FeeBreakdown | undefined =
    noFulfillment && cartSubtotal > 0
      ? {
          item_total: cartSubtotal,
          discount,
          packaging_fee: 0,
          subtotal: cartSubtotal - discount,
          small_order_fee: 0,
          service_fee: 0,
          delivery_fee: 0,
          delivery_discount: 0,
          tax_total: 0,
          grand_total: cartSubtotal - discount,
        }
      : remoteFees && remoteFees.item_total > 0
      ? remoteFees
      : cartSubtotal > 0
        ? {
            item_total: cartSubtotal,
            discount,
            packaging_fee: 0,
            subtotal: cartSubtotal - discount,
            small_order_fee: 0,
            service_fee: 0,
            delivery_fee: fulfillmentMode === "pickup" ? 0 : deliveryFee,
            delivery_discount: 0,
            tax_total: 0,
            grand_total: cartSubtotal - discount + (fulfillmentMode === "pickup" ? 0 : deliveryFee),
          }
        : undefined;

  const grandTotal = feeBreakdown?.grand_total ?? cartSubtotal - discount;

  // ─── Per-outlet booking deposit (tickets / appointments only) ──────────
  // Resolve the checkout outlet via the existing outlet hook to read its
  // bookingDepositPercent. For a BOOKING cart with a deposit % > 0 the customer
  // pays only the deposit now; the backend independently charges the same amount
  // (round2(total * pct/100)) and records deposit_amount/balance_due on the order.
  const { data: checkoutOutlet } = useOutlet(orgSlug, outletId ?? "");
  const bookingDepositPercent = checkoutOutlet?.bookingDepositPercent ?? 0;
  const hasBookingDeposit = noFulfillment && bookingDepositPercent > 0 && grandTotal > 0;
  // round2: multiply then round to 2dp — MUST match the backend's deposit formula.
  const depositAmount = hasBookingDeposit
    ? Math.round(grandTotal * bookingDepositPercent) / 100
    : 0;
  const balanceDue = hasBookingDeposit ? Math.round((grandTotal - depositAmount) * 100) / 100 : 0;
  // The amount actually collected now (deposit for booking-deposit carts, else full).
  const amountDueNow = hasBookingDeposit ? depositAmount : grandTotal;
  const depositBreakdown = hasBookingDeposit
    ? {
        percent: bookingDepositPercent,
        depositAmount,
        balanceDue,
        balanceLabel: isTicketOnly ? "Balance due at event" : "Balance due at appointment",
      }
    : null;

  const estimatedTime = zoneResult
    ? `${zoneResult.estimated_time}-${zoneResult.estimated_time + 15} min`
    : "35-50 min";

  const isGuestMode = checkoutMode === "guest" && status !== "authenticated";

  // ─── Payment method options (from the payment-methods aggregate) ───────
  const walletBalance = paymentMethodsData?.wallet?.balance ?? null;
  const walletCurrency = paymentMethodsData?.wallet?.currency ?? "KES";

  // Classify backend gateway `type` values. COD / cash variants enable the
  // pay-on-collection options; an M-Pesa STK gateway enables both pay-now M-Pesa
  // and M-Pesa-on-collection (deferred STK at handover / guest page).
  const isCodGateway = (t: string) => /cash|cod|on_delivery|on_pickup|on_collection/i.test(t);
  const isMpesaGateway = (t: string) => t === "mpesa" || t === "stk" || t === "mpesa_stk";
  const isPaystackGateway = (t: string) => t === "paystack" || t === "card";

  const paymentOptions = useMemo<CheckoutPaymentOption[]>(() => {
    const gateways = paymentMethodsData?.gateways ?? [];
    const opts: CheckoutPaymentOption[] = [];

    // Pickup collects at the outlet; delivery (and schedule, which is delivery-like)
    // collects at the customer's door. Labels adapt to the channel.
    const isPickup = fulfillmentMode === "pickup";
    const collectWord = isPickup ? "Pickup" : "Delivery";

    let hasMpesa = false;
    let hasPaystack = false;
    let hasCod = false;

    for (const g of gateways) {
      if (!g.enabled) continue;
      const t = g.type.toLowerCase();
      if (isMpesaGateway(t)) hasMpesa = true;
      else if (isPaystackGateway(t)) hasPaystack = true;
      else if (isCodGateway(t)) hasCod = true;
    }

    // ── Pay now ───────────────────────────────────────────────────────
    if (hasPaystack) {
      opts.push({
        id: "paystack_now",
        method: "paystack",
        label: "Pay now — Card (Paystack)",
        payNow: true,
      });
    }
    if (hasMpesa) {
      opts.push({
        id: "mpesa_now",
        method: "mpesa",
        label: "Pay now — M-Pesa (STK)",
        payNow: true,
      });
    }

    // Wallet — authenticated users only, and only when the balance covers the amount
    // due now (the deposit for booking-deposit carts, otherwise the full total).
    if (!isGuestMode && walletBalance !== null && walletBalance >= amountDueNow && amountDueNow > 0) {
      opts.push({
        id: "wallet",
        method: "wallet",
        label: `Wallet (balance ${walletCurrency} ${walletBalance.toLocaleString()})`,
        payNow: false,
      });
    }

    // ── Pay on collection (cash / deferred M-Pesa at handover) ─────────
    if (hasCod) {
      opts.push({
        id: "cod_collection",
        method: "cod",
        label: `Cash on ${collectWord}`,
        payNow: false,
      });
    }
    if (hasMpesa) {
      opts.push({
        id: "mpesa_collection",
        method: "mpesa",
        label: `M-Pesa on ${collectWord}`,
        payNow: false,
      });
    }

    return opts;
  }, [paymentMethodsData, fulfillmentMode, isGuestMode, walletBalance, walletCurrency, amountDueNow]);

  // The currently selected option object (derived from the tracked id).
  const selectedOption = useMemo(
    () => paymentOptions.find((o) => o.id === selectedOptionId) ?? null,
    [paymentOptions, selectedOptionId],
  );
  // Backend method key sent as `paymentMethod` for the current selection.
  const selectedMethod = selectedOption?.method;

  // Keep a valid selection: default to the first option, and clear/repair the
  // selection if the available options change (e.g. wallet drops off the list,
  // or the fulfillment channel switches so labels/ids change).
  useEffect(() => {
    if (paymentOptions.length === 0) {
      if (selectedOptionId !== undefined) setSelectedOptionId(undefined);
      return;
    }
    if (!selectedOptionId || !paymentOptions.some((o) => o.id === selectedOptionId)) {
      setSelectedOptionId(paymentOptions[0].id);
    }
  }, [paymentOptions, selectedOptionId]);

  // Auto-select default address
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddressId(defaultAddr?.id ?? addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  // Sync mode when auth status changes
  useEffect(() => {
    if (status === "authenticated") setCheckoutMode("authenticated");
  }, [status]);

  const handleFulfillmentChange = useCallback(
    (mode: FulfillmentMode) => {
      setFulfillmentMode(mode);
      if (mode === "schedule") {
        setIsScheduled(true);
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

  const handleSignInForCheckout = useCallback(() => {
    const checkoutUrl = orgRoute(orgSlug, "/checkout");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sso_return_to", checkoutUrl);
    }
    void redirectToSSO(checkoutUrl, orgSlug);
  }, [orgSlug, redirectToSSO]);

  const handleApplyPromo = useCallback(async () => {
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
    } catch (e) {
      toast.error(await apiErrorMessage(e, "Failed to apply promo code"));
    }
  }, [promoCode, cartSubtotal, applyPromo]);

  const handleWalletPayment = useCallback(
    async (explicitOrderId?: string) => {
      const targetOrderId = explicitOrderId ?? orderId;
      if (!targetOrderId) return;
      setWalletPaymentPending(true);
      try {
        await payOrderWithWallet(orgSlug, targetOrderId);
        setShowPaymentModal(false);
        clearCart();
        setStep("success");
        toast.success("Payment successful!");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } }; message?: string })
          ?.response?.data?.error ?? (err instanceof Error ? err.message : "Wallet payment failed");
        toast.error(msg);
        // Fall back to the standard payment flow so the user isn't stuck.
        setStep("payment");
        setShowPaymentModal(true);
      } finally {
        setWalletPaymentPending(false);
      }
    },
    [orderId, orgSlug, clearCart],
  );

  const handlePlaceOrder = useCallback(async () => {
    if (isGuestMode) {
      if (!guestEmail.trim() && !guestPhone.trim()) {
        toast.error("Please provide an email or phone number");
        return;
      }
      if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }
      // A bad phone means the rider/outlet can't reach the customer — validate the format
      // (optional leading +, 8–15 digits, spaces/dashes allowed) when one is provided.
      if (guestPhone.trim() && !/^\+?\d[\d\s-]{7,14}$/.test(guestPhone.trim())) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    // Delivery/pickup/schedule validations don't apply to booking carts (tickets/appointments).
    if (!noFulfillment) {
      if (fulfillmentMode !== "pickup" && !selectedAddressId && addresses.length > 0) {
        toast.error("Please select a delivery address");
        return;
      }
      // Guest delivery: the address comes from the picked location, not a saved address —
      // require it so a rider isn't dispatched to an empty/unknown address.
      if (isGuestMode && fulfillmentMode !== "pickup" && !guestDeliveryLocation?.address?.trim()) {
        toast.error("Please enter a delivery address");
        return;
      }
      if (isOutsideDeliveryZone) {
        toast.error("We don't deliver to the selected address. Please choose a different address.");
        return;
      }
      if (fulfillmentMode === "schedule" && !scheduledTime) {
        toast.error("Please select a scheduled time");
        return;
      }
    }

    // Booking carts (tickets/appointments) have no fulfillment — send pickup so no
    // delivery address/fee is required. Deposits (per-outlet bookingDepositPercent)
    // and per-ticket attendees are handled here: the backend charges the deposit and
    // reads metadata.attendees off each ticket line — both flow through untouched on
    // the line metadata below.
    const effectiveFulfillment: FulfillmentMode = noFulfillment ? "pickup" : fulfillmentMode;

    setStep("processing");
    setOrderError(null);

    try {
      const checkoutOutletId = outletId || selectedPickupOutletId || items[0]?.outletId || "";
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      let result;

      if (isGuestMode) {
        const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
        const guestPayload: Parameters<typeof guestCheckoutMutation.mutateAsync>[0] = {
          outletId: checkoutOutletId,
          sessionId,
          fulfillmentType: effectiveFulfillment,
          idempotencyKey,
          items: items.map((item) => ({
            inventorySku: item.inventorySku || item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.total,
            ...(item.metadata ? { metadata: item.metadata } : {}),
          })),
        };
        if (guestEmail.trim()) guestPayload.contactEmail = guestEmail.trim();
        if (guestPhone.trim()) guestPayload.contactPhone = guestPhone.trim();
        if (guestName.trim()) guestPayload.contactName = guestName.trim();
        // Delivery address from saved address or guest-picked location
        if (selectedAddr) {
          guestPayload.deliveryAddress = selectedAddr.address ?? "";
          guestPayload.deliveryLat = selectedAddr.lat;
          guestPayload.deliveryLng = selectedAddr.lng;
        } else if (guestDeliveryLocation) {
          guestPayload.deliveryAddress = guestDeliveryLocation.address;
          guestPayload.deliveryLat = guestDeliveryLocation.lat;
          guestPayload.deliveryLng = guestDeliveryLocation.lng;
        }
        if (deliveryNotes) guestPayload.deliveryNotes = deliveryNotes;
        if (scheduledTime) guestPayload.scheduledAt = scheduledTime.date.toISOString();
        if (selectedMethod) guestPayload.paymentMethod = selectedMethod;
        result = await guestCheckoutMutation.mutateAsync(guestPayload);
      } else {
        const payload: Parameters<typeof checkoutMutation.mutateAsync>[0] = {
          outletId: checkoutOutletId,
          fulfillmentType: effectiveFulfillment,
          items: items.map((item) => ({
            inventorySku: item.inventorySku || item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.total,
            ...(item.metadata ? { metadata: item.metadata } : {}),
          })),
          idempotencyKey,
        };
        // Attach authenticated user contact details so orders show customer info
        if (user?.email) payload.contactEmail = user.email;
        if (user?.fullName) payload.contactName = user.fullName;
        if (user?.phone != null) payload.contactPhone = user.phone;
        if (fulfillmentMode !== "pickup" && selectedAddressId) payload.deliveryAddressId = selectedAddressId;
        if (deliveryNotes) payload.deliveryNotes = deliveryNotes;
        if (promoCode) payload.promoCode = promoCode;
        if (orderNotes) payload.orderNotes = orderNotes;
        if (requestUtensils) payload.requestUtensils = requestUtensils;
        if (scheduledTime) payload.scheduledAt = scheduledTime.date.toISOString();
        if (selectedMethod) payload.paymentMethod = selectedMethod;
        result = await checkoutMutation.mutateAsync(payload);
      }

      setOrderId(result.orderId);
      setPaymentAmount(result.amount);
      setPaymentCurrency(result.currency || "KES");

      // Pay-on-collection options (cash / deferred M-Pesa at handover) place the
      // order pending and settle later — never open the pay-now modal for them.
      const isPayOnCollection = selectedOption != null && !selectedOption.payNow && selectedOption.method !== "wallet";

      if (result.paymentError && !isPayOnCollection) {
        // Treasury unavailable — order was created but the pay-now intent failed.
        // (Pay-on-collection orders don't need an intent, so ignore this.)
        setStep("review");
        setOrderError(result.paymentError);
        toast.error(`Order #${result.orderNumber || result.orderId.slice(0, 8)} created but payment gateway is unavailable. Please retry.`);
        const orderUrl = isGuestMode
          ? `${orgRoute(orgSlug, `/orders/guest/${result.orderId}`)}?session_id=${sessionId}`
          : orgRoute(orgSlug, `/orders/${result.orderId}`);
        router.push(orderUrl);
      } else if (selectedOption?.method === "wallet") {
        // Wallet chosen (authed + balance covers total) — pay the freshly created
        // order straight from the wallet instead of the treasury modal.
        // Prime the modal state first so the catch-fallback can recover gracefully.
        setPaymentIntentId(result.paymentIntentId || null);
        setInitiateUrl(result.initiateUrl || null);
        await handleWalletPayment(result.orderId);
      } else if (isPayOnCollection) {
        // Cash on collection / M-Pesa on collection — the order is placed pending
        // and paid at handover (cash) or via the guest order page / staff STK.
        // No modal: treat as success.
        clearCart();
        setStep("success");
      } else if (!result.paymentIntentId) {
        // Zero-amount or backend reports nothing to pay — no payment modal needed.
        clearCart();
        setStep("success");
      } else {
        // Pay now (Paystack / M-Pesa STK) — show the treasury payment modal.
        setPaymentIntentId(result.paymentIntentId);
        setInitiateUrl(result.initiateUrl);
        setStep("payment");
        setShowPaymentModal(true);
      }
    } catch (error: unknown) {
      setStep("review");
      const message =
        error instanceof Error ? error.message : "Failed to place order. Please try again.";
      setOrderError(message);
      toast.error(message);
    }
  }, [
    isGuestMode, guestEmail, guestPhone, guestName, guestDeliveryLocation,
    fulfillmentMode, selectedAddressId, addresses, isOutsideDeliveryZone, scheduledTime,
    items, sessionId, deliveryNotes, promoCode, orderNotes, requestUtensils, isTicketOnly, noFulfillment,
    checkoutMutation, guestCheckoutMutation, orgSlug, router, clearCart,
    selectedMethod, selectedOption, handleWalletPayment,
  ]);

  const handlePaymentConfirmed = useCallback(
    async (_result: PaymentResult) => {
      setStep("success");
      clearCart();
      setShowPaymentModal(false);
      const orderUrl = isGuestMode
        ? `${orgRoute(orgSlug, `/orders/guest/${orderId}`)}?session_id=${sessionId}`
        : orgRoute(orgSlug, `/orders/${orderId}`);
      router.push(orderUrl);
    },
    [clearCart, orgSlug, orderId, isGuestMode, sessionId, router],
  );

  const handlePaymentFailed = useCallback((error: string) => {
    toast.error(error || "Payment failed. You can try again.");
  }, []);

  const handlePaymentModalClose = useCallback(
    (open: boolean) => {
      setShowPaymentModal(open);
      if (!open && step === "payment") {
        if (orderId) {
          // Order was created — clear cart and redirect to order page
          // so the user can track or complete payment there.
          clearCart();
          const orderUrl = isGuestMode
            ? `${orgRoute(orgSlug, `/orders/guest/${orderId}`)}?session_id=${sessionId}`
            : orgRoute(orgSlug, `/orders/${orderId}`);
          router.push(orderUrl);
        } else {
          setStep("review");
        }
      }
    },
    [step, orderId, isGuestMode, orgSlug, sessionId, router, clearCart],
  );

  return {
    // Core
    orgSlug,
    router,
    step,
    items,
    user,
    status,

    // Fulfillment
    fulfillmentMode,
    isTicketOnly,
    isAppointmentOnly,
    noFulfillment,
    estimatedTime,
    scheduledTime,
    handleFulfillmentChange,
    handleScheduleSelect,

    // Address
    addresses,
    addressesLoading,
    selectedAddressId,
    selectedAddress,
    setSelectedAddressId,
    isOutsideDeliveryZone,
    zoneResult,

    // Fees
    feeBreakdown,
    feesLoading,
    cartSubtotal,
    grandTotal,

    // Booking deposit (tickets/appointments) — null/0 for non-booking carts
    bookingDepositPercent,
    hasBookingDeposit,
    depositAmount,
    balanceDue,
    /** Amount collected now: deposit for booking-deposit carts, else grandTotal. */
    amountDueNow,
    /** Ready-to-render deposit split for FeeBreakdownCard; null when no deposit. */
    depositBreakdown,

    // Promo
    promoCode,
    setPromoCode,
    discount,
    promoMessage,
    promoIsPending: applyPromo.isPending,
    handleApplyPromo,

    // Delivery notes
    deliveryNotes,
    setDeliveryNotes,

    // Order
    orderError,
    handlePlaceOrder,
    isPlacingOrder: step === "processing" || checkoutMutation.isPending || guestCheckoutMutation.isPending,

    // Guest
    checkoutMode,
    setCheckoutMode,
    isGuestMode,
    guestEmail,
    setGuestEmail,
    guestPhone,
    setGuestPhone,
    guestName,
    setGuestName,
    guestDeliveryLocation,
    setGuestDeliveryLocation,
    handleSignInForCheckout,
    hasDeliveryAddress,
    outlets,
    outletId,
    selectedPickupOutletId,
    setSelectedPickupOutletId,

    // Payment
    showPaymentModal,
    paymentIntentId,
    initiateUrl,
    paymentAmount,
    paymentCurrency,
    orderId,
    handlePaymentConfirmed,
    handlePaymentFailed,
    handlePaymentModalClose,

    // Payment method selection
    paymentOptions,
    selectedOptionId,
    setSelectedOptionId,
    selectedOption,
    /** Derived backend method key for the current selection (mpesa/paystack/cod/wallet). */
    selectedMethod,

    // Wallet
    walletBalance,
    walletCurrency,
    walletPaymentPending,
    handleWalletPayment,
  };
}
