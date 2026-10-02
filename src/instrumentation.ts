/** Runs once when the Next.js server starts: warns about production settings that are easy to miss. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { proxyWarning } = await import("@/server/http");
  const warning = proxyWarning();
  if (warning) console.warn(warning);
}
