import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        "@myriaddreamin/typst-ts-node-compiler":
          "commonjs @myriaddreamin/typst-ts-node-compiler",
        "@myriaddreamin/typst-ts-node-compiler-darwin-arm64":
          "commonjs @myriaddreamin/typst-ts-node-compiler-darwin-arm64",
      })
    }
    return config
  },
}

export default nextConfig
