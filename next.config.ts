import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };
    return config;
  },
  turbopack: {
    root: "C:/Users/VIGHNOTECH/Desktop/script/image-compressor",
  },
};

export default nextConfig;
