/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any HTTPS source (product images managed externally)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Serve optimized images in modern formats
    formats: ["image/avif", "image/webp"],
    // Keep optimized images in the build cache longer (30 days)
    minimumCacheTTL: 2592000,
    // Reasonable set of sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Security + caching headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Cache static assets aggressively (1 year, immutable)
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|css|js)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache Next.js static chunks (fingerprinted, safe to cache forever)
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache optimized images (30 days + revalidate)
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Cache public API responses at edge (30s fresh, 2min stale)
        source: "/api/store/(settings|categories|featured|products|animals|inventory|services)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=30, stale-while-revalidate=120",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
