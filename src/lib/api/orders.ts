import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderRequest {
  outletId: string;
  items: OrderItem[];
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryNotes?: string;
  paymentMethod: "mpesa" | "cod";
  promoCode?: string;
  scheduledAt?: string;
  /** Client-generated UUID for idempotent order creation (prevents duplicates on retry/double-click). */
  idempotencyKey?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  estimatedDeliveryAt?: string;
  riderName?: string;
  riderPhone?: string;
  riderLat?: number;
  riderLng?: number;
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  id: string;
  status: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  checkoutRequestId?: string;
}

export interface MpesaPaymentRequest {
  orderId: string;
  phoneNumber: string;
}

// ─── API Functions ───────────────────────────────────────────────────

export async function createOrder(tenantSlug: string, data: CreateOrderRequest): Promise<Order> {
  const res = await api.post(`${tenantSlug}/orders`, data);
  return res.data;
}

export async function getOrder(tenantSlug: string, orderId: string): Promise<Order> {
  const res = await api.get(`${tenantSlug}/orders/${orderId}`);
  return res.data;
}

export async function listOrders(
  tenantSlug: string,
  params?: { status?: string; limit?: number; offset?: number },
): Promise<{ orders: Order[]; total: number }> {
  const res = await api.get(`${tenantSlug}/orders`, { params });
  return res.data;
}

export async function cancelOrder(tenantSlug: string, orderId: string, reason: string): Promise<void> {
  await api.post(`${tenantSlug}/orders/${orderId}/cancel`, { reason });
}

export async function rateOrder(
  tenantSlug: string,
  orderId: string,
  rating: number,
  comment: string,
): Promise<Order> {
  const res = await api.post(`${tenantSlug}/orders/${orderId}/rate`, { rating, comment });
  return res.data;
}

export async function initiateMpesaPayment(
  tenantSlug: string,
  data: MpesaPaymentRequest,
): Promise<PaymentIntent> {
  const res = await api.post(`${tenantSlug}/payments/mpesa/stk-push`, data);
  return res.data;
}

export async function getPaymentStatus(
  tenantSlug: string,
  paymentIntentId: string,
): Promise<PaymentIntent> {
  const res = await api.get(`${tenantSlug}/payments/intents/${paymentIntentId}`);
  return res.data;
}

export async function applyPromoCode(
  tenantSlug: string,
  code: string,
  subtotal: number,
): Promise<{ valid: boolean; discount: number; message: string }> {
  const res = await api.post(`${tenantSlug}/orders/promo/validate`, { code, subtotal });
  return res.data;
}

export async function getOrderTracking(
  tenantSlug: string,
  orderId: string,
): Promise<{
  status: string;
  riderName?: string;
  riderPhone?: string;
  riderLat?: number;
  riderLng?: number;
  eta?: string;
  updatedAt: string;
}> {
  const res = await api.get(`${tenantSlug}/orders/${orderId}/tracking`);
  return res.data;
}
