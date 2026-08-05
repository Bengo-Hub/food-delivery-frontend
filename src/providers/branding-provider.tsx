'use client';

import { brand } from '@/config/brand';
import {
  TenantBrandingProvider as SharedTenantBrandingProvider,
  useTenantBranding as useSharedTenantBranding,
} from '@bengo-hub/shared-ui-lib/tenant';
import { ReactNode } from 'react';
import { useOrgSlug } from './org-slug-provider';

const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_SSO_URL || process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://sso.codevertexafrica.com';

/**
 * Thin wrapper around the shared tenant-branding module (`@bengo-hub/shared-ui-lib/tenant`),
 * which already ports this app's own neutral-fallback behavior (never claims a real tenant's
 * identity while loading/unresolved — see the shared module's docblock) plus pos-ui's
 * IndexedDB cache-first fetch, closing the gap where this app previously flashed a generic
 * "Codevertex OrderApp" title during every fetch window with no cache to paint from instantly.
 *
 * `applyCssVariables={false}`: this app already drives `--brand-primary`/`--brand-emphasis`
 * from a separate `/config`-based system (see `components/layout/brand-theme-sync.tsx`), so the
 * shared provider's own CSS-variable side effects are disabled here to avoid two systems
 * fighting over the same variables. This app doesn't consume `--tenant-primary`/
 * `--tenant-secondary`/`--tenant-logo-url` anywhere either, so nothing is lost by disabling them.
 */
export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const slug = useOrgSlug();

  return (
    <SharedTenantBrandingProvider
      slug={slug}
      authApiBase={AUTH_API_BASE}
      defaultPrimaryColor={brand.palette.primary}
      defaultSecondaryColor={brand.palette.emphasis}
      applyCssVariables={false}
    >
      {children}
    </SharedTenantBrandingProvider>
  );
}

export const useTenantBranding = useSharedTenantBranding;
