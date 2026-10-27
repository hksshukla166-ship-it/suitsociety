import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@fonoster/sdk", "@grpc/grpc-js", "@grpc/proto-loader"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
    proxyClientMaxBodySize: "16mb",
  },
  async redirects() {
    return [
      { source: "/shop", destination: "/products", permanent: true },
      { source: "/product/:slug", destination: "/products/:slug", permanent: true },
      {
        source: "/order-confirmation/:orderNumber",
        destination: "/order-confirmation?order=:orderNumber",
        permanent: false,
      },
      { source: "/login", destination: "/account", permanent: false },
    ];
  },
};

export default nextConfig;
