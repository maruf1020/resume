import { Pool, type QueryResultRow } from "pg";

/**
 * The Postgres connection (DATABASE_URL, e.g. a Neon database). One pool per process, kept on
 * globalThis so dev-server reloads and every route bundle share it. Tables are created on first use,
 * so a fresh database needs no setup step: the first request (or /api/health/) does it.
 */

const g = globalThis as typeof globalThis & { __pgPool?: Pool; __pgSchema?: Promise<void> };

export const dbConfigured = () => !!process.env.DATABASE_URL?.trim();

function pool(): Pool {
  if (g.__pgPool) return g.__pgPool;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set");
  // pg already verifies the server certificate for sslmode=require (and warns, at length, that libpq
  // wouldn't); saying verify-full keeps that behaviour explicit and the startup log quiet.
  const connectionString = url.replace(/sslmode=(prefer|require|verify-ca)\b/, "sslmode=verify-full");
  // Small pool: Neon's pooler sits in front, and this app is a handful of short queries per request.
  g.__pgPool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000, query_timeout: 15_000 });
  g.__pgPool.on("error", (err) => console.error("[db] idle client error:", err.message));
  return g.__pgPool;
}

// Visitor details stay JSON (jsonb) so the inbox reads them exactly as before. answer_id is '' rather
// than NULL for curated answers, so the UNIQUE constraint (one vote per visitor per answer) covers both.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  visitor jsonb NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  message text NOT NULL
);
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  visitor jsonb NOT NULL,
  rating smallint,
  message text NOT NULL DEFAULT '',
  name text,
  email text
);
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  visitor_id text NOT NULL,
  visitor jsonb NOT NULL,
  intent_id text NOT NULL,
  variant smallint NOT NULL,
  answer_id text NOT NULL DEFAULT '',
  value text NOT NULL CHECK (value IN ('up', 'down')),
  UNIQUE (visitor_id, intent_id, variant, answer_id)
);
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  intent_id text,
  path text,
  consent boolean NOT NULL DEFAULT false,
  visitor jsonb
);
CREATE INDEX IF NOT EXISTS events_at_idx ON events (at);
CREATE TABLE IF NOT EXISTS ai_answers (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  visitor jsonb,
  question text NOT NULL,
  route text NOT NULL,
  intent_id text,
  answer text,
  cards jsonb,
  model text,
  ms integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ai_answers_created_at_idx ON ai_answers (created_at);
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
`;

/** Creates the tables once per process (idempotent). A failure is retried on the next query. */
function ensureSchema(): Promise<void> {
  g.__pgSchema ??= pool()
    .query(SCHEMA)
    .then(
      () => undefined,
      (err: unknown) => {
        g.__pgSchema = undefined;
        throw err;
      },
    );
  return g.__pgSchema;
}

/** Runs one parameterised query, making sure the schema exists first. */
export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  await ensureSchema();
  return pool().query<T>(text, params);
}
