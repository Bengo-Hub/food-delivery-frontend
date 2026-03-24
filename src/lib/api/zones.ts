import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface ZoneCheckResult {
  zone_id: string;
  delivery_fee: number;
  min_order: number;
  estimated_time: number;
}

// ─── API Functions ───────────────────────────────────────────────────

export async function checkZone(slug: string, lat: number, lng: number): Promise<ZoneCheckResult> {
  const res = await api.get(`${slug}/zones/check`, { params: { lat, lng } });
  return res.data;
}
