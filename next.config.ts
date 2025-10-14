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
        protocol: "https://",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
  // ✅ Silence harmless dev warnings
  webpack: (config, { dev, isServer }) => {
    // Silences warnings about source maps not being generated for 3rd party packages.
    // These are harmless and can be ignored.
    if (!isServer) {
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            /Failed to parse source map/
        ];
    }
    
    // Silences harmless "module not found" warnings for 'encoding'
    // This is a Node.js module that is not needed on the client-side.
    config.resolve.fallback = {
        ...config.resolve.fallback,
        encoding: false,
    };
    
    return config;
  },
  // ✅ Fixes Cross-Origin dev warnings
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://10.88.0.3:3000",
    "*.cloudworkstations.dev",
    "6000-firebase-akilipesacustomize-1759689616117.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev",
  ],
};

export default nextConfig;
