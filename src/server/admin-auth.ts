import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { bumpSetting, getSetting } from "./store";

export const ADMIN_COOKIE = "fb_admin";
export const SESSION_SECONDS = 2 * 60 * 60;

const sha = (s: string) => createHash("sha256").update(s).digest();

// ---------- the access code ----------

/**
 * FEEDBACK_ADMIN_CODE_HASH = "scrypt:N:r:p:<salt>:<hash>" with base64url salt and hash (made by
 * `npm run admin:hash`). The older "scrypt$N$r$p$salt$hash" form with standard base64 is still read.
 * Returns null when it is missing or malformed.
 */
function parseHash(value: string | undefined) {
  const parts = value?.trim().split(/[:$]/);
  if (!parts || parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [, n, r, p, saltB64, hashB64] = parts;
  const b64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
  if (!b64.test(saltB64) || !b64.test(hashB64)) return null;
  const N = Number(n);
  const rr = Number(r);
  const pp = Number(p);
  // Node's base64 decoder reads both alphabets (+/ and -_), so old and new values decode the same way.
  const salt = Buffer.from(saltB64, "base64");
  const hash = Buffer.from(hashB64, "base64");
  const powerOfTwo = Number.isInteger(N) && N >= 1024 && N <= 2 ** 20 && (N & (N - 1)) === 0;
  if (!powerOfTwo || !Number.isInteger(rr) || rr < 1 || rr > 32 || !Number.isInteger(pp) || pp < 1 || pp > 16) return null;
  if (salt.length < 16 || hash.length < 32) return null;
  return { N, r: rr, p: pp, salt, hash };
}

/**
 * The sample values from .env.example. They are public, so they never work: a copied example code
 * never signs in, and a copied example secret counts as missing (anyone could forge cookies with it).
 */
const PLACEHOLDER_CODES = new Set(["Change-me-to-a-long-code-42"]);
const PLACEHOLDER_SECRETS = new Set(["generate-a-random-string-of-at-least-32-characters"]);

const warned = new Set<string>();
/** Logs a configuration problem once per process (never the value itself). */
function warnOnce(id: string, message: string) {
  if (warned.has(id)) return;
  warned.add(id);
  console.error(message);
}

/** At most this many scrypt checks run at once, so a flood of guesses can't tie up the thread pool. */
const MAX_HASHING = 4;
/** At most this many checks wait for a slot; more are refused at once, so a flood can't build a long line. */
const MAX_HASH_QUEUE = 16;
const hashing = { active: 0, queue: [] as (() => void)[] };

/**
 * Runs one scrypt check when a slot is free; later requests wait in line (in order) for a slot.
 * Returns null without running it when the line is already full.
 */
async function withHashSlot<T>(run: () => Promise<T>): Promise<T | null> {
  if (hashing.active >= MAX_HASHING) {
    if (hashing.queue.length >= MAX_HASH_QUEUE) return null;
    await new Promise<void>((resolve) => hashing.queue.push(resolve));
  } else hashing.active++;
  try {
    return await run();
  } finally {
    // Hand the slot straight to the next request in line, or free it.
    const next = hashing.queue.shift();
    if (next) next();
    else hashing.active--;
  }
}

function scryptAsync(input: string, h: NonNullable<ReturnType<typeof parseHash>>): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(input, h.salt, h.hash.length, { N: h.N, r: h.r, p: h.p, maxmem: 256 * h.N * h.r + 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

/**
 * Checks the code typed into the chat. Uses FEEDBACK_ADMIN_CODE_HASH when set (scrypt, off the main
 * thread, at most MAX_HASHING at once and MAX_HASH_QUEUE waiting; when the line is full it returns
 * false without checking), otherwise the plain FEEDBACK_ADMIN_CODE (kept for backward
 * compatibility). Both comparisons are constant-time. The .env.example sample code never matches.
 */
export async function codeMatches(input: string): Promise<boolean> {
  const hashEnv = process.env.FEEDBACK_ADMIN_CODE_HASH;
  if (hashEnv) {
    const h = parseHash(hashEnv);
    if (!h) {
      warnOnce("bad-hash", "[admin] FEEDBACK_ADMIN_CODE_HASH is malformed; admin sign-in is disabled.");
      return false;
    }
    try {
      const got = await withHashSlot(() => scryptAsync(input, h));
      // A full line means a flood is running: the code is not checked and the caller answers 401.
      return got !== null && timingSafeEqual(got, h.hash);
    } catch (err) {
      warnOnce("scrypt", `[admin] Could not check the admin code hash: ${(err as Error).message}`);
      return false;
    }
  }
  const expected = process.env.FEEDBACK_ADMIN_CODE;
  if (!expected) return false;
  if (PLACEHOLDER_CODES.has(expected.trim())) {
    warnOnce("placeholder-code", "[admin] FEEDBACK_ADMIN_CODE is still the .env.example sample; admin sign-in is disabled until you set your own code.");
    return false;
  }
  return timingSafeEqual(sha(input), sha(expected));
}

// ---------- session signing ----------

const g = globalThis as typeof globalThis & { __adminDevKey?: string; __adminKeyWarned?: boolean };

/**
 * The HMAC key for session cookies. ADMIN_SESSION_SECRET must be at least 32 characters and not the
 * .env.example sample. In production no sessions are issued or accepted without it. In development a
 * random per-process key is used instead, so sessions just end when the dev server restarts.
 */
function signingKey(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const placeholder = PLACEHOLDER_SECRETS.has(secret.trim());
  if (secret.length >= 32 && !placeholder) return secret;
  if (!g.__adminKeyWarned) {
    g.__adminKeyWarned = true;
    const problem = placeholder ? "is still the .env.example sample" : "is missing or shorter than 32 characters";
    console.error(
      process.env.NODE_ENV === "production"
        ? `[admin] ADMIN_SESSION_SECRET ${problem}; admin sessions are disabled.`
        : `[admin] ADMIN_SESSION_SECRET ${problem}; using a temporary key for this dev server.`,
    );
  }
  if (process.env.NODE_ENV === "production") return null;
  return (g.__adminDevKey ??= randomBytes(32).toString("hex"));
}

const sign = (key: string, payload: string) => createHmac("sha256", key).update(payload).digest("base64url");

// ---------- session epoch (sign-out revokes every session) ----------

const EPOCH_KEY = "admin_epoch";

/** Read from the database each time (admin requests only), so a sign-out counts on every instance. */
async function readEpoch(): Promise<number> {
  const value = Number(await getSetting(EPOCH_KEY));
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

/** Invalidates every session issued so far. */
export async function revokeAllSessions(): Promise<void> {
  await bumpSetting(EPOCH_KEY);
}

/** Token = "<expiry-unix>.<epoch>.<hmac>". Signing out bumps the epoch, so older tokens stop working. */
export async function createSessionToken(now = Date.now()): Promise<string | null> {
  const key = signingKey();
  if (!key) return null;
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${await readEpoch()}`;
  return `${payload}.${sign(key, payload)}`;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  const key = signingKey();
  if (!token || !key) return false;
  const [exp, epoch, mac, ...rest] = token.split(".");
  if (rest.length || !exp || !epoch || !mac || !/^\d+$/.test(exp) || !/^\d+$/.test(epoch)) return false;
  if (Number(exp) * 1000 < Date.now()) return false;
  const expected = Buffer.from(sign(key, `${exp}.${epoch}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    return Number(epoch) === (await readEpoch());
  } catch (err) {
    console.error("[admin] Could not read the session epoch:", err);
    return false;
  }
}

export const sessionCookie = (value: string, maxAge: number) => ({
  name: ADMIN_COOKIE,
  value,
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production" && process.env.ADMIN_COOKIE_INSECURE !== "1",
  path: "/",
  maxAge,
});
