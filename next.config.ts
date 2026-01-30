import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL}/api/:path*`, // so we don't need to hardcode anymore when making api requests
      },
    ];
  },
};

export default nextConfig;
