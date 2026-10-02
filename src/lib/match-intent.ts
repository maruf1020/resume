import { intents, primaryIntents, type Intent } from "@/content/intents";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/ ]+/g, " ")
    .trim();

const STOP = new Set(["a", "an", "the", "me", "my", "your", "you", "is", "are", "do", "can", "i", "what", "show", "tell", "about", "of", "to", "in", "on", "and", "please"]);

function score(intent: Intent, tokens: string[], full: string): number {
  const label = normalize(intent.label);
  let s = 0;
  if (label.startsWith(full)) s += 6;
  else if (label.includes(full)) s += 3;
  for (const t of tokens) {
    for (const k of intent.keywords) {
      const kw = normalize(k);
      if (kw === t) s += 4;
      else if (t.length >= 2 && kw.startsWith(t)) s += 2;
    }
    if (label.split(" ").some((w) => w.startsWith(t))) s += 2;
  }
  // Primary topics win ties against project drill-downs.
  return s > 0 && intent.primary ? s + 0.5 : s;
}

/** Ranks allowed questions for what the visitor typed. Empty input or "/" lists the main topics. */
export function matchIntents(query: string, limit = 6): Intent[] {
  const full = normalize(query).replace(/^\//, "").trim();
  // "/" alone lists every main topic, like a command palette.
  if (!full) return query.trim() === "/" ? primaryIntents : primaryIntents.slice(0, limit);
  const tokens = full.split(/\s+/).filter((t) => t && !STOP.has(t));
  const searchTokens = tokens.length ? tokens : full.split(/\s+/);
  return intents
    .map((intent) => ({ intent, s: score(intent, searchTokens, full) }))
    .filter((r) => r.s >= 2)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.intent);
}

const squash = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, "");
let topicWords: string[] | undefined;

/** True when the text contains a topic keyword or label (5+ letters), e.g. "myexperience". */
export function mentionsTopic(query: string): boolean {
  topicWords ??= [...new Set(intents.flatMap((i) => [i.label, ...i.keywords]).map(squash))].filter((w) => w.length >= 5);
  const q = squash(query);
  return !!q && topicWords.some((w) => q.includes(w));
}

/**
 * The shape every admin code must have (scripts/hash-admin-code.mjs enforces the same rule): one
 * "word" of 8 to 128 characters with no spaces, containing a letter, a digit, and an uppercase
 * letter or a symbol. Ordinary words ("kubernetes", "Leadership", "full-stack") never have it.
 * Only the shape is known here, never the code itself.
 */
export const hasCodeShape = (q: string) =>
  q.length >= 8 &&
  q.length <= 128 &&
  !/\s/.test(q) &&
  !q.startsWith("/") &&
  /[a-z]/i.test(q) &&
  /\d/.test(q) &&
  /[A-Z]|[^a-zA-Z0-9]/.test(q);

/**
 * The intent whose label is exactly what was typed (or, for a single word, a keyword of the best
 * match), so the ready-made answer can play without asking the AI: "projects", "skills", "docker".
 */
export function exactIntent(query: string, top?: Intent): Intent | undefined {
  const q = normalize(query).replace(/^\//, "").trim();
  if (!q) return undefined;
  const byLabel = intents.find((i) => normalize(i.label) === q);
  if (byLabel) return byLabel;
  if (top && !q.includes(" ") && top.keywords.some((k) => normalize(k) === q)) return top;
  return undefined;
}
