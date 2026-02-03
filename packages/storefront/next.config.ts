import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to BFF in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BFF_INTERNAL_URL || "http://localhost:3001"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
