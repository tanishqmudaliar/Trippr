import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["http://localhost:3000", "http://192.168.29.155"],
};

export default nextConfig;
