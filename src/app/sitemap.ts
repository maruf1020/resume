import type { MetadataRoute } from "next";
import { photos } from "@/content/photos";
import { projects } from "@/content/projects";
import { CONTENT_UPDATED, SITE_PAGES } from "@/lib/seo";
import { absoluteUrl as url } from "@/lib/site";

/**
 * Only indexable pages: the chat home, the content pages, every project case study and the CV.
 * The /ask/* chat views are noindex (their content lives on these pages), so they are left out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = CONTENT_UPDATED;
  const photo = url(photos[0].src);
  return [
    { url: url("/"), lastModified, changeFrequency: "monthly", priority: 1, images: [photo] },
    ...SITE_PAGES.map((p) => ({
      url: url(p.path),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: p.path === "/about/" || p.path === "/projects/" ? 0.9 : 0.8,
      ...(p.path === "/about/" ? { images: [photo] } : {}),
    })),
    ...projects.map((p) => ({
      url: url(`/projects/${p.id}/`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [url(`/og/${p.id}.png`)],
    })),
    { url: url("/cv/"), lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];
}
