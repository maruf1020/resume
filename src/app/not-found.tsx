import type { Metadata } from "next";
import Link from "next/link";

// The root title template adds " - Md Maruf Billah". Next already adds robots noindex to 404s.
export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6">
      <h1 className="display text-5xl md:text-7xl">I don&apos;t know that one.</h1>
      <p className="mt-4 text-lg text-muted">This page doesn&apos;t exist - but the chat knows everything about my work.</p>
      <Link href="/" className="btn btn-primary mt-8 self-start">
        Back to the chat
      </Link>
    </main>
  );
}
