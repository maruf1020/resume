import { existsSync, writeFileSync } from "node:fs";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
const isDev = process.env.NODE_ENV !== "production";
// NEXT_DIST_DIR lets the CV PDF (or a test build) be built without touching a running `next dev`.
const distDir = process.env.NEXT_DIST_DIR || ".next";

// No nonces: the chat pages are prerendered, so inline scripts (Next's bootstrap, the theme script,
// JSON-LD) need 'unsafe-inline'. Dev also needs 'unsafe-eval' and the HMR websocket.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  // Only once the site is served over HTTPS for good: browsers remember this for two years.
  ...(process.env.ENABLE_HSTS === "1" ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const longCache = (seconds: number) => [{ key: "Cache-Control", value: `public, max-age=${seconds}, stale-while-revalidate=86400` }];

const nextConfig: NextConfig = {
  // Runs as a Node server (`next start`): the chat pages are still prerendered,
  // while /api/* and /admin need the server to read and write data/feedback.json.
  distDir,
  // A build into a private folder adds that folder's type paths to its tsconfig. Point it at the
  // git-ignored tsconfig.private.json (which extends tsconfig.json) so tsconfig.json stays clean.
  typescript: { tsconfigPath: distDir === ".next" ? "tsconfig.json" : "tsconfig.private.json" },
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Pages (production only): browsers always revalidate, a CDN may cache for 10 minutes.
      ...(isDev
        ? []
        : [
            // Static files: images for a week, the CV PDF and the icon for a day (rename an image to bust it).
            { source: "/images/:path*", headers: longCache(604800) },
            { source: "/Md-Maruf-Billah-CV.pdf", headers: longCache(86400) },
            { source: "/icon.svg", headers: longCache(86400) },
            {
              source: "/((?!_next/static|api|admin|images/|Md-Maruf-Billah-CV\\.pdf|icon\\.svg).*)",
              headers: [{ key: "Cache-Control", value: "public, max-age=0, s-maxage=600, stale-while-revalidate=86400" }],
            },
          ]),
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default function config(phase: string): NextConfig {
  // A fresh clone has no tsconfig.private.json (it is git-ignored); without it Next would write a
  // default one that misses the "@/*" path alias. "extends" also stops Next from editing it.
  if (distDir !== ".next" && !existsSync("tsconfig.private.json")) {
    writeFileSync("tsconfig.private.json", `{ "extends": "./tsconfig.json" }
`);
  }
  // Only while building: that's when canonical links, robots.txt and sitemap.xml are baked in.
  // Build workers load this file again and inherit the env, so the flag keeps it to one warning.
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.NEXT_PUBLIC_SITE_URL && !process.env.SITE_URL_WARNED) {
    process.env.SITE_URL_WARNED = "1";
    console.warn(
      "[next.config] NEXT_PUBLIC_SITE_URL is not set: canonical links, Open Graph URLs, robots.txt and sitemap.xml will point at http://localhost:3000.",
    );
  }
  return nextConfig;
}
