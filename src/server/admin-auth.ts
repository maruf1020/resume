import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "fb_admin";
export const SESSION_SECONDS = 8 * 60 * 60;

const sha = (s: string) => createHash("sha256").update(s).digest();

/** Constant-time check of the code typed into the chat against FEEDBACK_ADMIN_CODE. */
export function codeMatches(input: string): boolean {
  const expected = process.env.FEEDBACK_ADMIN_CODE;
  if (!expected) return false;
  return timingSafeEqual(sha(input), sha(expected));
}

const signingKey = () => process.env.ADMIN_SESSION_SECRET || process.env.FEEDBACK_ADMIN_CODE || "";
const sign = (payload: string) => createHmac("sha256", signingKey()).update(payload).digest("base64url");

/** Token = "<expiry-unix>.<hmac>". Stateless: nothing to store server-side. */
export function createSessionToken(now = Date.now()): string {
  const exp = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${exp}.${sign(exp)}`;
}

export function isValidSession(token: string | undefined): boolean {
  if (!token || !signingKey()) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac || !/^\d+$/.test(exp)) return false;
  if (Number(exp) * 1000 < Date.now()) return false;
  const expected = Buffer.from(sign(exp));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
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
