import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  logging: {
    browserToTerminal:"error",
  },
  reactStrictMode: false,
};

export default nextConfig;
