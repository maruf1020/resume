import { getIntent } from "@/content/intents";
import { aiEnabled, askCv, type AiTurn } from "@/server/ai";
import { bad, clientKey, consentedVisitor, forbidden, json, limited, newId, overLimit, readJson, recordHit, sameOrigin, str } from "@/server/http";
import { addAiAnswer, type AiAnswerEntry } from "@/server/store";

// 20 free-form questions per 10 minutes per client, and AI_DAILY_LIMIT answered questions per day
// across everyone (the cost cap; failed calls don't count).
const PER_CLIENT = { max: 20, windowMs: 10 * 60_000 };
const DAY_MS = 24 * 60 * 60_000;
const DAILY_KEY = "ai:daily";
const dailyLimit = () => {
  const n = Number(process.env.AI_DAILY_LIMIT ?? 500);
  return Number.isInteger(n) && n > 0 ? n : 500;
};
const MAX_TURNS = 6;

/** The last few turns the browser sends along, trimmed to what the model needs. */
function parseHistory(value: unknown): AiTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: AiTurn[] = [];
  for (const t of value.slice(-MAX_TURNS)) {
    const rec = (t && typeof t === "object" ? t : {}) as Record<string, unknown>;
    const q = str(rec.q, 300);
    const a = str(rec.a, 600);
    if (q && a) turns.push({ q, a });
  }
  return turns;
}

/** Keeps what was asked and answered (a rolling list the inbox shows), without ever failing the request. */
const remember = (entry: Omit<AiAnswerEntry, "createdAt">) => addAiAnswer(entry).catch((err) => console.error("[ask] Could not save:", err));

/**
 * A question none of the curated answers matched. Answers with a curated topic to play, a short AI
 * answer (with cards and follow-ups) or a decline; the browser shows the usual fallback for anything else.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  if (!aiEnabled()) return bad("AI answers are switched off.", 503);
  if (limited(`ask:${clientKey(req)}`, PER_CLIENT.max, PER_CLIENT.windowMs)) return bad("Too many questions at once - please try again in a few minutes.", 429);
  if (overLimit(DAILY_KEY, dailyLimit(), DAY_MS)) return bad("The AI has answered enough for today - please pick a listed question.", 429);
  const body = await readJson(req, 12_000);
  if (!body) return bad("Invalid request.");
  const question = str(body.question, 300);
  if (!question || question.length < 2) return bad("Ask a question first.");
  const history = parseHistory(body.history);
  // Device details only with consent; otherwise just the anonymous visitor id (or nothing).
  const visitor = consentedVisitor(body, req) ?? undefined;

  const id = newId();
  const started = Date.now();
  let outcome: Awaited<ReturnType<typeof askCv>>;
  try {
    outcome = await askCv(question, history);
  } catch (err) {
    console.error("[ask] AI call failed:", err instanceof Error ? `${err.name}: ${err.message}` : err);
    await remember({ id, visitor, question, route: "error", ms: Date.now() - started });
    return bad("Couldn't reach the AI right now - please try a listed question.", 502);
  }
  recordHit(DAILY_KEY, DAY_MS);

  const { result, model, ms } = outcome;
  await remember({
    id,
    visitor,
    question,
    route: result.route,
    intentId: result.route === "topic" ? result.intentId : undefined,
    answer: result.route === "decline" ? undefined : result.text,
    cards: result.route === "answer" ? result.cards.map((c) => (c.kind === "project" ? `project:${c.id}` : c.kind)) : undefined,
    model,
    ms,
  });

  if (result.route === "topic") {
    // The topic's own cards and follow-ups, led by the model's tailored text when the question was specific.
    const topic = getIntent(result.intentId);
    return json({ ok: true, route: "topic", intentId: result.intentId, answerId: id, text: result.text ?? null, cards: topic?.blocks ?? [], suggestedTopics: topic?.followUps ?? [] });
  }
  if (result.route === "answer") return json({ ok: true, route: "answer", answerId: id, text: result.text, cards: result.cards, suggestedTopics: result.suggestedTopics });
  return json({ ok: true, route: "decline" });
}
