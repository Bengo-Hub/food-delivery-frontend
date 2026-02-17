"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/base";
import { brand as staticBrand } from "@/config/brand";

interface TenantBrandConfig {
  name: string;
  short_name?: string;
  tagline?: string;
  logo_url?: string;
  support_email?: string;
  support_phone?: string;
  brand_palette?: {
    primary?: string;
    secondary?: string;
  };
  features?: Record<string, boolean>;
}

export const brandKeys = {
  all: ["brand"] as const,
  config: () => [...brandKeys.all, "config"] as const,
};

export function useBrandConfig() {
  return useQuery({
    queryKey: brandKeys.config(),
    queryFn: async () => {
      try {
        const { data } = await api.get<TenantBrandConfig>("/config");
        return {
          name: data.name || staticBrand.name,
          shortName: data.short_name || staticBrand.shortName,
          tagline: data.tagline || staticBrand.tagline,
          logoUrl: data.logo_url || staticBrand.assets.logo,
          supportEmail: data.support_email || staticBrand.support.email,
          supportPhone: data.support_phone || staticBrand.support.phone,
          primaryColor: data.brand_palette?.primary || staticBrand.palette.primary,
          features: data.features ?? {},
        };
      } catch {
        // Fallback to static config if backend unavailable
        return {
          name: staticBrand.name,
          shortName: staticBrand.shortName,
          tagline: staticBrand.tagline,
          logoUrl: staticBrand.assets.logo,
          supportEmail: staticBrand.support.email,
          supportPhone: staticBrand.support.phone,
          primaryColor: staticBrand.palette.primary,
          features: {} as Record<string, boolean>,
        };
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes — brand config rarely changes
    retry: false, // Don't retry — fall back to static config
  });
}
