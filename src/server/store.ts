import { promises as fs } from "node:fs";
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
const empty = (): Db => ({ version: 1, contacts: [], feedback: [], votes: [], events: [] });

async function read(): Promise<Db> {
  try {
    const parsed = JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ dbFile(), "utf8")) as Partial<Db>;
    return { ...empty(), ...parsed, version: 1 };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw err;
  }
}

/** Write to a temp file then rename, so a crash mid-write never leaves half a JSON file. */
async function write(db: Db) {
  const file = dbFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, file);
}

// All reads and writes go through one queue, so concurrent requests can't overwrite each other.
let queue: Promise<unknown> = Promise.resolve();

export function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const result = fn(db);
    await write(db);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export function readDb(): Promise<Db> {
  const run = queue.then(read);
  queue = run.catch(() => {});
  return run;
}
