/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from any domain (product images)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
