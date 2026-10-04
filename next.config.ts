import { existsSync, writeFileSync } from "node:fs";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
const isDev = process.env.NODE_ENV !== "production";
// NEXT_DIST_DIR lets the CV PDF (or a test build) be built without touching a running `next dev`.
const distDir = process.env.NEXT_DIST_DIR || ".next";

// No nonces (yet): inline scripts (Next's bootstrap, the theme script, JSON-LD) need 'unsafe-inline'.
// Dev also needs 'unsafe-eval' and the HMR websocket.
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
  // Runs as a Node server (`next start`): pages are rendered per request (the persona and its published
  // content come from Postgres); /api/* and /admin read and write the database.
  distDir,
  // A build into a private folder adds that folder's type paths to its tsconfig. Point it at the
  // git-ignored tsconfig.private.json (which extends tsconfig.json) so tsconfig.json stays clean.
  typescript: { tsconfigPath: distDir === ".next" ? "tsconfig.json" : "tsconfig.private.json" },
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  poweredByHeader: false,
  // The Postgres driver stays a plain Node dependency (it probes optional native bindings at runtime).
  serverExternalPackages: ["pg"],
  // The CV's old address keeps working: it is served by the documents route, which returns the PDF
  // printed at the last publish (or the one in public/ until then).
  async rewrites() {
    return { beforeFiles: [{ source: "/Md-Maruf-Billah-CV.pdf", destination: "/d/Md-Maruf-Billah-CV.pdf" }], afterFiles: [], fallback: [] };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Static files only (production): images for a week and the icon for a day (rename an image to bust
      // it). Pages get no rule on purpose: they are rendered per request (persona, published content, the
      // visitor's access) and Next sends them as private/no-store, so no shared cache keeps them. The CV PDF
      // is served by /d/ (reprinted on publish) and sets its own short cache.
      ...(isDev
        ? []
        : [
            { source: "/images/:path*", headers: longCache(604800) },
            { source: "/icon.svg", headers: longCache(86400) },
          ]),
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default function config(phase: string): NextConfig {
  // A fresh clone has no tsconfig.private.json (it is git-ignored); without it Next would write a
  // default one that misses the "@/*" path alias. "extends" also stops Next from editing it.
  // It also leaves out .next, whose route types belong to a running `next dev` and may be stale.
  if (distDir !== ".next" && !existsSync("tsconfig.private.json")) {
    writeFileSync("tsconfig.private.json", `{ "extends": "./tsconfig.json", "exclude": ["node_modules", ".next", ".next-*"] }
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
