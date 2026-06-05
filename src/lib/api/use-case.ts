import { useQuery } from "@tanstack/react-query";

import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────

export interface UseCaseOutlet {
  id: string;
  name: string;
  use_case: string;
}

export interface UseCaseConfig {
  /** Tenant primary use_case (may be empty when not yet synced). */
  use_case: string;
  /** Use-case values ordering supports (e.g. hospitality, retail, quick_service). */
  available_use_cases: string[];
  /** Per-outlet use_case mapping. */
  outlets: UseCaseOutlet[];
}

// ─── API Functions ───────────────────────────────────────────────────

/**
 * Fetch the tenant's use-case configuration (slug-based path).
 * GET /api/v1/{tenant}/admin/use-case — requires `ordering.config.view`.
 */
export async function getUseCaseConfig(slug: string): Promise<UseCaseConfig> {
  const res = await api.get(`${slug}/admin/use-case`);
  const body = res.data ?? {};
  return {
    use_case: typeof body.use_case === "string" ? body.use_case : "",
    available_use_cases: Array.isArray(body.available_use_cases)
      ? body.available_use_cases
      : [],
    outlets: Array.isArray(body.outlets) ? body.outlets : [],
  };
}

// ─── Hooks ───────────────────────────────────────────────────────────

/** TanStack query for the tenant use-case configuration. */
export function useUseCaseConfig(slug: string, enabled: boolean = true) {
  return useQuery<UseCaseConfig>({
    queryKey: ["platform", "use-case", slug],
    queryFn: () => getUseCaseConfig(slug),
    enabled: enabled && !!slug,
    staleTime: 60_000,
  });
}
