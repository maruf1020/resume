import { getIntent } from "@/content/intents";
import { bad, clientKey, extendedVisitor, forbidden, json, limited, readJson, sameOrigin, str } from "@/server/http";
import { addEvent } from "@/server/store";

/**
 * Analytics. Without consent only {type, intentId, path} is kept - no visitor id, no device details.
 * With consent the visitor's device details are stored too.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  if (limited(`events:${clientKey(req)}`, 120, 10 * 60_000)) return bad("Too many events.", 429);
  const body = await readJson(req, 6_000);
  if (!body) return bad("Invalid request.");
  const type = body.type === "pageview" || body.type === "ask" ? body.type : null;
  if (!type) return bad("Unknown event.");
  const intentId = typeof body.intentId === "string" && (getIntent(body.intentId) || body.intentId === "fallback" || body.intentId === "ai") ? body.intentId : undefined;
  const path = str(body.path, 200);
  const consent = body.consent === true;
  const visitor = consent ? (extendedVisitor(body.visitor, req) ?? undefined) : undefined;

  try {
    await addEvent({ type, intentId, path, consent, visitor });
  } catch (err) {
    console.error("[events] Could not save:", err);
    return bad("Could not save right now.", 503);
  }
  return json({ ok: true }, 201);
}
