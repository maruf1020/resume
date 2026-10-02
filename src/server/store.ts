import { randomUUID } from "node:crypto";
import { query } from "./db";

/**
 * The store: messages, feedback, votes, analytics events and AI answers, in Postgres (see db.ts).
 * Each list is one table; visitor details are kept as JSON, so the inbox reads them exactly as it
 * always did. `readDb()` returns everything in the shape the inbox and the JSON export use.
 */

/** What the browser tells us about a visitor. No IP addresses are stored. */
export type VisitorInfo = {
  visitorId: string;
  userAgent?: string;
  language?: string;
  timezone?: string;
  referrer?: string;
  screen?: string;
  /** Only with analytics consent: */
  viewport?: string;
  platform?: string;
  pixelRatio?: number;
  colorScheme?: string;
  touch?: boolean;
  landing?: string;
  utm?: string;
  visits?: number;
};

export type ContactEntry = {
  id: string;
  createdAt: string;
  visitor: VisitorInfo;
  name: string;
  email: string;
  company?: string;
  message: string;
};

export type FeedbackEntry = {
  id: string;
  createdAt: string;
  visitor: VisitorInfo;
  rating: number | null;
  message: string;
  name?: string;
  email?: string;
};

export type VoteEntry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  visitor: VisitorInfo;
  intentId: string;
  variant: number;
  /** For a vote on an AI answer (intentId "ai"): the aiAnswers entry it rates. */
  answerId?: string;
  value: "up" | "down";
};

/** Analytics event. With consent it carries the visitor; without, it is anonymous (type + answer only). */
export type EventEntry = {
  id: string;
  at: string;
  type: "pageview" | "ask";
  intentId?: string;
  path?: string;
  consent: boolean;
  visitor?: VisitorInfo;
};

/** A free-form question and what the AI did with it, kept so the owner can review and add curated answers. */
export type AiAnswerEntry = {
  id: string;
  createdAt: string;
  /** Anonymous id (device details only with consent); missing when the browser sent none. */
  visitor?: VisitorInfo;
  question: string;
  route: "topic" | "answer" | "decline" | "error";
  /** The curated topic it was routed to. */
  intentId?: string;
  answer?: string;
  /** Cards attached to the answer, e.g. "skills" or "project:walton". */
  cards?: string[];
  model?: string;
  ms: number;
};

export type Db = {
  version: 1;
  contacts: ContactEntry[];
  feedback: FeedbackEntry[];
  votes: VoteEntry[];
  events: EventEntry[];
  /** Rolling: the newest MAX_ENTRIES. */
  aiAnswers: AiAnswerEntry[];
};

/** Hard cap per list so a spammer can't grow the database without bound. */
export const MAX_ENTRIES = 5000;
/** Events are a rolling window: the oldest drop off past this. */
export const MAX_EVENTS = 20000;

const iso = (d: Date | string) => (d instanceof Date ? d : new Date(d)).toISOString();
const orUndef = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

/** Row count of one of our tables (the names are constants, never input). */
async function count(table: "contacts" | "feedback" | "votes"): Promise<number> {
  const { rows } = await query<{ n: string }>(`SELECT count(*)::text AS n FROM ${table}`);
  return Number(rows[0].n);
}

/** False when the list is full. */
export async function addContact(e: Omit<ContactEntry, "id" | "createdAt">): Promise<boolean> {
  if ((await count("contacts")) >= MAX_ENTRIES) return false;
  await query("INSERT INTO contacts (id, visitor, name, email, company, message) VALUES ($1, $2, $3, $4, $5, $6)", [
    randomUUID(),
    e.visitor,
    e.name,
    e.email,
    e.company ?? null,
    e.message,
  ]);
  return true;
}

/** False when the list is full. */
export async function addFeedback(e: Omit<FeedbackEntry, "id" | "createdAt">): Promise<boolean> {
  if ((await count("feedback")) >= MAX_ENTRIES) return false;
  await query("INSERT INTO feedback (id, visitor, rating, message, name, email) VALUES ($1, $2, $3, $4, $5, $6)", [
    randomUUID(),
    e.visitor,
    e.rating,
    e.message,
    e.name ?? null,
    e.email ?? null,
  ]);
  return true;
}

/**
 * One vote per visitor per answer (a curated wording, or one AI answer). Voting again changes it,
 * `value: null` removes it. False only when the list is full and this would be a new vote.
 */
export async function castVote(v: { visitor: VisitorInfo; intentId: string; variant: number; answerId?: string; value: "up" | "down" | null }): Promise<boolean> {
  const key = [v.visitor.visitorId, v.intentId, v.variant, v.answerId ?? ""];
  if (v.value === null) {
    await query("DELETE FROM votes WHERE visitor_id = $1 AND intent_id = $2 AND variant = $3 AND answer_id = $4", key);
    return true;
  }
  if ((await count("votes")) >= MAX_ENTRIES) {
    const res = await query("UPDATE votes SET value = $5, visitor = $6, updated_at = now() WHERE visitor_id = $1 AND intent_id = $2 AND variant = $3 AND answer_id = $4", [
      ...key,
      v.value,
      v.visitor,
    ]);
    return (res.rowCount ?? 0) > 0;
  }
  await query(
    `INSERT INTO votes (id, visitor_id, visitor, intent_id, variant, answer_id, value) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (visitor_id, intent_id, variant, answer_id) DO UPDATE SET value = EXCLUDED.value, visitor = EXCLUDED.visitor, updated_at = now()`,
    [randomUUID(), v.visitor.visitorId, v.visitor, v.intentId, v.variant, v.answerId ?? "", v.value],
  );
  return true;
}

// The rolling lists are trimmed every so often rather than on every insert.
const TRIM_EVERY = 50;
const sinceTrim = { events: 0, ai_answers: 0 };
async function trim(table: keyof typeof sinceTrim, column: "at" | "created_at", keep: number) {
  if (++sinceTrim[table] < TRIM_EVERY) return;
  sinceTrim[table] = 0;
  await query(`DELETE FROM ${table} WHERE ${column} < (SELECT ${column} FROM ${table} ORDER BY ${column} DESC OFFSET $1 LIMIT 1)`, [keep]).catch((err) =>
    console.error(`[store] Could not trim ${table}:`, err),
  );
}

/** Analytics event; `visitor` is only there with consent. */
export async function addEvent(e: Omit<EventEntry, "id" | "at">): Promise<void> {
  await query("INSERT INTO events (id, type, intent_id, path, consent, visitor) VALUES ($1, $2, $3, $4, $5, $6)", [
    randomUUID(),
    e.type,
    e.intentId ?? null,
    e.path ?? null,
    e.consent,
    e.visitor ?? null,
  ]);
  await trim("events", "at", MAX_EVENTS);
}

/** The caller picks the id: votes on the answer refer to it. */
export async function addAiAnswer(e: Omit<AiAnswerEntry, "createdAt">): Promise<void> {
  // Arrays must be sent as JSON text: pg would otherwise encode them as a Postgres array.
  await query("INSERT INTO ai_answers (id, visitor, question, route, intent_id, answer, cards, model, ms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
    e.id,
    e.visitor ?? null,
    e.question,
    e.route,
    e.intentId ?? null,
    e.answer ?? null,
    e.cards ? JSON.stringify(e.cards) : null,
    e.model ?? null,
    e.ms,
  ]);
  await trim("ai_answers", "created_at", MAX_ENTRIES);
}

type ContactRow = { id: string; created_at: Date; visitor: VisitorInfo; name: string; email: string; company: string | null; message: string };
type FeedbackRow = { id: string; created_at: Date; visitor: VisitorInfo; rating: number | null; message: string; name: string | null; email: string | null };
type VoteRow = { id: string; created_at: Date; updated_at: Date; visitor: VisitorInfo; intent_id: string; variant: number; answer_id: string; value: "up" | "down" };
type EventRow = { id: string; at: Date; type: EventEntry["type"]; intent_id: string | null; path: string | null; consent: boolean; visitor: VisitorInfo | null };
type AiAnswerRow = {
  id: string;
  created_at: Date;
  visitor: VisitorInfo | null;
  question: string;
  route: AiAnswerEntry["route"];
  intent_id: string | null;
  answer: string | null;
  cards: string[] | null;
  model: string | null;
  ms: number;
};

/** Everything, oldest first, in the shape the inbox and the JSON export use. */
export async function readDb(): Promise<Db> {
  const [c, f, v, e, a] = await Promise.all([
    query<ContactRow>("SELECT * FROM contacts ORDER BY created_at"),
    query<FeedbackRow>("SELECT * FROM feedback ORDER BY created_at"),
    query<VoteRow>("SELECT * FROM votes ORDER BY created_at"),
    query<EventRow>("SELECT * FROM events ORDER BY at"),
    query<AiAnswerRow>("SELECT * FROM ai_answers ORDER BY created_at"),
  ]);
  return {
    version: 1,
    contacts: c.rows.map((r) => ({ id: r.id, createdAt: iso(r.created_at), visitor: r.visitor, name: r.name, email: r.email, company: orUndef(r.company), message: r.message })),
    feedback: f.rows.map((r) => ({ id: r.id, createdAt: iso(r.created_at), visitor: r.visitor, rating: r.rating, message: r.message, name: orUndef(r.name), email: orUndef(r.email) })),
    votes: v.rows.map((r) => ({
      id: r.id,
      createdAt: iso(r.created_at),
      updatedAt: iso(r.updated_at),
      visitor: r.visitor,
      intentId: r.intent_id,
      variant: r.variant,
      answerId: r.answer_id || undefined,
      value: r.value,
    })),
    events: e.rows.map((r) => ({ id: r.id, at: iso(r.at), type: r.type, intentId: orUndef(r.intent_id), path: orUndef(r.path), consent: r.consent, visitor: orUndef(r.visitor) })),
    aiAnswers: a.rows.map((r) => ({
      id: r.id,
      createdAt: iso(r.created_at),
      visitor: orUndef(r.visitor),
      question: r.question,
      route: r.route,
      intentId: orUndef(r.intent_id),
      answer: orUndef(r.answer),
      cards: orUndef(r.cards),
      model: orUndef(r.model),
      ms: r.ms,
    })),
  };
}

/** Throws unless the database answers (on a fresh database this also creates the tables). */
export async function checkStore(): Promise<void> {
  await query("SELECT 1");
}

// ---------- small key/value settings (the admin session epoch lives here) ----------

export async function getSetting(key: string): Promise<string | null> {
  const { rows } = await query<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
  return rows[0]?.value ?? null;
}

/** Adds one to an integer setting (starting it at 1) and returns the new value; atomic. */
export async function bumpSetting(key: string): Promise<number> {
  const { rows } = await query<{ value: string }>(
    "INSERT INTO settings (key, value) VALUES ($1, '1') ON CONFLICT (key) DO UPDATE SET value = (settings.value::bigint + 1)::text RETURNING value",
    [key],
  );
  return Number(rows[0].value);
}
