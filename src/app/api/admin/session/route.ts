import { cookies } from "next/headers";
import { ADMIN_COOKIE, codeMatches, createSessionToken, isValidSession, revokeAllSessions, SESSION_SECONDS, sessionCookie } from "@/server/admin-auth";
import { bad, clientKey, forbidden, json, overLimit, readJson, recordHit, sameOrigin, str } from "@/server/http";

// Only failed attempts count: 5 wrong codes per 15 minutes per client (when clients can be told
// apart, see TRUST_PROXY_HOPS), plus 30 per hour across everyone.
const PER_CLIENT = { max: 5, windowMs: 15 * 60_000 };
const GLOBAL = { key: "admin:global", max: 30, windowMs: 60 * 60_000 };
/** Minimum wait before answering each wrong code sent while over the limit. */
const LIMITED_DELAY_MS = 500;
/** No request waits longer than this, however many others are in line. */
const MAX_WAIT_MS = 2_500;
/** Codes one client may have checked at the same time. More get the 401 unchecked. */
const MAX_IN_FLIGHT_PER_CLIENT = 2;
/** Over-limit codes that may be checked and waiting at once across everyone; more get the 401 unchecked. */
const MAX_WAITING = 16;

// Over-limit wrong codes are answered at most one per LIMITED_DELAY_MS (each takes the next free slot),
// so firing them in parallel doesn't skip the delay. A request whose slot would be later than
// MAX_WAIT_MS gives up its place: it waits MAX_WAIT_MS without taking a slot, so it never pushes back
// anyone else's answer.
const g = globalThis as typeof globalThis & {
  __adminLine?: { nextFree: number; waiting: number; inFlight: Map<string, number> };
};
const line = (g.__adminLine ??= { nextFree: 0, waiting: 0, inFlight: new Map() });

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Waits for this request's slot in line, at least LIMITED_DELAY_MS and at most MAX_WAIT_MS. */
function waitYourTurn(): Promise<void> {
  const now = Date.now();
  const slotEnd = Math.max(now, line.nextFree) + LIMITED_DELAY_MS;
  if (slotEnd - now > MAX_WAIT_MS) return sleep(MAX_WAIT_MS);
  line.nextFree = slotEnd;
  return sleep(slotEnd - now);
}

const releaseClient = (client: string) => {
  const left = (line.inFlight.get(client) ?? 1) - 1;
  if (left > 0) line.inFlight.set(client, left);
  else line.inFlight.delete(client);
};

/**
 * Exchanges the secret code typed into the chat for an httpOnly session cookie.
 * Only wrong or missing codes count towards the limit; a correct code that gets checked always signs
 * in at once. Each client may have at most MAX_IN_FLIGHT_PER_CLIENT codes checked at a time, so a
 * flood of parallel guesses is mostly answered without checking anything. Over the limit, every
 * failure (checked or not) is answered after 500 ms to 2.5 s. Every failure is the same 401 (never 429), so visitors
 * whose text merely looks like a code still get a normal answer, within about 2.5 s.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const body = await readJson(req, 1_000);
  const code = str(body?.code, 200);

  // Without a trusted proxy every visitor shares the "local" key, so only the global limit applies;
  // otherwise five wrong guesses from anyone would slow down everyone's answers.
  const client = clientKey(req);
  const clientLimitKey = client === "local" ? null : `admin:${client}`;
  // Decided before the code is checked, so parallel guesses can't all slip in under the limit.
  const limitedNow =
    (clientLimitKey !== null && overLimit(clientLimitKey, PER_CLIENT.max, PER_CLIENT.windowMs)) ||
    overLimit(GLOBAL.key, GLOBAL.max, GLOBAL.windowMs);
  const busy = (line.inFlight.get(client) ?? 0) >= MAX_IN_FLIGHT_PER_CLIENT || (limitedNow && line.waiting >= MAX_WAITING);
  if (busy) {
    // Turned away unchecked. Over the limit it still takes the usual 500 ms (holding no slot), so
    // every over-limit answer looks the same.
    if (limitedNow) await sleep(LIMITED_DELAY_MS);
    return json({ ok: false }, 401);
  }

  line.inFlight.set(client, (line.inFlight.get(client) ?? 0) + 1);
  if (limitedNow) line.waiting++;
  try {
    if (code && (await codeMatches(code))) {
      const token = await createSessionToken();
      if (!token) return bad("Admin sign-in is not configured.", 503);
      (await cookies()).set(sessionCookie(token, SESSION_SECONDS));
      return json({ ok: true });
    }
    if (clientLimitKey) recordHit(clientLimitKey, PER_CLIENT.windowMs);
    recordHit(GLOBAL.key, GLOBAL.windowMs);
    if (limitedNow) await waitYourTurn();
    return json({ ok: false }, 401);
  } finally {
    releaseClient(client);
    if (limitedNow) line.waiting--;
  }
}

/**
 * Signs out everywhere: clears this cookie and, for a signed-in admin, revokes every session issued
 * so far. Without a valid session it only clears the cookie, so visitors can't sign the owner out.
 */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const jar = await cookies();
  if (await isValidSession(jar.get(ADMIN_COOKIE)?.value)) {
    try {
      await revokeAllSessions();
    } catch (err) {
      console.error("[admin] Could not revoke sessions:", err);
    }
  }
  jar.set(sessionCookie("", 0));
  return json({ ok: true });
}
