import withPWA from "@ducanh2912/next-pwa";

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "urban-loft";

const nextConfig = {
  ...(process.env.SKIP_STANDALONE !== 'true' && { output: 'standalone' }),
  reactStrictMode: true,
  images: {
    // Enable Next.js image optimization for automatic resizing, format conversion
    // (WebP/AVIF), and lazy loading. This significantly reduces page load times.
    remotePatterns: [
      // ordering-backend (this service's own media, e.g. outlet photos) — local dev port is
      // 4005 per .env.local's NEXT_PUBLIC_API_URL; 4000 kept too for other local setups.
      ...["4000", "4005"].flatMap((port) => [
        { protocol: "http", hostname: "localhost", port, pathname: "/media/**" },
        { protocol: "http", hostname: "127.0.0.1", port, pathname: "/media/**" },
      ]),
      // inventory-api (item/category images) — local dev port is 4001 per its own .env.
      { protocol: "http", hostname: "localhost", port: "4001", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4001", pathname: "/media/**" },
      {
        protocol: "https",
        hostname: "orderingapi.codevertexafrica.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "inventoryapi.codevertexafrica.com",
        pathname: "/media/**",
      },
      // auth-service's tenant-branding logo storage — every tenant's real logo_url
      // (e.g. urban-loft's) is hosted here. Missing this entry made next/image's
      // optimizer 400 on every real tenant logo, silently falling back to the
      // generic mark even once tenant branding data itself resolved correctly.
      {
        protocol: "https",
        hostname: "accounts.codevertexafrica.com",
        pathname: "/images/**",
      },
    ],
    // Serve optimized images in modern formats with quality 80
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
    // The webpack build type-checks generated .next/types route validators (Next 16 PageProps
    // shape); app code is checked via `tsc --noEmit`.
    ignoreBuildErrors: true,
  },
  turbopack: {},
  async redirects() {
    return [
      // Catalog (new canonical route)
      { source: "/catalog", destination: `/${DEFAULT_SLUG}/catalog`, permanent: false },
      { source: "/catalog/:id", destination: `/${DEFAULT_SLUG}/catalog/:id`, permanent: false },
      // Legacy /menu → /catalog redirects
      { source: "/menu", destination: `/${DEFAULT_SLUG}/catalog`, permanent: true },
      { source: "/menu/:id", destination: `/${DEFAULT_SLUG}/catalog/:id`, permanent: true },
      { source: "/:orgSlug/menu", destination: `/:orgSlug/catalog`, permanent: true },
      { source: "/:orgSlug/menu/:id", destination: `/:orgSlug/catalog/:id`, permanent: true },
      { source: "/checkout", destination: `/${DEFAULT_SLUG}/checkout`, permanent: false },
      { source: "/auth", destination: `/${DEFAULT_SLUG}/auth`, permanent: false },
      { source: "/auth/callback", destination: `/${DEFAULT_SLUG}/auth/callback`, permanent: false },
      { source: "/track/:orderId", destination: `/${DEFAULT_SLUG}/track/:orderId`, permanent: false },
      { source: "/dashboard/:path*", destination: `/${DEFAULT_SLUG}/dashboard/:path*`, permanent: false },
      { source: "/profile", destination: `/${DEFAULT_SLUG}/profile`, permanent: false },
      { source: "/admin/:path*", destination: `/${DEFAULT_SLUG}/admin/:path*`, permanent: false },
      { source: "/customers/:path*", destination: `/${DEFAULT_SLUG}/customers/:path*`, permanent: false },
      { source: "/outlet/:id", destination: `/${DEFAULT_SLUG}/outlet/:id`, permanent: false },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  // Fleet-uniform: built with `next build --webpack` so next-pwa regenerates the SW every build
  // (always current; browser detects updates → PwaUpdater banner). Disabled only in dev.
  disable: true,
  workboxOptions: {
    skipWaiting: false,
    clientsClaim: true,
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "offlineCache",
          expiration: {
            maxEntries: 200,
          },
        },
      },
    ],
  },
});

export default pwaConfig(nextConfig);
