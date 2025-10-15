
import type { NextConfig } from 'next';

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
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
  // ✅ Fixes Cross-Origin dev warnings
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://10.88.0.3:3000',
    '*.cloudworkstations.dev',
    '6000-firebase-akilipesacustomize-1759689616117.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev',
  ],
  experimental: {
    workerThreads: false,
    manualClientBasePath: true,
  },
};

export default nextConfig;
