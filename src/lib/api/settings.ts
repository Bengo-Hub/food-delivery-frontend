import { api } from "./base";

// ─── Service Config (tenant settings store) ──────────────────────────
//
// Backed by ordering-backend's tenant service-config store:
//   PUT /api/v1/{tenant}/settings/service-config/{key}
//   (handler: internal/http/handlers/config/service_config_handler.go -> UpsertTenantSetting)
//
// NOTE: this handler parses the {tenant} path segment directly as a UUID
// (uuid.Parse on chi.URLParam("tenant")), so callers MUST pass the tenant
// UUID here — not the slug used by most other endpoints.
//
// The backend stores config_value as a plain string column. Structured
// values (objects/arrays) must therefore be JSON-stringified by the caller.

/** Response shape returned by the service-config upsert endpoint. */
export interface ServiceConfigResponse {
  config_key: string;
  config_value: string;
  config_type: string;
  is_secret: boolean;
  is_override: boolean;
}

/**
 * Camel-cased service-config item used by the UI. Maps the backend
 * orderingSCResponse JSON (snake_case) into the app's conventions.
 */
export interface ServiceConfigItem {
  configKey: string;
  configValue: string;
  configType: string;
  isSecret: boolean;
  isOverride: boolean;
  description?: string | undefined;
}

/** Raw backend item shape (snake_case) from orderingSCResponse. */
interface RawServiceConfigItem {
  config_key: string;
  config_value: string;
  config_type: string;
  is_secret: boolean;
  is_override: boolean;
  description?: string;
}

function mapServiceConfigItem(raw: RawServiceConfigItem): ServiceConfigItem {
  return {
    configKey: raw.config_key,
    configValue: raw.config_value,
    configType: raw.config_type,
    isSecret: raw.is_secret,
    isOverride: raw.is_override,
    description: raw.description,
  };
}

/**
 * List merged tenant+platform service configs (secrets masked as "***").
 * GET /api/v1/{tenant}/settings/service-config
 *
 * @param tenantId Tenant UUID (NOT the slug — the backend parses this as a UUID).
 */
export async function listServiceConfig(
  tenantId: string,
): Promise<ServiceConfigItem[]> {
  const res = await api.get(`${tenantId}/settings/service-config`);
  const items: RawServiceConfigItem[] = res.data?.data ?? [];
  return items.map(mapServiceConfigItem);
}

/**
 * List PLATFORM default service configs with UNMASKED secrets.
 * GET /api/v1/{tenant}/admin/service-config — superuser-only on the backend.
 *
 * @param tenantId Tenant UUID (path segment; the backend gates this on superuser).
 */
export async function listAdminServiceConfig(
  tenantId: string,
): Promise<ServiceConfigItem[]> {
  const res = await api.get(`${tenantId}/admin/service-config`);
  const items: RawServiceConfigItem[] = res.data?.data ?? [];
  return items.map(mapServiceConfigItem);
}

/**
 * Upsert a PLATFORM default config value by key (superuser-only on the backend).
 * PUT /api/v1/{tenant}/admin/service-config/{key}
 */
export async function updateAdminServiceConfig(
  tenantId: string,
  key: string,
  value: unknown,
): Promise<ServiceConfigResponse> {
  const configValue =
    typeof value === "string" ? value : JSON.stringify(value);
  const res = await api.put(`${tenantId}/admin/service-config/${key}`, {
    config_value: configValue,
  });
  return res.data as ServiceConfigResponse;
}

/**
 * Upsert a tenant-scoped service-config value by key.
 *
 * @param tenantId Tenant UUID (NOT the slug — the backend parses this as a UUID).
 * @param key      Config key (e.g. "fee_config").
 * @param value    Config value. Objects/arrays are JSON-stringified; primitives
 *                 are stringified to match the backend's string column.
 */
export async function updateServiceConfig(
  tenantId: string,
  key: string,
  value: unknown,
): Promise<ServiceConfigResponse> {
  const configValue =
    typeof value === "string" ? value : JSON.stringify(value);
  const res = await api.put(`${tenantId}/settings/service-config/${key}`, {
    config_value: configValue,
  });
  return res.data as ServiceConfigResponse;
}
