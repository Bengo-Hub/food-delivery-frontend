"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAddresses } from "@/hooks/use-addresses";
import { useCheckout, useGuestCheckout, useFeeBreakdown } from "@/hooks/use-cart-api";
import { useApplyPromoCode } from "@/hooks/use-orders";
import { useZoneCheck } from "@/hooks/use-zones";
import { api } from "@/lib/api/base";
import { orgRoute } from "@/lib/routes";
import { toast } from "@/lib/toast";
import { useOrgSlug } from "@/providers/org-slug-provider";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useDiningModeStore } from "@/store/dining-mode";
import type { PaymentResult } from "@/components/checkout/treasury-payment-modal";

export type FulfillmentMode = "delivery" | "pickup" | "schedule";
export type CheckoutStep = "review" | "processing" | "payment" | "success";

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

  // Queries & mutations
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const checkoutMutation = useCheckout();
  const guestCheckoutMutation = useGuestCheckout();
  const applyPromo = useApplyPromoCode();

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
    remoteFees && remoteFees.item_total > 0
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
          fulfillmentType: fulfillmentMode,
          idempotencyKey,
          items: items.map((item) => ({
            inventorySku: item.inventorySku || item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.total,
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
        result = await guestCheckoutMutation.mutateAsync(guestPayload);
      } else {
        const payload: Parameters<typeof checkoutMutation.mutateAsync>[0] = {
          outletId: checkoutOutletId,
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
        if (fulfillmentMode !== "pickup" && selectedAddressId) payload.deliveryAddressId = selectedAddressId;
        if (deliveryNotes) payload.deliveryNotes = deliveryNotes;
        if (promoCode) payload.promoCode = promoCode;
        if (orderNotes) payload.orderNotes = orderNotes;
        if (requestUtensils) payload.requestUtensils = requestUtensils;
        if (scheduledTime) payload.scheduledAt = scheduledTime.date.toISOString();
        result = await checkoutMutation.mutateAsync(payload);
      }

      setOrderId(result.orderId);
      setPaymentIntentId(result.paymentIntentId);
      setPaymentAmount(result.amount);
      setPaymentCurrency(result.currency || "KES");
      setStep("payment");
      setShowPaymentModal(true);
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
    items, sessionId, deliveryNotes, promoCode, orderNotes, requestUtensils,
    checkoutMutation, guestCheckoutMutation,
  ]);

  const handlePaymentConfirmed = useCallback(
    async (result: PaymentResult) => {
      try {
        const verifyRes = await api.get(`${orgSlug}/orders/${orderId}`);
        const order = verifyRes.data;
        if (
          order?.payment_status === "succeeded" ||
          order?.payment_status === "paid" ||
          order?.status === "confirmed" ||
          result.intentId
        ) {
          setShowPaymentModal(false);
          clearCart();
          setStep("success");
        } else {
          toast.error("Payment could not be verified. Please contact support.");
        }
      } catch {
        setShowPaymentModal(false);
        clearCart();
        setStep("success");
      }
    },
    [clearCart, orgSlug, orderId],
  );

  const handlePaymentFailed = useCallback((error: string) => {
    toast.error(error || "Payment failed. You can try again.");
  }, []);

  const handlePaymentModalClose = useCallback(
    (open: boolean) => {
      setShowPaymentModal(open);
      if (!open && step === "payment") {
        setStep("review");
      }
    },
    [step],
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
    paymentAmount,
    paymentCurrency,
    orderId,
    handlePaymentConfirmed,
    handlePaymentFailed,
    handlePaymentModalClose,
  };
}
