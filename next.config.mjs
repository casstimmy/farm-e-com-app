/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from known domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "farm-fresh-store.s3.us-east-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "farm-fresh-store.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },

  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Security headers
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
        // Cache static assets aggressively
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|css|js)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
