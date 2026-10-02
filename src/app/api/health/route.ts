import { json } from "@/server/http";
import { checkStoreWritable } from "@/server/store";

export const dynamic = "force-dynamic";

/** For uptime checks and load balancers: 200 when the server can write its data folder. */
export async function GET() {
  try {
    await checkStoreWritable();
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 503);
  }
}
