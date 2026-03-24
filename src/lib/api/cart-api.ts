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
    menuItemId: string;
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

export async function getCartSummary(slug: string, cartId: string): Promise<FeeBreakdown> {
  const res = await api.get(`${slug}/cart/${cartId}/fee-breakdown`);
  return res.data;
}

export async function getFeeBreakdown(slug: string, cartId: string): Promise<FeeBreakdown> {
  const res = await api.get(`${slug}/cart/${cartId}/fee-breakdown`);
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
