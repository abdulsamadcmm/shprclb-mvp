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
  // Allow fonts from Fontshare
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'font-display=swap',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
