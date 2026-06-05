import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// The ordering-backend RBAC structs (internal/modules/rbac/models.go) carry NO
// json tags, so Go serialises their fields with the exact (PascalCase) Go field
// names. The request DTO (AssignRoleRequest in internal/http/handlers/rbac.go)
// DOES use snake_case json tags. Types below match the wire format exactly.

/** OrderingRole — GET /{tenant}/rbac/roles → { roles: [...] } */
export interface OrderingRole {
  ID: string;
  TenantID: string | null;
  RoleCode: string;
  Name: string;
  Description: string | null;
  IsSystemRole: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

/** OrderingPermission — GET /{tenant}/rbac/permissions → { permissions: [...] } */
export interface OrderingPermission {
  ID: string;
  PermissionCode: string;
  Name: string;
  Module: string;
  Action: string;
  Resource: string | null;
  Description: string | null;
  CreatedAt: string;
}

/** UserRoleAssignment — GET /{tenant}/rbac/assignments → { assignments: [...] } */
export interface UserRoleAssignment {
  ID: string;
  TenantID: string;
  UserID: string;
  RoleID: string;
  AssignedBy: string;
  AssignedAt: string;
  ExpiresAt: string | null;
}

/** Request body for POST /{tenant}/rbac/assignments (snake_case json tags). */
export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
}

// ─── API Functions ───────────────────────────────────────────────────
//
// Routes are mounted under /api/v1/{tenant}/rbac/* and the {tenant} segment is
// resolved by the TenantV2 middleware from the URL slug (the handler itself
// reads the tenant UUID from JWT claims, so the slug — like every other ordering
// route via useOrgSlug() — is the correct path value).

/** List the tenant's ordering roles. */
export async function listRoles(slug: string): Promise<OrderingRole[]> {
  const res = await api.get(`${slug}/rbac/roles`);
  return res.data?.roles ?? [];
}

/** List the ordering permission catalog. */
export async function listPermissions(slug: string): Promise<OrderingPermission[]> {
  const res = await api.get(`${slug}/rbac/permissions`);
  return res.data?.permissions ?? [];
}

/** List current user→role assignments. */
export async function listAssignments(slug: string): Promise<UserRoleAssignment[]> {
  const res = await api.get(`${slug}/rbac/assignments`);
  return res.data?.assignments ?? [];
}

/** Assign a role to a user. */
export async function assignRole(slug: string, body: AssignRoleRequest): Promise<void> {
  await api.post(`${slug}/rbac/assignments`, body);
}

/** Revoke a role assignment by its assignment ID. */
export async function revokeRole(slug: string, assignmentId: string): Promise<void> {
  await api.delete(`${slug}/rbac/assignments/${assignmentId}`);
}
