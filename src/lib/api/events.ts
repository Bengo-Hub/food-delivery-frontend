/**
 * Public event-ticket storefront API (ordering-backend /catalog/events).
 * No auth required — tenant resolved from the URL slug.
 */
import { api } from "./base";

export interface EventTier {
  tier_id: string;
  name: string;
  price: number;
  capacity: number;
  remaining: number;
  sold_out: boolean;
}

export interface PublicEvent {
  id: string;
  sku: string;
  name: string;
  description?: string;
  image_url?: string;
  event_start_at?: string;
  event_end_at?: string;
  venue?: string;
  total_capacity: number;
  remaining: number;
  sold_out: boolean;
  tiers: EventTier[];
  share_url?: string;
}

export async function fetchPublicEvents(tenantSlug: string): Promise<PublicEvent[]> {
  const res = await api.get<{ data: PublicEvent[]; total: number }>(`${tenantSlug}/catalog/events`);
  return res.data?.data ?? [];
}

export async function fetchPublicEvent(tenantSlug: string, eventId: string): Promise<PublicEvent> {
  const res = await api.get<PublicEvent>(`${tenantSlug}/catalog/events/${eventId}`);
  return res.data;
}
