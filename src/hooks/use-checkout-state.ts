"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAddresses } from "@/hooks/use-addresses";
import { useCheckout, useGuestCheckout, useFeeBreakdown } from "@/hooks/use-cart-api";
import { useApplyPromoCode } from "@/hooks/use-orders";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useZoneCheck } from "@/hooks/use-zones";
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

/** A payment method the customer can select at checkout. */
export interface CheckoutPaymentOption {
  /** Backend method key sent as `paymentMethod` (e.g. "mpesa", "paystack", "cod", "wallet"). */
  method: string;
  /** Human-readable label shown in the selector. */
  label: string;
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

  // Selected payment method (key sent to the backend as `paymentMethod`).
  const [selectedMethod, setSelectedMethod] = useState<string | undefined>(undefined);

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
    isTicketOnly && cartSubtotal > 0
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

  const estimatedTime = zoneResult
    ? `${zoneResult.estimated_time}-${zoneResult.estimated_time + 15} min`
    : "35-50 min";

  const isGuestMode = checkoutMode === "guest" && status !== "authenticated";

  // ─── Payment method options (from the payment-methods aggregate) ───────
  const walletBalance = paymentMethodsData?.wallet?.balance ?? null;
  const walletCurrency = paymentMethodsData?.wallet?.currency ?? "KES";

  // Normalize a backend gateway `type` into a label. COD and cash variants are
  // surfaced together as a single "M-Pesa / Cash on delivery" choice.
  const isCodGateway = (t: string) => /cash|cod|on_delivery/i.test(t);

  const paymentOptions = useMemo<CheckoutPaymentOption[]>(() => {
    const gateways = paymentMethodsData?.gateways ?? [];
    const opts: CheckoutPaymentOption[] = [];
    let hasCod = false;

    for (const g of gateways) {
      if (!g.enabled) continue;
      const t = g.type.toLowerCase();
      if (t === "mpesa" || t === "stk" || t === "mpesa_stk") {
        if (!opts.some((o) => o.method === "mpesa")) {
          opts.push({ method: "mpesa", label: "Pay now with M-Pesa" });
        }
      } else if (t === "paystack" || t === "card") {
        if (!opts.some((o) => o.method === "paystack")) {
          opts.push({ method: "paystack", label: "Pay now with card (Paystack)" });
        }
      } else if (isCodGateway(t)) {
        hasCod = true;
      }
    }

    if (hasCod && !opts.some((o) => o.method === "cod")) {
      opts.push({ method: "cod", label: "M-Pesa / Cash on delivery" });
    }

    // Wallet — authenticated users only, and only when the balance covers the order.
    if (!isGuestMode && walletBalance !== null && walletBalance >= grandTotal && grandTotal > 0) {
      opts.push({
        method: "wallet",
        label: `Wallet (balance ${walletCurrency} ${walletBalance.toLocaleString()})`,
      });
    }

    return opts;
  }, [paymentMethodsData, isGuestMode, walletBalance, walletCurrency, grandTotal]);

  // Keep a valid selection: default to the first option, and clear/repair the
  // selection if the available options change (e.g. wallet drops off the list).
  useEffect(() => {
    if (paymentOptions.length === 0) {
      if (selectedMethod !== undefined) setSelectedMethod(undefined);
      return;
    }
    if (!selectedMethod || !paymentOptions.some((o) => o.method === selectedMethod)) {
      setSelectedMethod(paymentOptions[0].method);
    }
  }, [paymentOptions, selectedMethod]);

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
    } catch {
      toast.error("Failed to apply promo code");
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
    }

    // Delivery/pickup/schedule validations don't apply to ticket-only carts.
    if (!isTicketOnly) {
      if (fulfillmentMode !== "pickup" && !selectedAddressId && addresses.length > 0) {
        toast.error("Please select a delivery address");
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

    // Tickets have no fulfillment — send pickup so no delivery address/fee is required.
    const effectiveFulfillment: FulfillmentMode = isTicketOnly ? "pickup" : fulfillmentMode;

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

      if (result.paymentError) {
        // Treasury unavailable — order was created but payment intent failed
        setStep("review");
        setOrderError(result.paymentError);
        toast.error(`Order #${result.orderNumber || result.orderId.slice(0, 8)} created but payment gateway is unavailable. Please retry.`);
        const orderUrl = isGuestMode
          ? `${orgRoute(orgSlug, `/orders/guest/${result.orderId}`)}?session_id=${sessionId}`
          : orgRoute(orgSlug, `/orders/${result.orderId}`);
        router.push(orderUrl);
      } else if (selectedMethod === "wallet") {
        // Wallet method chosen (authed + balance covers total) — pay the freshly
        // created order straight from the wallet instead of the treasury modal.
        // Prime the modal state first so the catch-fallback can recover gracefully.
        setPaymentIntentId(result.paymentIntentId || null);
        setInitiateUrl(result.initiateUrl || null);
        await handleWalletPayment(result.orderId);
      } else if (!result.paymentIntentId) {
        // COD, wallet-only or zero-amount — no payment modal needed
        clearCart();
        setStep("success");
      } else {
        // Online payment — show treasury payment modal
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
    items, sessionId, deliveryNotes, promoCode, orderNotes, requestUtensils, isTicketOnly,
    checkoutMutation, guestCheckoutMutation, orgSlug, router, clearCart,
    selectedMethod, handleWalletPayment,
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
    selectedMethod,
    setSelectedMethod,

    // Wallet
    walletBalance,
    walletCurrency,
    walletPaymentPending,
    handleWalletPayment,
  };
}
