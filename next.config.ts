import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      resourceQuery: /react/, // *.svg?react
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

export default nextConfig;
