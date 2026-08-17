import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Fly.io: bundles a minimal server + only the
  // dependencies actually used, so the deployed image doesn't need `npm install`.
  output: "standalone",
};

export default nextConfig;
