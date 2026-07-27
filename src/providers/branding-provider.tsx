'use client';

import { fetchTenantBySlug, type TenantBrand } from '@/lib/api/tenant';
import { brand } from '@/config/brand';
import { useQuery } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useOrgSlug } from './org-slug-provider';

interface TenantBrandingContextType {
  slug: string;
  tenant: TenantBrand | null;
  isLoading: boolean;
  error: Error | null;
  getServiceTitle: (appName: string) => string;
}

const TenantBrandingContext = createContext<TenantBrandingContextType | undefined>(undefined);

/**
 * Neutral placeholder used ONLY while a tenant hasn't resolved yet (or failed
 * to resolve). This must never be a real tenant's identity — it previously
 * hardcoded Urban Loft's name/logo/colors, so every OTHER tenant's storefront
 * flashed "Urban-Loft OrderApp" + Urban Loft's logo on first paint. `logoUrl`
 * is intentionally `null` (no bundled photo) — consumers must render a
 * generic mark or nothing while it's null, never assume a string.
 */
const DEFAULT_BRAND: TenantBrand = {
  id: '',
  name: '',
  slug: '',
  logoUrl: null,
  primaryColor: brand.palette.primary,
  secondaryColor: brand.palette.emphasis,
  orgName: '',
  useCase: 'general',
};

export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const slug = useOrgSlug();

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => fetchTenantBySlug(slug),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours — aligned with JWT TTL
    enabled: !!slug,
    // Fail fast: fetchTenantBySlug already times out at 8s and returns null
    // rather than throwing, so retries mostly compound wait time with no
    // benefit — one retry is enough to ride out a single dropped request.
    retry: 1,
  });

  const effectiveBrand = useMemo(() => {
    if (tenant) return tenant;
    if (!isLoading && !tenant && slug) {
      return { ...DEFAULT_BRAND, slug, name: slug, orgName: slug };
    }
    return DEFAULT_BRAND;
  }, [tenant, isLoading, slug]);

  useMemo(() => {
    if (typeof window !== 'undefined') {
      const primary = effectiveBrand?.primaryColor || DEFAULT_BRAND.primaryColor!;
      const secondary = effectiveBrand?.secondaryColor || DEFAULT_BRAND.secondaryColor!;
      document.documentElement.style.setProperty('--tenant-primary', primary);
      document.documentElement.style.setProperty('--tenant-secondary', secondary);
      // Only set a logo CSS var when a real one resolved — never fall back to
      // a bundled tenant photo (see DEFAULT_BRAND comment above).
      if (effectiveBrand?.logoUrl) {
        document.documentElement.style.setProperty('--tenant-logo-url', `url(${effectiveBrand.logoUrl})`);
      } else {
        document.documentElement.style.removeProperty('--tenant-logo-url');
      }
    }
  }, [effectiveBrand]);

  const getServiceTitle = (appName: string) => {
    const tenantName = effectiveBrand?.orgName || effectiveBrand?.name || '';
    const firstWord = tenantName.split(' ')[0] || 'Codevertex';
    return `${firstWord} ${appName}`;
  };

  const value = useMemo(
    () => ({
      slug,
      tenant: effectiveBrand,
      isLoading,
      error: error as Error | null,
      getServiceTitle,
    }),
    [slug, effectiveBrand, isLoading, error]
  );

  return (
    <TenantBrandingContext.Provider value={value}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding() {
  const context = useContext(TenantBrandingContext);
  if (context === undefined) {
    return {
      slug: '',
      tenant: null,
      isLoading: false,
      error: null,
      getServiceTitle: (s: string) => s,
    };
  }
  return context;
}
