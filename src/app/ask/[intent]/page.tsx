import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatApp } from "@/components/chat-app";
import { getIntent, intents } from "@/content/intents";
import { profile } from "@/content/profile";
import { absoluteUrl } from "@/lib/site";
import { plain } from "@/lib/utils";

// Every answer is prerendered so each one has a real, shareable URL. Unknown ids aren't blocked with
// dynamicParams = false (that logs a NoFallbackError for each one); the page itself answers 404.

const ogImage = { url: "/og.png", width: 1200, height: 630, alt: `${profile.name} - ${profile.role}` };

export function generateStaticParams() {
  return intents.map((i) => ({ intent: i.id }));
}

export async function generateMetadata(props: PageProps<"/ask/[intent]">): Promise<Metadata> {
  const { intent: id } = await props.params;
  const intent = getIntent(id);
  if (!intent) return {};
  const title = `${intent.label} - ${profile.name}`;
  const description = plain(intent.answers[0]).slice(0, 160);
  const url = absoluteUrl(`/ask/${id}/`);
  // A child openGraph/twitter object replaces the root layout's, so siteName and the image are repeated here.
  return {
    title: intent.label,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: profile.name, title, description, url, images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default async function AskPage(props: PageProps<"/ask/[intent]">) {
  const { intent: id } = await props.params;
  if (!getIntent(id)) notFound();
  return <ChatApp initialIntent={id} />;
}
