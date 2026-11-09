import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Classic caching model: pages use ISR (`revalidate`) and admin saves call revalidatePath().
  cacheComponents: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
    localPatterns: [
      { pathname: "/api/uploads/**", search: "" },
      { pathname: "/**", search: "" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Admin uploads are up to 8MB; allow multipart bodies through the proxy.
    proxyClientMaxBodySize: "10mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
