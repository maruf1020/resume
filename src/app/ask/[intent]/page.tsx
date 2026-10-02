import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatApp } from "@/components/chat-app";
import { getIntent, intents } from "@/content/intents";
import { plain } from "@/lib/utils";

// Every answer is prerendered so each one has a real, shareable URL.
export const dynamicParams = false;

export function generateStaticParams() {
  return intents.map((i) => ({ intent: i.id }));
}

export async function generateMetadata(props: PageProps<"/ask/[intent]">): Promise<Metadata> {
  const { intent: id } = await props.params;
  const intent = getIntent(id);
  if (!intent) return {};
  return { title: intent.label, description: plain(intent.answers[0]).slice(0, 160) };
}

export default async function AskPage(props: PageProps<"/ask/[intent]">) {
  const { intent: id } = await props.params;
  if (!getIntent(id)) notFound();
  return <ChatApp initialIntent={id} />;
}
