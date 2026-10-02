import fsSync, { promises as fs } from "node:fs";
import path from "node:path";

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

export type Db = {
  version: 1;
  contacts: ContactEntry[];
  feedback: FeedbackEntry[];
  votes: VoteEntry[];
  events: EventEntry[];
};

/** Hard cap per list so a spammer can't grow the file without bound. */
export const MAX_ENTRIES = 5000;
/** Events are a rolling window: the oldest drop off past this. */
export const MAX_EVENTS = 20000;

// Runtime data file, not a build input: tell the bundler not to trace it.
const dbFile = () => path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.FEEDBACK_DB_PATH || "data/feedback.json");
/** A small file kept next to the store (for example the admin session epoch). */
export const sidecarFile = (name: string) => path.join(path.dirname(dbFile()), name);
const empty = (): Db => ({ version: 1, contacts: [], feedback: [], votes: [], events: [] });

const list = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

/** Any parsed value becomes a well-formed Db: wrong or missing lists turn into empty ones. */
function normalise(value: unknown): Db {
  const v = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Record<string, unknown>;
  return {
    version: 1,
    contacts: list<ContactEntry>(v.contacts),
    feedback: list<FeedbackEntry>(v.feedback),
    votes: list<VoteEntry>(v.votes),
    events: list<EventEntry>(v.events),
  };
}

async function parseFile(file: string): Promise<Db | null> {
  try {
    return normalise(JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ file, "utf8")));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/**
 * Loads the store from disk. A file that isn't valid JSON is kept aside as `<file>.corrupt-<time>`,
 * and the last good copy (`<file>.bak`) is used instead, or an empty store if there is none.
 */
async function read(): Promise<Db> {
  const file = dbFile();
  try {
    return (await parseFile(file)) ?? empty();
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
    const aside = `${file}.corrupt-${Date.now()}`;
    await fs.copyFile(file, aside).catch(() => {});
    console.error(`[store] ${file} is not valid JSON. Kept a copy at ${aside}; trying ${file}.bak.`);
    try {
      const backup = await parseFile(`${file}.bak`);
      if (backup) {
        // Put the good copy back first, so the next write doesn't back up the damaged file over it.
        await fs.copyFile(`${file}.bak`, file).catch(() => {});
        console.error(`[store] Recovered from ${file}.bak.`);
        return backup;
      }
    } catch {
      console.error(`[store] ${file}.bak is not valid JSON either.`);
    }
    console.error("[store] Starting with an empty store. The corrupt copy was kept, nothing was deleted.");
    return empty();
  }
}

/**
 * Write to a temp file then rename, so a crash mid-write never leaves half a JSON file.
 * The previous file is copied to `<file>.bak` first, as the fallback if the main file is ever damaged.
 */
async function write(text: string) {
  const file = dbFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, text, "utf8");
  await fs.copyFile(file, `${file}.bak`).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err;
  });
  await fs.rename(tmp, file);
}

function writeSync(text: string) {
  const file = dbFile();
  fsSync.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fsSync.writeFileSync(tmp, text, "utf8");
  try {
    fsSync.copyFileSync(file, `${file}.bak`);
  } catch {
    /* no previous file yet */
  }
  fsSync.renameSync(tmp, file);
}

// ---------- in-memory copy (single process) ----------
// The store is read once, then kept in memory and flushed to disk at most every FLUSH_MS.
// State lives on globalThis so every route bundle in this process shares the same copy.
// This needs exactly ONE server process: several processes would each keep their own copy.
const FLUSH_MS = 2_000;

type State = {
  db: Db | null;
  loading: Promise<Db> | null;
  dirty: boolean;
  timer: ReturnType<typeof setTimeout> | null;
  /** Serialises mutations and reads. */
  queue: Promise<unknown>;
  /** Serialises disk writes. */
  writing: Promise<void>;
  hooked: boolean;
};

const g = globalThis as typeof globalThis & { __feedbackStore?: State };
const state: State = (g.__feedbackStore ??= {
  db: null,
  loading: null,
  dirty: false,
  timer: null,
  queue: Promise.resolve(),
  writing: Promise.resolve(),
  hooked: false,
});

function load(): Promise<Db> {
  if (state.db) return Promise.resolve(state.db);
  state.loading ??= read().then(
    (db) => (state.db = db),
    (err) => {
      state.loading = null; // let the next request try again
      throw err;
    },
  );
  return state.loading;
}

/** Writes the in-memory copy to disk if it changed. Safe to call often. */
export function flushDb(): Promise<void> {
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  const run = state.writing.then(async () => {
    if (!state.dirty || !state.db) return;
    state.dirty = false;
    const text = JSON.stringify(state.db);
    try {
      await write(text);
    } catch (err) {
      state.dirty = true; // keep the changes for the next flush
      throw err;
    }
  });
  state.writing = run.catch((err) => console.error("[store] Could not write the store:", err));
  return run;
}

function scheduleFlush() {
  if (state.timer) return;
  state.timer = setTimeout(() => {
    state.timer = null;
    flushDb().catch(() => {});
  }, FLUSH_MS);
  state.timer.unref?.();
}

/** On shutdown, write any pending changes synchronously (the process may exit right after). */
function hookShutdown() {
  if (state.hooked) return;
  state.hooked = true;
  const flushNow = () => {
    if (!state.dirty || !state.db) return;
    try {
      writeSync(JSON.stringify(state.db));
      state.dirty = false;
    } catch (err) {
      console.error("[store] Could not write the store on shutdown:", err);
    }
  };
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      flushNow();
      // Leave the exit to Next's own handler when it has one.
      if (process.listenerCount(signal) === 0) process.exit(0);
    });
  }
  process.once("beforeExit", flushNow);
}

/**
 * Applies `fn` to the store. With `durable` (contact, feedback, votes) the change is on disk before
 * this resolves; otherwise (analytics events) it goes out with the next batched flush.
 */
export function mutate<T>(fn: (db: Db) => T, { durable = true }: { durable?: boolean } = {}): Promise<T> {
  hookShutdown();
  const run = state.queue.then(async () => {
    const db = await load();
    const result = fn(db);
    state.dirty = true;
    if (durable) await flushDb();
    else scheduleFlush();
    return result;
  });
  state.queue = run.catch(() => {});
  return run;
}

/** A consistent snapshot of the in-memory store (lists are copied, so later writes don't change it). */
export function readDb(): Promise<Db> {
  const run = state.queue.then(async () => {
    const db = await load();
    return { ...db, contacts: [...db.contacts], feedback: [...db.feedback], votes: [...db.votes], events: [...db.events] };
  });
  state.queue = run.catch(() => {});
  return run;
}

/** The store exactly as it is on disk, after writing any pending changes. Null when there is no file yet. */
export async function readDbFile(): Promise<Buffer | null> {
  await state.queue;
  await flushDb();
  try {
    return await fs.readFile(/*turbopackIgnore: true*/ dbFile());
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** Throws unless the store's folder exists (or can be created) and is writable. */
export async function checkStoreWritable() {
  const dir = path.dirname(dbFile());
  await fs.mkdir(dir, { recursive: true });
  await fs.access(dir, fsSync.constants.W_OK);
}
