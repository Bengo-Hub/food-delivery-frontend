/**
 * Platform marketplace directory API client — the root (no tenant slug) landing page's data
 * source. Thin proxy: ordering-backend's `GET /marketplace/tenants` reads auth-api's public
 * tenant directory (active, non-demo tenants, ranked by subscription tier).
 */

import { api } from "./base";

export interface MarketplaceTenant {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  brandColors?: { primary?: string; secondary?: string; accent?: string };
  useCase?: string;
  useCases?: string[];
  subscriptionPlan?: string;
  country?: string;
}

interface BackendMarketplaceTenant {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
  brand_colors?: { primary?: string; secondary?: string; accent?: string };
  use_case?: string;
  use_cases?: string[];
  subscription_plan?: string;
  country?: string;
}

interface BackendMarketplaceResponse {
  data: BackendMarketplaceTenant[];
}

function toMarketplaceTenant(t: BackendMarketplaceTenant): MarketplaceTenant {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    ...(t.logo_url ? { logoUrl: t.logo_url } : {}),
    ...(t.brand_colors ? { brandColors: t.brand_colors } : {}),
    ...(t.use_case ? { useCase: t.use_case } : {}),
    ...(t.use_cases ? { useCases: t.use_cases } : {}),
    ...(t.subscription_plan ? { subscriptionPlan: t.subscription_plan } : {}),
    ...(t.country ? { country: t.country } : {}),
  };
}

/** Fetch marketplace-visible tenants (already ranked tier-desc by the backend), page/limit-bounded. */
export async function fetchMarketplaceTenants(
  useCase?: string,
  page = 1,
  limit = 24,
): Promise<MarketplaceTenant[]> {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (useCase) qs.set("use_case", useCase);
  try {
    const res = await api.get<BackendMarketplaceResponse>(`marketplace/tenants?${qs.toString()}`);
    const items = res.data?.data ?? [];
    return items.map(toMarketplaceTenant);
  } catch {
    // A directory hiccup must degrade the landing page to an empty state, never a hard error.
    return [];
  }
}
