// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // ✅ This fixes the Cross-Origin warning for your dev server
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://10.88.0.3:3000",
    "*.cloudworkstations.dev",
  ],
};

export default nextConfig;
