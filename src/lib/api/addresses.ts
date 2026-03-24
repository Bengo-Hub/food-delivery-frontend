import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface Address {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  label: string;
  address: string;
  lat: number;
  lng: number;
  apartment?: string;
  instructions?: string;
}

export interface UpdateAddressRequest {
  label?: string;
  address?: string;
  lat?: number;
  lng?: number;
  apartment?: string;
  instructions?: string;
}

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
  await api.post(`${slug}/addresses/${id}/default`);
}
