import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  // Runs as a Node server (`next start`): the chat pages are still prerendered,
  // while /api/* and /admin need the server to read and write data/feedback.json.
  // NEXT_DIST_DIR lets the CV PDF be built without touching a running `next dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
