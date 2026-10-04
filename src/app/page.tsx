import type { Metadata } from "next";
import { ChatApp } from "@/components/chat-app";
import { JsonLd } from "@/components/site/site-shell";
import { profile } from "@/content/profile";
import { describe, graph, profilePageLd } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";
import { aiEnabled } from "@/server/ai";

// Set here, not in the layout, so other pages don't inherit "/" as their canonical.
export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
  description: describe(
    `${profile.name}, ${profile.role} in Dhaka with 5+ years in JavaScript and TypeScript - React, Next.js, NestJS, PostgreSQL and AWS. Ask my chat portfolio about my work.`,
  ),
};

export default function Home() {
  // Read at build time (the page is prerendered): build where GEMINI_API_KEY is set.
  return (
    <>
      <JsonLd data={graph(profilePageLd("/", `${profile.name} - ${profile.role}`))} />
      <ChatApp aiEnabled={aiEnabled()} />
    </>
  );
}
