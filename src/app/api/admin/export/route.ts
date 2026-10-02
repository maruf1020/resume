import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/server/admin-auth";
import { bad } from "@/server/http";
import { readDbFile } from "@/server/store";

export async function GET() {
  if (!(await isValidSession((await cookies()).get(ADMIN_COOKIE)?.value))) return bad("Not found.", 404);
  let bytes: Buffer | null;
  try {
    bytes = await readDbFile();
  } catch (err) {
    console.error("[export] Could not read the store:", err);
    return bad("Could not read the store right now.", 503);
  }
  // The file exactly as stored, so an export is a faithful backup.
  return new Response(new Uint8Array(bytes ?? Buffer.from('{"version":1,"contacts":[],"feedback":[],"votes":[],"events":[]}')), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="feedback-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
