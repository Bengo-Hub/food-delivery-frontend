import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface ZoneCheckResult {
  zone_id: string;
  delivery_fee: number;
  min_order: number;
  estimated_time: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  slug?: string;
  outletId?: string;
  zonePolygon?: Record<string, unknown>;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTimeMinutes: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateZoneRequest {
  name: string;
  slug?: string;
  outletId?: string;
  zonePolygon?: Record<string, unknown>;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTimeMinutes: number;
}

// ─── API Functions ───────────────────────────────────────────────────

/** Public zone check — returns null if not serviceable. */
export async function checkZone(slug: string, lat: number, lng: number): Promise<ZoneCheckResult | null> {
  const res = await api.get(`${slug}/zones/check`, { params: { lat, lng } });
  const data = res.data;
  if (!data.serviceable) return null;
  return {
    zone_id: data.zone_id,
    delivery_fee: data.delivery_fee,
    min_order: data.min_order,
    estimated_time: data.estimated_time,
  };
}

/** List all active delivery zones for a tenant. */
export async function listZones(slug: string): Promise<DeliveryZone[]> {
  const res = await api.get(`${slug}/zones`);
  const body = res.data;
  return Array.isArray(body) ? body : (body?.data ?? []);
}

/** Create a delivery zone (admin). */
export async function createZone(slug: string, data: CreateZoneRequest): Promise<DeliveryZone> {
  const res = await api.post(`${slug}/zones`, data);
  return res.data;
}

/** Update a delivery zone (admin). */
export async function updateZone(slug: string, id: string, data: Partial<CreateZoneRequest> & { isActive?: boolean }): Promise<DeliveryZone> {
  const res = await api.put(`${slug}/zones/${id}`, data);
  return res.data;
}

/** Delete a delivery zone (admin). */
export async function deleteZone(slug: string, id: string): Promise<void> {
  await api.delete(`${slug}/zones/${id}`);
}
