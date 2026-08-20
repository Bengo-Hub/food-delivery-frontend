import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
// Field names below match ordering-backend's actual wire shapes exactly:
// request bodies use the camelCase CreateAddressRequestDTO/UpdateAddressRequestDTO,
// responses are the raw ent CustomerAddress entity (snake_case json tags).

export interface Address {
  id: string;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  county?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  plus_code?: string;
  contact_name?: string;
  contact_phone?: string;
  instructions?: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressRequest {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  plusCode?: string;
  contactName?: string;
  contactPhone?: string;
  instructions?: string;
  isDefault?: boolean;
}

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

// ─── API Functions ───────────────────────────────────────────────────

export async function getAddresses(slug: string): Promise<Address[]> {
  const res = await api.get(`${slug}/addresses`);
  return res.data;
}

export async function createAddress(slug: string, data: CreateAddressRequest): Promise<Address> {
  const res = await api.post(`${slug}/addresses`, data);
  return res.data;
}

export async function updateAddress(slug: string, id: string, data: UpdateAddressRequest): Promise<Address> {
  const res = await api.put(`${slug}/addresses/${id}`, data);
  return res.data;
}

export async function deleteAddress(slug: string, id: string): Promise<void> {
  await api.delete(`${slug}/addresses/${id}`);
}

export async function setDefaultAddress(slug: string, id: string): Promise<void> {
  await api.put(`${slug}/addresses/${id}/default`);
}
