"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBackupSettings,
  updateBackupSettings,
  type BackupSettings,
} from "@/lib/api/backups";

// The backups endpoints parse the {tenant} path segment as a UUID, so these
// hooks read the tenant UUID from localStorage ("tenantId") rather than the
// org slug used by most other endpoints (mirrors use-service-config).

function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tenantId");
}

export const backupSettingsKeys = {
  all: ["backup-settings"] as const,
  tenant: (tenantId: string) =>
    [...backupSettingsKeys.all, tenantId] as const,
};

/** Reads the tenant's auto-backup settings (off by default — opt-in). */
export function useBackupSettings() {
  const tenantId = getTenantId();
  return useQuery<BackupSettings>({
    queryKey: backupSettingsKeys.tenant(tenantId ?? ""),
    queryFn: () => getBackupSettings(tenantId!),
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}

/** Activates/updates the tenant's auto-backup settings. */
export function useUpdateBackupSettings() {
  const queryClient = useQueryClient();
  const tenantId = getTenantId();
  return useMutation({
    mutationFn: (settings: BackupSettings) => {
      if (!tenantId) {
        throw new Error("Missing tenant ID — please sign in again.");
      }
      return updateBackupSettings(tenantId, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupSettingsKeys.all });
    },
  });
}
