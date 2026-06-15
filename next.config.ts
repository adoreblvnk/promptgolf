import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright drives the dev server through 127.0.0.1, while Next's HMR
  // endpoint is protected against unlisted cross-origin dev requests.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
