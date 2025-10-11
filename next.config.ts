// next.config.ts

const nextConfig = {
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
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
  // ✅ Fixes Cross-Origin dev warning
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://10.88.0.3:3000",
    "*.cloudworkstations.dev",
  ],
};

export default nextConfig;
