import { type NextRequest, NextResponse } from 'next/server';

const AUTH_API_BASE =
  process.env.NEXT_PUBLIC_SSO_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  'https://sso.codevertexafrica.com';

const DEFAULT_PRIMARY = '#f97316';
const DEFAULT_BG = '#ffffff';

interface TenantResponse {
  name?: string;
  logo_url?: string;
  brand_colors?: { primary?: string; secondary?: string };
  metadata?: Record<string, string | undefined>;
}

async function fetchTenant(slug: string): Promise<TenantResponse | null> {
  try {
    const res = await fetch(
      `${AUTH_API_BASE}/api/v1/tenants/by-slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return res.json() as Promise<TenantResponse>;
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  const { orgSlug } = await params;
  const tenant = await fetchTenant(orgSlug);

  // Neutral fallback: the tenant's own slug, never a specific business's identity
  // (matches the same fix applied to the client-side branding provider this session).
  const name = tenant?.name ?? orgSlug;
  const primaryColor =
    tenant?.brand_colors?.primary ??
    (tenant?.metadata?.primary_color as string | undefined) ??
    DEFAULT_PRIMARY;
  const bgColor = DEFAULT_BG;
  const logoUrl = tenant?.logo_url ?? (tenant?.metadata?.logo_url as string | undefined);

  // Generic platform icons when the tenant has no logo of its own yet — never
  // a specific tenant's photo (previously defaulted to Urban Loft's logo.jpg,
  // which leaked onto every other tenant's installed PWA icon).
  const icons = logoUrl
    ? [
        { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]
    : [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ];

  const manifest = {
    name: `${name} Ordering`,
    // Home-screen label = tenant first word + service, e.g. "Urban Ordering",
    // so a tenant's several installed Bengo apps stay distinguishable.
    short_name: `${name.trim().split(/\s+/)[0] || 'Bengo'} Ordering`,
    description: 'Order online from your favourite local businesses.',
    start_url: `/${orgSlug}/`,
    scope: `/${orgSlug}/`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: bgColor,
    theme_color: primaryColor,
    categories: ['shopping', 'lifestyle', 'business'],
    lang: 'en',
    icons,
    shortcuts: [
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'View your recent orders',
        url: `/${orgSlug}/orders`,
        icons: [{ src: logoUrl ?? '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Track Order',
        short_name: 'Track',
        description: 'Track your active order',
        url: `/${orgSlug}/track`,
        icons: [{ src: logoUrl ?? '/icons/icon-96x96.png', sizes: '96x96' }],
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
