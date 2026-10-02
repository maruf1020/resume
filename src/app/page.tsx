import type { Metadata } from "next";
import { ChatApp } from "@/components/chat-app";
import { absoluteUrl } from "@/lib/site";
import { aiEnabled } from "@/server/ai";

// Set here, not in the layout, so other pages don't inherit "/" as their canonical.
export const metadata: Metadata = { alternates: { canonical: absoluteUrl("/") } };

export default function Home() {
  // Read at build time (the page is prerendered): build where GEMINI_API_KEY is set.
  return <ChatApp aiEnabled={aiEnabled()} />;
}
