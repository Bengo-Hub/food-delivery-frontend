import { NextResponse } from "next/server";
import { brand } from "@/config/brand";

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "urban-loft";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1/";

export async function GET() {
  let name = `${brand.name} - Online Ordering`;
  let shortName = brand.shortName;
  let description = brand.description;
  let themeColor = brand.palette.primary;
  let logoUrl: string | null = null;

  // Fetch tenant-specific branding from backend
  try {
    const response = await fetch(`${API_URL}config`, {
      headers: { "X-Tenant-Slug": DEFAULT_SLUG },
      next: { revalidate: 1800 },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.name) name = `${data.name} - Online Ordering`;
      if (data.short_name) shortName = data.short_name;
      if (data.tagline) description = data.tagline;
      if (data.brand_palette?.primary) themeColor = data.brand_palette.primary;
      if (data.logo_url) logoUrl = data.logo_url;
    }
  } catch {
    // Fall through to env-based defaults
  }

  const icons = [
    { src: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png", purpose: "any" as const },
    { src: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" as const },
    { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png", purpose: "any" as const },
    { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png", purpose: "any" as const },
    { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png", purpose: "any" as const },
    {
      src: logoUrl || "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable" as const,
    },
    { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png", purpose: "any" as const },
    {
      src: logoUrl || "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable" as const,
    },
  ];

  const manifest = {
    name,
    short_name: shortName,
    description,
    start_url: `/${DEFAULT_SLUG}?source=pwa`,
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: themeColor,
    orientation: "portrait-primary",
    scope: "/",
    icons,
    shortcuts: [
      {
        name: "Order Again",
        short_name: "Reorder",
        description: "Quick access to your recent orders",
        url: `/${DEFAULT_SLUG}/dashboard/customer?tab=orders`,
        icons: [{ src: "/icons/reorder-96x96.png", sizes: "96x96" }],
      },
      {
        name: "Track Order",
        short_name: "Track",
        description: "Track your active orders",
        url: `/${DEFAULT_SLUG}/dashboard/customer?tab=tracking`,
        icons: [{ src: "/icons/track-96x96.png", sizes: "96x96" }],
      },
    ],
    categories: ["shopping", "lifestyle", "business"],
    prefer_related_applications: false,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
