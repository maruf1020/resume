import type { MetadataRoute } from "next";
import { absoluteUrl, basePath as base } from "@/lib/site";

// The private inbox isn't listed here on purpose (that would advertise it); it sends
// `X-Robots-Tag: noindex` and a noindex meta tag, and is a 404 without a session.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: `${base}/api/` },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
