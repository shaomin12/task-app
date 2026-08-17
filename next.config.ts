import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Fly.io/Docker: bundles a minimal server + only the
  // dependencies actually used. Vercel has its own serverless packaging and
  // this option actively breaks its build, so it's only set outside Vercel.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;
