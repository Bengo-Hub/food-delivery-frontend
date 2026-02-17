import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  eventTypes: string[];
}

export interface UpdatePreferencesRequest {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
  eventTypes?: string[];
}

// ─── API Functions ───────────────────────────────────────────────────

export async function getNotificationPreferences(
  tenantSlug: string,
): Promise<NotificationPreferences> {
  const res = await api.get(`${tenantSlug}/notifications/preferences`);
  return res.data;
}

export async function updateNotificationPreferences(
  tenantSlug: string,
  data: UpdatePreferencesRequest,
): Promise<void> {
  await api.put(`${tenantSlug}/notifications/preferences`, data);
}
