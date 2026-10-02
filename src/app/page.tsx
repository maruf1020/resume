import type { Metadata } from "next";
import { ChatApp } from "@/components/chat-app";
import { absoluteUrl } from "@/lib/site";

// Set here, not in the layout, so other pages don't inherit "/" as their canonical.
export const metadata: Metadata = { alternates: { canonical: absoluteUrl("/") } };

export default function Home() {
  return <ChatApp />;
}
