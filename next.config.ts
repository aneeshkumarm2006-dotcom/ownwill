import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the headless-Chromium packages out of the bundle — loaded at runtime.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // build: 2026-05-26 — trigger fresh deploy (env vars applied)
};

export default nextConfig;
