import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.API_URL
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
