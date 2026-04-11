import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface FeeBreakdown {
  item_total: number;
  discount: number;
  packaging_fee: number;
  subtotal: number;
  small_order_fee: number;
  service_fee: number;
  delivery_fee: number;
  delivery_discount: number;
  tax_total: number;
  grand_total: number;
}

export interface CheckoutRequest {
  outletId: string;
  fulfillmentType: "delivery" | "pickup" | "schedule";
  items: {
    inventorySku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  deliveryAddressId?: string;
  deliveryNotes?: string;
  promoCode?: string;
  orderNotes?: string;
  requestUtensils?: boolean;
  scheduledAt?: string;
  idempotencyKey?: string;
}

// ─── API Functions ───────────────────────────────────────────────────

export async function getCartSummary(slug: string, outletId: string, fulfillmentType = "delivery"): Promise<FeeBreakdown> {
  const res = await api.get(`${slug}/cart/fee-breakdown`, {
    params: { outlet_id: outletId, fulfillment_type: fulfillmentType },
  });
  return res.data;
}

export async function getFeeBreakdown(slug: string, outletId: string, fulfillmentType = "delivery", sessionId?: string): Promise<FeeBreakdown> {
  const params: Record<string, string> = { outlet_id: outletId, fulfillment_type: fulfillmentType };
  if (sessionId) params.session_id = sessionId;
  const res = await api.get(`${slug}/cart/fee-breakdown`, { params });
  return res.data;
}

export interface CheckoutResponse {
  orderId: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export async function checkout(slug: string, data: CheckoutRequest): Promise<CheckoutResponse> {
  const res = await api.post(`${slug}/checkout`, data);
  return res.data;
}

// ─── Guest Checkout ─────────────────────────────────────────────────

export interface GuestCheckoutRequest {
  outletId: string;
  sessionId: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  items: {
    inventorySku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  fulfillmentType: "delivery" | "pickup" | "schedule";
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryNotes?: string;
  scheduledAt?: string;
  idempotencyKey?: string;
}

export async function guestCheckout(slug: string, data: GuestCheckoutRequest): Promise<CheckoutResponse> {
  const res = await api.post(`${slug}/checkout/guest`, data);
  return res.data;
}
