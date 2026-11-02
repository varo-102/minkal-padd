import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@stellar/stellar-sdk"],
  transpilePackages: ["escrow-client", "usdc-client"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
