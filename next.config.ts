import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // SQL Server driver: load from node_modules at runtime instead of bundling
  serverExternalPackages: ["mssql"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
