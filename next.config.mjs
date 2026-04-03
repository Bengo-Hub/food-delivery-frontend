import withPWA from "@ducanh2912/next-pwa";

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "urban-loft";

const nextConfig = {
  ...(process.env.SKIP_STANDALONE !== 'true' && { output: 'standalone' }),
  reactStrictMode: true,
  images: {
    // Enable Next.js image optimization for automatic resizing, format conversion
    // (WebP/AVIF), and lazy loading. This significantly reduces page load times.
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "orderingapi.codevertexitsolutions.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "inventoryapi.codevertexitsolutions.com",
        pathname: "/media/**",
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
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
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
