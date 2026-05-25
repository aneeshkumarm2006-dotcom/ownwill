import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the headless-Chromium packages out of the bundle — loaded at runtime.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // Externalizing isn't enough: @sparticuz/chromium reads its binary `bin/*.br`
  // files at runtime, and Next's file tracing skips non-JS data files. Force
  // them into the /api/pdf serverless function so Chromium can launch on Vercel.
  outputFileTracingIncludes: {
    "/api/pdf": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
