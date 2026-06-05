import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// Field names below match the Go structs in
// ordering-backend/internal/modules/notifications/domain.go exactly (snake_case
// json tags). Templates list/events list responses are wrapped objects
// ({ templates, total } / { events, total }) per handler.go.

export type NotificationChannel = "email" | "sms" | "push" | "in_app";

export type EventStatus =
  | "pending"
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "skipped";

/** NotificationTemplate — domain.go NotificationTemplate (lines 67-80). */
export interface NotificationTemplate {
  id: string;
  tenant_id: string;
  channel: NotificationChannel;
  event_key: string;
  locale: string;
  subject?: string;
  body: string;
  data_schema?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** NotificationEvent — domain.go NotificationEvent (lines 82-100). */
export interface NotificationEvent {
  id: string;
  tenant_id: string;
  user_id?: string;
  event_key: string;
  payload: Record<string, unknown>;
  order_id?: string;
  status: EventStatus;
  attempts: number;
  last_attempt_at?: string;
  error_message?: string;
  error_code?: string;
  external_id?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

/** CreateTemplateRequest — domain.go CreateTemplateRequest (lines 140-149).
 * tenant_id is injected server-side from the JWT, so it's omitted here. */
export interface CreateTemplateRequest {
  channel: NotificationChannel;
  event_key: string;
  locale: string;
  subject?: string | undefined;
  body: string;
  data_schema?: Record<string, unknown> | undefined;
}

/** UpdateTemplateRequest — domain.go UpdateTemplateRequest (lines 151-157). */
export interface UpdateTemplateRequest {
  subject?: string | undefined;
  body?: string | undefined;
  data_schema?: Record<string, unknown> | undefined;
  is_active?: boolean | undefined;
}

export interface ListTemplatesParams {
  channel?: NotificationChannel;
  event_key?: string;
  locale?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListEventsParams {
  event_key?: string;
  status?: EventStatus;
  limit?: number;
  offset?: number;
}

// Preferences — UserPreferences / UpdatePreferencesRequest in domain.go.
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

// ─── Template API Functions ──────────────────────────────────────────

/** List notification templates. GET /{tenant}/notifications/templates → { templates, total }. */
export async function listTemplates(
  tenantSlug: string,
  params?: ListTemplatesParams,
): Promise<{ templates: NotificationTemplate[]; total: number }> {
  const res = await api.get(`${tenantSlug}/notifications/templates`, { params });
  return {
    templates: res.data?.templates ?? [],
    total: res.data?.total ?? 0,
  };
}

/** Get a single template by ID. */
export async function getTemplate(
  tenantSlug: string,
  id: string,
): Promise<NotificationTemplate> {
  const res = await api.get(`${tenantSlug}/notifications/templates/${id}`);
  return res.data;
}

/** Create a notification template. */
export async function createTemplate(
  tenantSlug: string,
  data: CreateTemplateRequest,
): Promise<NotificationTemplate> {
  const res = await api.post(`${tenantSlug}/notifications/templates`, data);
  return res.data;
}

/** Update a notification template. */
export async function updateTemplate(
  tenantSlug: string,
  id: string,
  data: UpdateTemplateRequest,
): Promise<void> {
  await api.put(`${tenantSlug}/notifications/templates/${id}`, data);
}

/** Delete a notification template. */
export async function deleteTemplate(
  tenantSlug: string,
  id: string,
): Promise<void> {
  await api.delete(`${tenantSlug}/notifications/templates/${id}`);
}

// ─── Event API Functions ─────────────────────────────────────────────

/** List notification events. GET /{tenant}/notifications/events → { events, total }. */
export async function listEvents(
  tenantSlug: string,
  params?: ListEventsParams,
): Promise<{ events: NotificationEvent[]; total: number }> {
  const res = await api.get(`${tenantSlug}/notifications/events`, { params });
  return {
    events: res.data?.events ?? [],
    total: res.data?.total ?? 0,
  };
}

// ─── Preference API Functions ────────────────────────────────────────

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
