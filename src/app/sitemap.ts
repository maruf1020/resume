import type { MetadataRoute } from "next";
import { intents } from "@/content/intents";
import { absoluteUrl as url } from "@/lib/site";

/** The chat, the CV and every prerendered answer. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    { url: url("/cv/"), changeFrequency: "monthly", priority: 0.8 },
    ...intents.map((i) => ({ url: url(`/ask/${i.id}/`), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
