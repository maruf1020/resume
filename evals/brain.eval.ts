import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

/**
 * AI eval: asks a persona the questions in evals/<persona>.json with the real model and prints, per
 * question, what came back, plus pass rate, latency (p50/p95), tokens and the share of the prompt
 * served from Gemini's cache (the stable prompt prefix should make that high).
 *
 *   npm run eval                               the job persona (from the code, or the live version)
 *   EVAL_PERSONA=marriage npm run eval         a published persona (reads its live version; needs DATABASE_URL)
 *   EVAL_DOC=draft.json EVAL_PERSONA=marriage   a persona document from a file (the Studio's JSON tab)
 *
 * Needs GEMINI_API_KEY (read from the environment, else from .env.local). It fails only on a privacy
 * leak; other misses are listed for you to judge (model answers vary a little from run to run).
 * Results are also written to evals/results/ (git-ignored).
 */

type Tier = "public" | "unlocked";
type Case = { q: string; tier?: Tier; expect: { route?: "topic" | "answer" | "gated" | "decline"; intentIdIn?: string[]; mustInclude?: string[]; mustNotInclude?: string[] } };

const root = path.resolve(import.meta.dirname, "..");

// Fill in what the shell didn't set from .env.local (the shell always wins).
const envFile = path.join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

const pct = (sorted: number[], p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0);

it("answers the eval questions without leaking anything", async () => {
  const { aiEnabled } = await import("@/server/brain/model");
  if (!aiEnabled()) {
    process.stdout.write("[eval] GEMINI_API_KEY is not set: nothing to evaluate.\n");
    return;
  }
  const { PersonaDocSchema } = await import("@/lib/persona/schema");
  const { compilePersona } = await import("@/server/persona/compile");
  const { jobPersonaDoc } = await import("@/server/persona/import-job");
  const { answerQuestion } = await import("@/server/brain/answer");
  const { compileBrain } = await import("@/server/brain/compile");
  const { findLeak } = await import("@/server/brain/leak");
  const { judgeGolden } = await import("@/server/brain/checks");
  const { forbiddenIn } = await import("@/test/forbidden");

  const slug = process.env.EVAL_PERSONA?.trim() || "job";
  let doc;
  if (process.env.EVAL_DOC) doc = PersonaDocSchema.parse(JSON.parse(readFileSync(process.env.EVAL_DOC, "utf8")));
  else if (process.env.DATABASE_URL?.trim()) {
    const { query } = await import("@/server/db");
    const { rows } = await query<{ doc: unknown }>("SELECT v.doc FROM personas p JOIN persona_versions v ON v.id = p.published_version_id WHERE p.slug = $1", [slug]);
    if (rows[0]) doc = PersonaDocSchema.parse(rows[0].doc);
    else if (slug === "job") doc = jobPersonaDoc();
    else throw new Error(`"${slug}" has no published version.`);
  } else if (slug === "job") doc = jobPersonaDoc();
  else throw new Error(`Set DATABASE_URL (to read the live "${slug}") or EVAL_DOC (a persona JSON file).`);

  const casesFile = path.join(root, "evals", `${slug}.json`);
  const cases: Case[] = existsSync(casesFile) ? JSON.parse(readFileSync(casesFile, "utf8")) : [];
  // The owner's own test questions from the Studio run too.
  for (const c of doc.checks) cases.push({ q: c.q, tier: c.tier, expect: c.expect });
  if (!cases.length) throw new Error(`No questions: add evals/${slug}.json or test questions in the Studio.`);

  const compiled = compilePersona(slug, doc);
  const brain = compileBrain(compiled);
  const rows: { q: string; tier: Tier; route: string; ok: boolean; note: string; ms: number; input: number; output: number; cached: number; leak: boolean }[] = [];
  for (const c of cases) {
    const tier = c.tier ?? "public";
    try {
      const { result, meta } = await answerQuestion({ compiled, tier, question: c.q, history: [] });
      const text = result.route === "answer" || result.route === "topic" ? (result.text ?? "") : "";
      const leak = !!findLeak(text, (tier === "unlocked" ? brain.unlocked : brain.public).leakTerms);
      // Names the owner may never use (info/forbidden-terms.txt) count as misses in every answer.
      const problems = [...judgeGolden(result, c.expect, leak), ...forbiddenIn(text).map((t) => `names "${t}"`)];
      rows.push({ q: c.q, tier, route: result.route === "topic" ? `topic:${result.intentId}` : result.route, ok: !problems.length, note: problems.join("; "), ms: meta.ms, input: meta.usage?.input ?? 0, output: meta.usage?.output ?? 0, cached: meta.usage?.cached ?? 0, leak });
    } catch (err) {
      rows.push({ q: c.q, tier, route: "error", ok: false, note: err instanceof Error ? err.message : String(err), ms: 0, input: 0, output: 0, cached: 0, leak: false });
    }
  }

  const ms = rows.map((r) => r.ms).filter(Boolean).sort((a, b) => a - b);
  const input = rows.reduce((n, r) => n + r.input, 0);
  const cached = rows.reduce((n, r) => n + r.cached, 0);
  const summary = {
    persona: slug,
    passed: rows.filter((r) => r.ok).length,
    total: rows.length,
    leaks: rows.filter((r) => r.leak).length,
    p50ms: pct(ms, 50),
    p95ms: pct(ms, 95),
    avgInputTokens: rows.length ? Math.round(input / rows.length) : 0,
    cachedShare: input ? Math.round((cached / input) * 100) : 0,
  };
  process.stdout.write(
    rows
      .map((r) => `${r.ok ? "ok  " : "MISS"} [${r.tier === "unlocked" ? "code" : "anyone"}] ${r.q.slice(0, 70).padEnd(70)} -> ${r.route.padEnd(22)} ${String(r.ms).padStart(5)} ms${r.note ? `  (${r.note})` : ""}`)
      .join("\n") + "\n",
  );
  process.stdout.write(
    `\n${summary.passed}/${summary.total} as expected, ${summary.leaks} leaks. Latency p50 ${summary.p50ms} ms, p95 ${summary.p95ms} ms. ` +
      `About ${summary.avgInputTokens} input tokens per question, ${summary.cachedShare}% served from the cache.\n\n`,
  );
  mkdirSync(path.join(root, "evals", "results"), { recursive: true });
  writeFileSync(path.join(root, "evals", "results", `${slug}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`), JSON.stringify({ summary, rows }, null, 2));
  expect(summary.leaks).toBe(0);
});
