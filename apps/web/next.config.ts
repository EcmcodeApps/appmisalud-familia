import type { NextConfig } from "next";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    const connectSrc = [
      "'self'",
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "https://*.firebaseapp.com",
      "wss://*.firebaseio.com",
      apiBaseUrl,
    ].join(" ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              `connect-src ${connectSrc}`,
              "frame-src 'self' blob: https:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
