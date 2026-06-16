import { api } from "./base";

// ─── Auto-backup settings (per-tenant, OPT-IN) ───────────────────────
//
// Backed by ordering-backend's tenant-scoped backup module:
//   GET /api/v1/{tenant}/backups/settings
//   PUT /api/v1/{tenant}/backups/settings
//   (handler: internal/http/handlers/backups.go -> GetSettings/UpdateSettings)
//
// Auto-backup is OPT-IN and defaults OFF: when no settings row exists the
// backend returns { auto_enabled: false, schedule_hour: 2, retention_days: 4 }.
// The {tenant} path segment is parsed as a UUID by resolveTenant, so callers
// MUST pass the tenant UUID here — not the org slug.

/** Per-tenant auto-backup settings (matches backend backup.Settings JSON). */
export interface BackupSettings {
  auto_enabled: boolean;
  schedule_hour: number;
  retention_days: number;
}

/**
 * Get the tenant's auto-backup settings (off by default).
 *
 * @param tenantId Tenant UUID (NOT the slug — the backend parses this as a UUID).
 */
export async function getBackupSettings(
  tenantId: string,
): Promise<BackupSettings> {
  const res = await api.get(`${tenantId}/backups/settings`);
  return res.data as BackupSettings;
}

/**
 * Activate/deactivate auto-backup and update the schedule/retention for the tenant.
 * Auto-backup remains OPT-IN — it runs only while auto_enabled is true.
 *
 * @param tenantId Tenant UUID (path segment).
 * @param settings New settings to persist.
 */
export async function updateBackupSettings(
  tenantId: string,
  settings: BackupSettings,
): Promise<BackupSettings> {
  const res = await api.put(`${tenantId}/backups/settings`, settings);
  return res.data as BackupSettings;
}
