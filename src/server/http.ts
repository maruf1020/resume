import { randomUUID } from "node:crypto";
import type { VisitorInfo } from "./store";

export const newId = () => randomUUID();

export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

export const bad = (error: string, status = 400) => json({ ok: false, error }, status);

/** Best-effort client key for rate limiting only (never stored). */
export const clientKey = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";

export async function readJson(req: Request, maxBytes = 16_000): Promise<Record<string, unknown> | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

/** Trimmed string within a length limit; undefined when empty. */
export function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.replace(/\u0000/g, "").trim();
  return s ? s.slice(0, max) : undefined;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 200;

export function visitorFrom(value: unknown, req: Request): VisitorInfo | null {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const visitorId = str(v.visitorId, 64);
  if (!visitorId || !/^[a-zA-Z0-9-]{8,64}$/.test(visitorId)) return null;
  return {
    visitorId,
    userAgent: str(req.headers.get("user-agent"), 300),
    language: str(v.language, 40),
    timezone: str(v.timezone, 60),
    referrer: str(v.referrer, 300),
    screen: str(v.screen, 20),
  };
}

/** visitorFrom plus the consent-only details. */
export function extendedVisitor(value: unknown, req: Request) {
  const base = visitorFrom(value, req);
  if (!base) return null;
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const num = (x: unknown, max: number) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= max ? x : undefined);
  return {
    ...base,
    viewport: str(v.viewport, 20),
    platform: str(v.platform, 40),
    pixelRatio: num(v.pixelRatio, 8),
    colorScheme: str(v.colorScheme, 10),
    touch: typeof v.touch === "boolean" ? v.touch : undefined,
    landing: str(v.landing, 200),
    utm: str(v.utm, 200),
    visits: num(v.visits, 100000),
  };
}

// ---------- in-memory rate limiting (per process) ----------
const hits = new Map<string, number[]>();

/** Returns true when the caller is over `max` requests in `windowMs`. */
export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > max;
}
