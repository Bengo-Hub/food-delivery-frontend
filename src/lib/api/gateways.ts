import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// Routes are served by the ordering-backend payments proxy, mounted under
// /api/v1/{tenant}/payments/gateways/* and resolved by the TenantV2 middleware
// from the URL slug (like every other ordering route via useOrgSlug()). The
// proxy forwards to treasury-api server-side so the browser never needs a
// treasury JWT or treasury RBAC perms.

/** GET /{tenant}/payments/gateways/available → { gateways: [...] } */
export interface AvailableGateway {
  gateway_type: string;
  name: string;
  transaction_fee_type: string;
  supports_stk_push: boolean;
}

/** GET /{tenant}/payments/gateways/selected → { selected: [...] } */
export interface SelectedGateway {
  id: string;
  gateway_type: string;
  name: string;
  is_active: boolean;
  is_primary: boolean;
  status: string;
  transaction_fee_type: string;
  total_transactions: number;
  created_at: string;
  updated_at: string;
}

// ─── API Functions ───────────────────────────────────────────────────

/** List the payment gateways the platform makes available to the tenant. */
export async function listAvailableGateways(slug: string): Promise<AvailableGateway[]> {
  const res = await api.get(`${slug}/payments/gateways/available`);
  return res.data?.gateways ?? [];
}

/** List the gateways the tenant has selected/enabled. */
export async function listSelectedGateways(slug: string): Promise<SelectedGateway[]> {
  const res = await api.get(`${slug}/payments/gateways/selected`);
  return res.data?.selected ?? [];
}

/** Select (enable) a gateway for the tenant, optionally marking it primary. */
export async function selectGateway(
  slug: string,
  gatewayType: string,
  isPrimary?: boolean,
): Promise<void> {
  const body = isPrimary === undefined ? {} : { is_primary: isPrimary };
  await api.post(`${slug}/payments/gateways/select/${gatewayType}`, body);
}

/** Deactivate (disable) a previously selected gateway. */
export async function deactivateGateway(slug: string, gatewayType: string): Promise<void> {
  await api.delete(`${slug}/payments/gateways/select/${gatewayType}`);
}
