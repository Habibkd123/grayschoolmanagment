import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Security / Bandwidth ─────────────────────────────────────────
  poweredByHeader: false,   // remove "X-Powered-By: Next.js" from every response
  compress: true,            // enable gzip/brotli compression for all responses

  allowedDevOrigins: ["moustache-dentist-twilight.ngrok-free.dev", "https://school-management-one-ivory.vercel.app/"],

  // ── Increase body size limit for file uploads (10MB) ─────────────
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Tree-shake lucide-react: only import used icons instead of the full 1500+ icon library
    optimizePackageImports: ["lucide-react"],
  },

  // ── Image optimisation ───────────────────────────────────────────
  images: {
    dangerouslyAllowSVG: true,
    // Serve AVIF first (50% smaller than WebP), then WebP, fallback to original
    formats: ["image/avif", "image/webp"],
    // Cache optimised images for 24 hours on CDN / Vercel Edge
    minimumCacheTTL: 86_400,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "http",  hostname: "localhost" },
    ],
  },

  // ── Redirects ────────────────────────────────────────────────────
  async redirects() {
    return [
      { source: "/fees-collection", destination: "/fees-collection/collect-fees", permanent: false },
      { source: "/academic",        destination: "/academic/class-room",          permanent: false },
      { source: "/examination",     destination: "/examination/exam",             permanent: false },
      { source: "/leave",           destination: "/leave/apply",                  permanent: false },
      { source: "/reports",         destination: "/reports/fees-report",          permanent: false },
    ];
  },
};

export default nextConfig;
