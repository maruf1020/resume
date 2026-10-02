"use client";

import { useMemo } from "react";
import { BarChart3, Eye, MessageCircleQuestion, ShieldCheck, Users } from "lucide-react";
import type { Db } from "@/server/store";
import { cn } from "@/lib/utils";

const browserOf = (ua = "") =>
  /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
const osOf = (ua = "") =>
  /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
const sourceOf = (ref?: string, utm?: string) => {
  if (utm) return utm.split("&")[0].replace("source=", "").replace("ref=", "") || "Campaign";
  if (!ref) return "Direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return "Other";
  }
};

function top(values: string[], n = 5) {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function Bars({ title, rows, total, empty }: { title: string; rows: [string, number][]; total: number; empty: string }) {
  return (
    <section className="card p-4 md:p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map(([label, n]) => (
            <li key={label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{label}</span>
                <span className="shrink-0 text-muted tabular-nums">
                  {n} <span className="text-faint">· {Math.round((n / total) * 100)}%</span>
                </span>
              </div>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-strong">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${(n / rows[0][1]) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Analytics({ db, labels }: { db: Db; labels: Record<string, string> }) {
  const data = useMemo(() => {
    const ev = db.events ?? [];
    const views = ev.filter((e) => e.type === "pageview");
    const asks = ev.filter((e) => e.type === "ask");
    const consented = views.filter((e) => e.consent && e.visitor);
    const unique = new Set(ev.filter((e) => e.visitor).map((e) => e.visitor!.visitorId)).size;

    const days: { key: string; label: string; n: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }), n: 0 });
    }
    const byDay = new Map(days.map((d) => [d.key, d]));
    for (const v of views) {
      const day = byDay.get(v.at.slice(0, 10));
      if (day) day.n++;
    }

    return {
      views: views.length,
      asks: asks.length,
      unique,
      consentRate: views.length ? Math.round((consented.length / views.length) * 100) : null,
      days,
      questions: top(asks.map((a) => labels[a.intentId ?? ""] ?? a.intentId ?? "Unknown"), 8),
      browsers: top(consented.map((e) => browserOf(e.visitor!.userAgent))),
      os: top(consented.map((e) => `${osOf(e.visitor!.userAgent)}${e.visitor!.touch ? " (touch)" : ""}`)),
      timezones: top(consented.map((e) => e.visitor!.timezone ?? "Unknown")),
      sources: top(consented.map((e) => sourceOf(e.visitor!.referrer, e.visitor!.utm))),
      consentedCount: consented.length,
    };
  }, [db.events, labels]);

  const maxDay = Math.max(1, ...data.days.map((d) => d.n));
  const kpis = [
    { icon: Eye, label: "Visits", value: data.views, tone: "text-sky-600 dark:text-sky-400 bg-sky-500/12" },
    { icon: MessageCircleQuestion, label: "Questions asked", value: data.asks, tone: "text-accent bg-accent/12" },
    { icon: Users, label: "Known visitors", value: data.unique, tone: "text-violet-600 dark:text-violet-400 bg-violet-500/12" },
    { icon: ShieldCheck, label: "Accepted analytics", value: data.consentRate === null ? "-" : `${data.consentRate}%`, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/12" },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label} className="card flex items-center gap-3 p-4">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", k.tone)}>
              <k.icon className="size-5" />
            </span>
            <span>
              <span className="display block text-2xl tabular-nums">{k.value}</span>
              <span className="text-xs text-muted">{k.label}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="card p-4 md:p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="size-4 text-faint" /> Visits, last 14 days
          </h3>
          <span className="text-xs text-faint">UTC</span>
        </div>
        <div className="mt-4 flex h-36 items-end gap-1.5" role="img" aria-label={`Visits per day: ${data.days.map((d) => `${d.label} ${d.n}`).join(", ")}`}>
          {data.days.map((d) => (
            <div key={d.key} className="group flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.n}`}>
              <span className="mb-1 text-center text-[10px] text-faint opacity-0 transition-opacity group-hover:opacity-100">{d.n}</span>
              <span className={cn("block rounded-md", d.n ? "bg-accent/80 group-hover:bg-accent" : "bg-surface-strong")} style={{ height: `${Math.max(4, (d.n / maxDay) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-faint">
          <span>{data.days[0].label}</span>
          <span>{data.days[data.days.length - 1].label}</span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bars title="Top questions" rows={data.questions} total={Math.max(1, data.asks)} empty="No questions asked yet." />
        <Bars title="Where visitors come from" rows={data.sources} total={Math.max(1, data.consentedCount)} empty="Shown once visitors accept analytics." />
        <Bars title="Browsers" rows={data.browsers} total={Math.max(1, data.consentedCount)} empty="Shown once visitors accept analytics." />
        <Bars title="Devices" rows={data.os} total={Math.max(1, data.consentedCount)} empty="Shown once visitors accept analytics." />
        <Bars title="Timezones" rows={data.timezones} total={Math.max(1, data.consentedCount)} empty="Shown once visitors accept analytics." />
      </div>
      <p className="text-xs text-faint">
        Visits and questions are counted for everyone, anonymously. Device details come only from visitors who accepted analytics.
      </p>
    </div>
  );
}
