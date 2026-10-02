import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidSession } from "@/server/admin-auth";
import { bad } from "@/server/http";
import { readDb } from "@/server/store";

export async function GET() {
  if (!isValidSession((await cookies()).get(ADMIN_COOKIE)?.value)) return bad("Not found.", 404);
  const db = await readDb();
  return new Response(JSON.stringify(db, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="feedback-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
