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
