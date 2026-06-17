import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./base";

// ─── Credential Encryption Key (platform-owner gated) ────────────────
//
// Manages the Google-token / credential encryption key used by the
// ordering-backend to encrypt stored OAuth credentials at rest.
//
// Backend (tenant-scoped path segment, but platform-owner gated):
//   GET /api/v1/{tenant}/admin/encryption-key
//   PUT /api/v1/{tenant}/admin/encryption-key  body { generate?, key? }
//
// {tenant} is the org slug used throughout the app's API base path — the
// same segment existing admin calls use (e.g. `${slug}/admin/use-case`).

/** Where the active encryption key is sourced from. */
export type EncryptionKeySource = "db" | "env" | "dev";

export interface EncryptionKeyStatus {
  configured: boolean;
  source: EncryptionKeySource;
  key_fingerprint: string;
  updated_at: string | null;
}

export interface UpdateEncryptionKeyRequest {
  /** Generate & activate a fresh random 32-byte key server-side. */
  generate?: boolean;
  /** Supply an explicit base64-encoded 32-byte key. */
  key?: string;
}

// ─── API Functions ───────────────────────────────────────────────────

/** GET the current encryption-key status. */
export async function getEncryptionKeyStatus(
  slug: string,
): Promise<EncryptionKeyStatus> {
  const res = await api.get(`${slug}/admin/encryption-key`);
  const body = (res.data ?? {}) as Partial<EncryptionKeyStatus>;
  const source: EncryptionKeySource =
    body.source === "db" || body.source === "env" || body.source === "dev"
      ? body.source
      : "dev";
  return {
    configured: !!body.configured,
    source,
    key_fingerprint: typeof body.key_fingerprint === "string" ? body.key_fingerprint : "",
    updated_at: typeof body.updated_at === "string" ? body.updated_at : null,
  };
}

/** PUT a new encryption key — either generate one or supply a base64 key. */
export async function updateEncryptionKey(
  slug: string,
  body: UpdateEncryptionKeyRequest,
): Promise<EncryptionKeyStatus> {
  const res = await api.put(`${slug}/admin/encryption-key`, body);
  return getEncryptionKeyStatus(slug).catch(() => res.data as EncryptionKeyStatus);
}

// ─── Hooks ───────────────────────────────────────────────────────────

const encryptionKeyKey = (slug: string) => ["platform", "encryption-key", slug];

/** TanStack query for the encryption-key status. */
export function useEncryptionKeyStatus(slug: string, enabled: boolean = true) {
  return useQuery<EncryptionKeyStatus>({
    queryKey: encryptionKeyKey(slug),
    queryFn: () => getEncryptionKeyStatus(slug),
    enabled: enabled && !!slug,
    staleTime: 30_000,
  });
}

/** Mutation to update (generate or set) the encryption key; invalidates status. */
export function useUpdateEncryptionKey(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateEncryptionKeyRequest) => updateEncryptionKey(slug, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: encryptionKeyKey(slug) });
    },
  });
}
