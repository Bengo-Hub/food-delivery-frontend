"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import {
  useAssignRole,
  useAssignments,
  usePermissions,
  useRevokeRole,
  useRoles,
} from "@/hooks/use-rbac";
import { useUsers } from "@/hooks/use-users";
import type { OrderingPermission, OrderingRole, UserRoleAssignment } from "@/lib/api/rbac";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";

// ── Roles section ─────────────────────────────────────────────────────────────

function RolesSection() {
  const { data: roles = [], isLoading } = useRoles();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="py-10 text-center">
        <ShieldCheck className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No roles defined for this organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {roles.map((role) => (
        <div key={role.ID} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{role.Name || role.RoleCode}</p>
            <Badge variant="outline" className="font-mono text-[10px]">
              {role.RoleCode}
            </Badge>
            {role.IsSystemRole && (
              <Badge variant="soft" className="text-[10px]">
                System
              </Badge>
            )}
          </div>
          {role.Description ? (
            <p className="mt-1 text-xs text-muted-foreground">{role.Description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ── Permission catalog (read-only matrix grouped by module) ───────────────────

function PermissionCatalog() {
  const { data: permissions = [], isLoading } = usePermissions();

  const byModule = useMemo(() => {
    return permissions.reduce<Record<string, OrderingPermission[]>>((acc, p) => {
      const key = p.Module || "other";
      (acc[key] ??= []).push(p);
      return acc;
    }, {});
  }, [permissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="py-10 text-center">
        <ShieldCheck className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No permissions in the catalog.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Read-only catalog of all ordering permissions. The API does not expose
        per-role permission grants, so permissions are grouped by module rather
        than mapped to individual roles.
      </p>
      {Object.entries(byModule)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([moduleName, perms]) => (
          <div key={moduleName}>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {moduleName}
            </h3>
            <div className="flex flex-wrap gap-2">
              {perms.map((p) => (
                <span
                  key={p.ID}
                  title={p.Description ?? p.Name}
                  className="rounded-md border border-border bg-muted/30 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
                >
                  {p.PermissionCode}
                </span>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// ── Assign role form ──────────────────────────────────────────────────────────
//
// The user is chosen from a searchable combobox backed by the tenant-users
// directory (GET /{tenant}/admin/users via useUsers). Search is debounced and
// resolved server-side; the selected option's value is the user's id. The role
// picker is populated from the roles endpoint.

function AssignRoleForm({ roles }: { roles: OrderingRole[] }) {
  const assign = useAssignRole();
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");

  // Debounce the user search so we don't hit the API on every keystroke.
  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 250);
    return () => clearTimeout(t);
  }, [userSearch]);

  const { data: users = [], isLoading: usersLoading } = useUsers(debouncedSearch);

  const userOptions = useMemo<ComboboxOption[]>(
    () =>
      users.map((u) => ({
        value: u.id,
        label: u.name || u.email,
        ...(u.email ? { description: u.email } : {}),
      })),
    [users],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !roleId) {
      toast.error("Select a user and a role.");
      return;
    }
    assign.mutate(
      { user_id: userId, role_id: roleId },
      {
        onSuccess: () => {
          toast.success("Role assigned");
          setUserId("");
          setRoleId("");
          setUserSearch("");
        },
        onError: () => toast.error("Failed to assign role"),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Search for a user by name or email, then choose a role from this
        organization&apos;s ordering roles.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assign-user-id">User</Label>
          <Combobox
            id="assign-user-id"
            value={userId}
            onChange={setUserId}
            options={userOptions}
            search={userSearch}
            onSearchChange={setUserSearch}
            loading={usersLoading}
            placeholder="Select a user"
            searchPlaceholder="Search by name or email…"
            emptyMessage="No matching users."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assign-role">Role</Label>
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger id="assign-role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.ID} value={role.ID}>
                  {role.Name || role.RoleCode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={assign.isPending}>
        {assign.isPending ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <UserPlus className="mr-2 size-4" />
        )}
        Assign Role
      </Button>
    </form>
  );
}

// ── Assignments table ─────────────────────────────────────────────────────────

function AssignmentsTable({
  assignments,
  roles,
}: {
  assignments: UserRoleAssignment[];
  roles: OrderingRole[];
}) {
  const revoke = useRevokeRole();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const roleLabel = (roleId: string) => {
    const role = roles.find((r) => r.ID === roleId);
    return role ? role.Name || role.RoleCode : roleId;
  };

  const handleRevoke = (assignment: UserRoleAssignment) => {
    if (!confirm(`Revoke the "${roleLabel(assignment.RoleID)}" role from this user?`)) {
      return;
    }
    setRevokingId(assignment.ID);
    revoke.mutate(assignment.ID, {
      onSuccess: () => toast.success("Role revoked"),
      onError: () => toast.error("Failed to revoke role"),
      onSettled: () => setRevokingId(null),
    });
  };

  if (assignments.length === 0) {
    return (
      <div className="py-10 text-center">
        <Users className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No role assignments yet.</p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border border-border">
      <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>User ID</span>
        <span>Role</span>
        <span>Assigned</span>
        <span className="sr-only">Actions</span>
      </div>
      {assignments.map((a) => (
        <div
          key={a.ID}
          className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-3 px-4 py-3"
        >
          <code className="truncate font-mono text-xs text-muted-foreground" title={a.UserID}>
            {a.UserID}
          </code>
          <span className="text-sm">{roleLabel(a.RoleID)}</span>
          <span className="text-xs text-muted-foreground">
            {a.AssignedAt ? new Date(a.AssignedAt).toLocaleDateString() : "—"}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={revokingId === a.ID}
            onClick={() => handleRevoke(a)}
          >
            {revokingId === a.ID ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1 size-3.5" />
            )}
            Revoke
          </Button>
        </div>
      ))}
    </div>
  );
}

// ── Assignments section (loads roles for labels + form) ───────────────────────

function AssignmentsSection() {
  const { data: assignments = [], isLoading } = useAssignments();
  const { data: roles = [] } = useRoles();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Assign a Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AssignRoleForm roles={roles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Current Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : (
            <AssignmentsTable assignments={assignments} roles={roles} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RolesAndPermissionsPage() {
  return (
    <RequireAuth
      roles={["admin", "superuser", "manager"]}
      permissions={["ordering.users.manage"]}
      permissionOperator="or"
    >
      <SiteShell>
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Team Access
            </p>
            <h1 className="text-2xl font-bold">Roles &amp; Permissions</h1>
            <p className="text-sm text-muted-foreground">
              Review roles and the permission catalog, and manage which users hold
              which roles.
            </p>
          </header>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5" />
                  Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RolesSection />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5" />
                  Permission Catalog
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionCatalog />
              </CardContent>
            </Card>

            <AssignmentsSection />
          </div>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
