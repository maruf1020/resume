import { cookies } from "next/headers";
import { codeMatches, createSessionToken, SESSION_SECONDS, sessionCookie } from "@/server/admin-auth";
import { bad, clientKey, json, limited, readJson, str } from "@/server/http";

/** Exchanges the secret code typed into the chat for an httpOnly session cookie. */
export async function POST(req: Request) {
  // 5 tries per 15 minutes per client: brute-forcing the code isn't practical.
  if (limited(`admin:${clientKey(req)}`, 5, 15 * 60_000)) return bad("Too many attempts.", 429);
  const body = await readJson(req, 1_000);
  const code = str(body?.code, 200);
  if (!code || !codeMatches(code)) return json({ ok: false }, 401);
  (await cookies()).set(sessionCookie(createSessionToken(), SESSION_SECONDS));
  return json({ ok: true });
}

export async function DELETE() {
  (await cookies()).set(sessionCookie("", 0));
  return json({ ok: true });
}
