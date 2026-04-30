import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Images ────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "proton.trigads.com" },
      { protocol: "https", hostname: "*.googleapis.com" },
      { protocol: "https", hostname: "*.whatsapp.net" }, // WhatsApp media CDN
    ],
  },

  // ── Security Headers ──────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
