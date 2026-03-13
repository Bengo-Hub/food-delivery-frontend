import withPWA from "@ducanh2912/next-pwa";

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG || "urban-loft";

const nextConfig = {
  ...(process.env.SKIP_STANDALONE !== 'true' && { output: 'standalone' }),
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  turbopack: {},
  async redirects() {
    return [
      { source: "/menu", destination: `/${DEFAULT_SLUG}/menu`, permanent: false },
      { source: "/menu/:id", destination: `/${DEFAULT_SLUG}/menu/:id`, permanent: false },
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
