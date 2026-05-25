import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Puppeteer (and its Chromium) out of the bundle — load at runtime.
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
