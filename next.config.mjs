const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["src"],
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  experimental: {
    typedRoutes: true,
    instrumentationHook: true,
  },
  output: "standalone",
};

export default nextConfig;
