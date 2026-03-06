"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/base";
import { brand as staticBrand } from "@/config/brand";
import { useOrgSlug } from "@/providers/org-slug-provider";

/** Backend response shape: GET /api/v1/{tenant}/config (ordering-backend) */
interface TenantBrandConfig {
  name: string;
  short_name?: string;
  tagline?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  support_email?: string;
  support_phone?: string;
  brand_palette?: Record<string, string>;
  features?: Record<string, boolean>;
}

export const brandKeys = {
  all: ["brand"] as const,
  config: (tenantSlug: string) => [...brandKeys.all, "config", tenantSlug] as const,
};

export function useBrandConfig() {
  const orgSlug = useOrgSlug();
  const slug = orgSlug || (process.env.NEXT_PUBLIC_TENANT_SLUG as string) || "";

  return useQuery({
    queryKey: brandKeys.config(slug),
    queryFn: async () => {
      if (!slug) {
        return {
          name: staticBrand.name,
          shortName: staticBrand.shortName,
          tagline: staticBrand.tagline,
          logoUrl: staticBrand.assets.logo,
          supportEmail: staticBrand.support.email,
          supportPhone: staticBrand.support.phone,
          primaryColor: staticBrand.palette.primary,
          secondaryColor: staticBrand.palette.emphasis,
          features: {} as Record<string, boolean>,
        };
      }
      try {
        const { data } = await api.get<TenantBrandConfig>(`${slug}/config`);
        return {
          name: data.name || staticBrand.name,
          shortName: data.short_name || data.name || staticBrand.shortName,
          tagline: data.tagline || staticBrand.tagline,
          logoUrl: data.logo_url || staticBrand.assets.logo,
          supportEmail: data.support_email || staticBrand.support.email,
          supportPhone: data.support_phone || staticBrand.support.phone,
          primaryColor: data.primary_color || data.brand_palette?.primary || staticBrand.palette.primary,
          secondaryColor: data.secondary_color || data.brand_palette?.secondary || staticBrand.palette.emphasis,
          features: data.features ?? {},
        };
      } catch {
        return {
          name: staticBrand.name,
          shortName: staticBrand.shortName,
          tagline: staticBrand.tagline,
          logoUrl: staticBrand.assets.logo,
          supportEmail: staticBrand.support.email,
          supportPhone: staticBrand.support.phone,
          primaryColor: staticBrand.palette.primary,
          secondaryColor: staticBrand.palette.emphasis,
          features: {} as Record<string, boolean>,
        };
      }
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 30, // 30 minutes — brand config rarely changes
    retry: false, // Don't retry — fall back to static config
  });
}
