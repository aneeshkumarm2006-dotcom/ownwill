import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Pull the Supabase project hostname out of NEXT_PUBLIC_SUPABASE_URL so the
// Image optimizer can serve files from the public storage bucket. Falls back
// to a wildcard *.supabase.co when the env var is missing (e.g. during CI).
function supabaseImageHost(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "*.supabase.co";
  try {
    return new URL(raw).hostname;
  } catch {
    return "*.supabase.co";
  }
}

const nextConfig: NextConfig = {
  // Keep the headless-Chromium packages out of the bundle — loaded at runtime.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  // Externalizing isn't enough: @sparticuz/chromium reads its binary `bin/*.br`
  // files at runtime, and Next's file tracing skips non-JS data files. Force
  // them into the /api/pdf serverless function so Chromium can launch on Vercel.
  outputFileTracingIncludes: {
    "/api/pdf": ["./node_modules/@sparticuz/chromium/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseImageHost(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
