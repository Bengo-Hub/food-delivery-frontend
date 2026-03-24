import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface PaymentGateway {
  type: string;
  name: string;
  icon: string;
  enabled: boolean;
  reason?: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  mask: string;
  provider: string;
  is_default: boolean;
}

export interface PaymentMethodsResponse {
  gateways: PaymentGateway[];
  wallet: { balance: number; currency: string } | null;
  saved_methods: SavedPaymentMethod[];
}

// ─── API Functions ───────────────────────────────────────────────────

export async function getPaymentMethods(
  slug: string,
  fulfillmentType?: string,
): Promise<PaymentMethodsResponse> {
  const res = await api.get(`${slug}/payment-methods`, {
    params: fulfillmentType ? { fulfillment_type: fulfillmentType } : undefined,
  });
  return res.data;
}
