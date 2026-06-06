import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// Wire format matches ordering-backend internal/http/handlers/rbac.go:
//   - TenantUserResponse  → { id, name, email } (json tags are snake/lower)
//   - GET /api/v1/{tenant}/admin/users → { users: [...] }
//
// The route is mounted under the RBAC permission group (guarded by
// ordering.users.manage) and resolves {tenant} from the org slug, consistent
// with every other ordering route via useOrgSlug().

/** A lightweight tenant user, used to back the searchable user picker. */
export interface TenantUser {
  id: string;
  name: string;
  email: string;
}

// ─── API Functions ───────────────────────────────────────────────────

/**
 * List the tenant's users for a searchable picker.
 *
 * @param slug org slug (path tenant segment)
 * @param q    optional case-insensitive name/email filter
 */
export async function listUsers(slug: string, q?: string): Promise<TenantUser[]> {
  const params: Record<string, string> = {};
  if (q && q.trim()) {
    params.q = q.trim();
  }
  const res = await api.get(`${slug}/admin/users`, { params });
  return res.data?.users ?? [];
}
