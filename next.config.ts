import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.API_URL ? `${process.env.API_URL}/api/:path*` : "http://localhost:8000/api/:path*", // so we don't need to hardcode anymore when making api requests
      },
    ];
  },
};

export default nextConfig;
