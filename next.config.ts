import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // -------------------------------------------------------------------------
  // Base Settings
  // -------------------------------------------------------------------------
  reactStrictMode: true,

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // -------------------------------------------------------------------------
  // Allowed Remote Images
  // -------------------------------------------------------------------------
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },

  // -------------------------------------------------------------------------
  // Environment Variables
  // -------------------------------------------------------------------------
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FCM_VAPID_KEY: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
    NEXT_PUBLIC_AGORA_APP_ID: process.env.NEXT_PUBLIC_AGORA_APP_ID,
  },

  // -------------------------------------------------------------------------
  // Webpack override — SAFE for Next.js 15 + Firebase Studio
  // -------------------------------------------------------------------------
  webpack: (config, { isServer, dev }) => {
    // 🔐 Prevent Firebase Studio from modifying read-only watchOptions
    if (dev && !isServer) {
      try {
        // Clone watchOptions instead of mutating read-only fields
        config.watchOptions = {
          ...(config.watchOptions || {}),
          // We do not modify "ignored" directly as it is read-only in Next.js 15
        };
      } catch (err) {
        console.warn(
          "⚠️ Firebase Studio: Safe watchOptions patch skipped:",
          err.message
        );
      }
    }

    // Old logic removed → to avoid "Cannot assign to read only property" warning
    return config;
  },
};

export default nextConfig;
