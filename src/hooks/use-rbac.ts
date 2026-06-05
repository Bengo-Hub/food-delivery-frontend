"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignRole,
  listAssignments,
  listPermissions,
  listRoles,
  revokeRole,
  type AssignRoleRequest,
  type OrderingPermission,
  type OrderingRole,
  type UserRoleAssignment,
} from "@/lib/api/rbac";
import { useOrgSlug } from "@/providers/org-slug-provider";

// ─── Query Keys ──────────────────────────────────────────────────────

export const rbacKeys = {
  all: ["rbac"] as const,
  roles: (slug: string) => [...rbacKeys.all, "roles", slug] as const,
  permissions: (slug: string) => [...rbacKeys.all, "permissions", slug] as const,
  assignments: (slug: string) => [...rbacKeys.all, "assignments", slug] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────

/** List the tenant's ordering roles. */
export function useRoles() {
  const slug = useOrgSlug();
  return useQuery<OrderingRole[]>({
    queryKey: rbacKeys.roles(slug),
    queryFn: () => listRoles(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

/** List the ordering permission catalog. */
export function usePermissions() {
  const slug = useOrgSlug();
  return useQuery<OrderingPermission[]>({
    queryKey: rbacKeys.permissions(slug),
    queryFn: () => listPermissions(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

/** List current user→role assignments. */
export function useAssignments() {
  const slug = useOrgSlug();
  return useQuery<UserRoleAssignment[]>({
    queryKey: rbacKeys.assignments(slug),
    queryFn: () => listAssignments(slug),
    enabled: !!slug,
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/** Assign a role to a user, invalidating the assignments list on success. */
export function useAssignRole() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignRoleRequest) => assignRole(slug, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.assignments(slug) });
    },
  });
}

/** Revoke a role assignment, invalidating the assignments list on success. */
export function useRevokeRole() {
  const slug = useOrgSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => revokeRole(slug, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.assignments(slug) });
    },
  });
}
