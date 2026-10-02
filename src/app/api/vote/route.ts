import { getIntent } from "@/content/intents";
import { bad, clientKey, consentedVisitor, forbidden, json, limited, newId, readJson, sameOrigin } from "@/server/http";
import { MAX_ENTRIES, mutate } from "@/server/store";

/** One vote per visitor per answer wording. value null removes the vote. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  if (limited(`vote:${clientKey(req)}`, 60, 10 * 60_000)) return bad("Too many votes.", 429);
  const body = await readJson(req, 4_000);
  if (!body) return bad("Invalid request.");
  // Device details only with consent; otherwise just the anonymous visitor id.
  const visitor = consentedVisitor(body, req);
  const intentId = typeof body.intentId === "string" ? body.intentId : "";
  const variant = typeof body.variant === "number" && Number.isInteger(body.variant) && body.variant >= 0 && body.variant < 100 ? body.variant : -1;
  const value = body.value === "up" || body.value === "down" ? body.value : body.value === null ? null : undefined;
  if (!visitor) return bad("Missing visitor id.");
  if (!getIntent(intentId) && intentId !== "fallback") return bad("Unknown answer.");
  if (variant < 0 || value === undefined) return bad("Invalid vote.");

  let result: boolean;
  try {
    result = await mutate((db) => {
      const i = db.votes.findIndex((v) => v.visitor?.visitorId === visitor.visitorId && v.intentId === intentId && v.variant === variant);
      const now = new Date().toISOString();
      if (value === null) {
        if (i >= 0) db.votes.splice(i, 1);
        return true;
      }
      if (i >= 0) {
        db.votes[i] = { ...db.votes[i], value, visitor, updatedAt: now };
        return true;
      }
      if (db.votes.length >= MAX_ENTRIES) return false;
      db.votes.push({ id: newId(), createdAt: now, updatedAt: now, visitor, intentId, variant, value });
      return true;
    });
  } catch (err) {
    console.error("[vote] Could not save:", err);
    return bad("Could not save right now.", 503);
  }
  return result ? json({ ok: true, value }) : bad("Vote store is full.", 507);
}
