"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Copy,
  Download,
  Globe,
  Inbox,
  Languages,
  LogOut,
  Mail,
  MessageSquareHeart,
  MessageSquareText,
  Monitor,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-provider";
import { Analytics } from "./analytics";
import type { Db, VisitorInfo } from "@/server/store";
import { cn, withBase } from "@/lib/utils";

type Props = { db: Db; labels: Record<string, string> };
type Tab = "all" | "messages" | "feedback" | "votes" | "visitors" | "analytics";

type Item = {
  id: string;
  kind: "message" | "feedback" | "vote";
  at: string;
  visitorId: string;
  name?: string;
  email?: string;
  company?: string;
  title: string;
  body: string;
  rating?: number | null;
  value?: "up" | "down";
};

type Visitor = {
  id: string;
  name?: string;
  email?: string;
  company?: string;
  info: VisitorInfo;
  first: string;
  last: string;
  items: Item[];
  /** From analytics events (only for visitors who accepted). */
  views: number;
  asked: string[];
};

// ---------- helpers ----------
const absFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const absolute = (iso: string) => `${absFmt.format(new Date(iso))} UTC`;

const subscribeNow = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};
/** Current minute on the client, null during SSR (so dates render identically on both sides first). */
const useNow = () => useSyncExternalStore(subscribeNow, () => Math.floor(Date.now() / 60_000) * 60_000, () => null);

function ago(iso: string, now: number | null) {
  if (now === null) return absFmt.format(new Date(iso));
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return absFmt.format(new Date(iso)).split(",")[0];
}

function device(ua?: string) {
  if (!ua) return "Unknown device";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  return `${browser} · ${os}${/Mobile/.test(ua) ? " (mobile)" : ""}`;
}

const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (name?: string, fallback = "?") =>
  name
    ? name
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : fallback;

function Avatar({ seed, name, size = 36 }: { seed: string; name?: string; size?: number }) {
  const h = hue(seed);
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full text-[13px] font-semibold"
      style={{ width: size, height: size, background: `hsl(${h} 75% 55% / 0.16)`, color: `hsl(${h} 65% 45%)` }}
    >
      {name ? initials(name) : <Users className="size-4" />}
    </span>
  );
}

function Stars({ n, size = "size-3.5" }: { n: number | null | undefined; size?: string }) {
  if (!n) return <span className="text-xs text-faint">No rating</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(size, i <= n ? "fill-accent text-accent" : "text-surface-strong")} />
      ))}
    </span>
  );
}

const KIND = {
  message: { icon: MessageSquareText, label: "Message", tone: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
  feedback: { icon: MessageSquareHeart, label: "Feedback", tone: "bg-accent/12 text-accent" },
  vote: { icon: ThumbsUp, label: "Vote", tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
} as const;

function KindBadge({ item }: { item: Item }) {
  const k = KIND[item.kind];
  const Icon = item.kind === "vote" && item.value === "down" ? ThumbsDown : k.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", k.tone)}>
      <Icon className="size-3" /> {item.kind === "vote" ? (item.value === "up" ? "Liked" : "Disliked") : k.label}
    </span>
  );
}

// "New since your last visit" - per browser, nothing stored on the server.
const SEEN_KEY = "admin:last-seen";
let seenSnapshot: string | null | undefined;
const readSeen = () => {
  if (seenSnapshot === undefined) {
    try {
      seenSnapshot = localStorage.getItem(SEEN_KEY);
    } catch {
      seenSnapshot = null;
    }
  }
  return seenSnapshot;
};
const noSubscribe = () => () => {};
function useLastSeen() {
  // Server and first client render agree on null; the stored value arrives right after hydration.
  const lastSeen = useSyncExternalStore(noSubscribe, readSeen, () => null);
  useEffect(() => {
    try {
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
  }, []);
  return lastSeen;
}

// ---------- data shaping ----------
function buildItems(db: Db, labels: Record<string, string>): Item[] {
  const named = new Map<string, { name?: string; email?: string; company?: string }>();
  for (const c of db.contacts) named.set(c.visitor.visitorId, { name: c.name, email: c.email, company: c.company });
  for (const f of db.feedback) {
    const n = named.get(f.visitor.visitorId) ?? {};
    named.set(f.visitor.visitorId, { name: n.name ?? f.name, email: n.email ?? f.email, company: n.company });
  }
  const who = (id: string) => named.get(id) ?? {};
  return [
    ...db.contacts.map<Item>((c) => ({ id: c.id, kind: "message", at: c.createdAt, visitorId: c.visitor.visitorId, ...who(c.visitor.visitorId), title: c.company ? `Message · ${c.company}` : "Message", body: c.message })),
    ...db.feedback.map<Item>((f) => ({ id: f.id, kind: "feedback", at: f.createdAt, visitorId: f.visitor.visitorId, ...who(f.visitor.visitorId), title: "Site feedback", body: f.message, rating: f.rating })),
    ...db.votes.map<Item>((v) => ({ id: v.id, kind: "vote", at: v.updatedAt, visitorId: v.visitor.visitorId, ...who(v.visitor.visitorId), title: labels[v.intentId] ?? v.intentId, body: "", value: v.value })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

function buildVisitors(db: Db, items: Item[], labels: Record<string, string>): Visitor[] {
  const infos = new Map<string, VisitorInfo>();
  const known = (db.events ?? []).filter((e) => e.visitor);
  for (const e of [...db.contacts, ...db.feedback, ...db.votes]) infos.set(e.visitor.visitorId, { ...infos.get(e.visitor.visitorId), ...e.visitor });
  for (const e of known) infos.set(e.visitor!.visitorId, { ...infos.get(e.visitor!.visitorId), ...e.visitor! });
  const map = new Map<string, Visitor>();
  const blank = (id: string, at: string): Visitor => ({ id, info: infos.get(id)!, first: at, last: at, items: [], views: 0, asked: [] });
  for (const e of known) {
    const id = e.visitor!.visitorId;
    const v = map.get(id) ?? blank(id, e.at);
    if (e.type === "pageview") v.views++;
    else if (e.intentId) v.asked.push(labels[e.intentId] ?? e.intentId);
    if (e.at < v.first) v.first = e.at;
    if (e.at > v.last) v.last = e.at;
    map.set(id, v);
  }
  for (const it of items) {
    const v = map.get(it.visitorId) ?? blank(it.visitorId, it.at);
    v.items.push(it);
    if (it.at < v.first) v.first = it.at;
    if (it.at > v.last) v.last = it.at;
    v.name ??= it.name;
    v.email ??= it.email;
    v.company ??= it.company;
    map.set(it.visitorId, v);
  }
  return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
}

// ---------- page ----------
export function AdminDashboard({ db, labels }: Props) {
  const now = useNow();
  const lastSeen = useLastSeen();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => buildItems(db, labels), [db, labels]);
  const visitors = useMemo(() => buildVisitors(db, items, labels), [db, items, labels]);
  const byVisitor = useMemo(() => new Map(visitors.map((v) => [v.id, v])), [visitors]);

  const needle = q.trim().toLowerCase();
  const match = (...parts: (string | undefined | null)[]) => !needle || parts.some((p) => p?.toLowerCase().includes(needle));

  const listItems = items.filter(
    (i) => (tab === "all" || (tab === "messages" && i.kind === "message") || (tab === "feedback" && i.kind === "feedback") || (tab === "votes" && i.kind === "vote")) && match(i.name, i.email, i.company, i.title, i.body),
  );
  const listVisitors = visitors.filter((v) => match(v.name, v.email, v.company, v.id, ...v.items.map((i) => i.body + i.title)));

  // Keyboard: "/" focuses search, Esc clears selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const up = db.votes.filter((v) => v.value === "up").length;
  const ratings = db.feedback.map((f) => f.rating).filter((r): r is number => !!r);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const upPct = db.votes.length ? Math.round((up / db.votes.length) * 100) : null;
  const newCount = lastSeen ? items.filter((i) => i.at > lastSeen).length : items.length;

  const signOut = async () => {
    await fetch(withBase("/api/admin/session/"), { method: "DELETE" }).catch(() => {});
    window.location.assign(withBase("/"));
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All activity", count: items.length },
    { id: "messages", label: "Messages", count: db.contacts.length },
    { id: "feedback", label: "Feedback", count: db.feedback.length },
    { id: "votes", label: "Votes", count: db.votes.length },
    { id: "visitors", label: "Visitors", count: visitors.length },
    { id: "analytics", label: "Analytics", count: (db.events ?? []).filter((e) => e.type === "pageview").length },
  ];

  const selectedItem = tab !== "visitors" ? items.find((i) => i.id === selected) : undefined;
  const selectedVisitor = tab === "visitors" ? byVisitor.get(selected ?? "") : selectedItem ? byVisitor.get(selectedItem.visitorId) : undefined;
  const hasDetail = !!(selectedItem || selectedVisitor);

  return (
    <div className="flex min-h-dvh flex-col bg-bg-soft">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6">
          <Link href="/" className="icon-btn" aria-label="Back to site">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-fg text-bg">
              <Inbox className="size-4" />
            </span>
            <div className="leading-tight">
              <h1 className="text-[15px] font-semibold tracking-tight whitespace-nowrap">Feedback inbox</h1>
              <p className="hidden text-xs text-muted sm:block">{newCount > 0 ? `${newCount} new since your last visit` : "You're all caught up"}</p>
            </div>
            <span className="eyebrow ml-1 hidden rounded-md border border-line px-1.5 py-0.5 sm:inline">Private</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <a href={withBase("/api/admin/export/")} className="btn btn-ghost py-2 text-sm" aria-label="Export JSON">
              <Download className="size-4" /> <span className="hidden sm:inline">Export</span>
            </a>
            <button type="button" onClick={signOut} className="btn btn-primary py-2 text-sm" aria-label="Sign out">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 md:px-6 md:py-6">
        {/* Stats */}
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={MessageSquareText} tone="text-sky-600 dark:text-sky-400 bg-sky-500/12" label="Messages" value={db.contacts.length} hint={db.contacts.length ? `Latest ${ago(db.contacts.at(-1)!.createdAt, now)}` : "None yet"} />
          <StatCard
            icon={MessageSquareHeart}
            tone="text-accent bg-accent/12"
            label="Feedback"
            value={db.feedback.length}
            hint={avg !== null ? <span className="inline-flex items-center gap-1.5"><Stars n={Math.round(avg)} size="size-3" /> {avg.toFixed(1)} avg</span> : "No ratings yet"}
          />
          <StatCard
            icon={ThumbsUp}
            tone="text-emerald-600 dark:text-emerald-400 bg-emerald-500/12"
            label="Answer votes"
            value={upPct !== null ? `${upPct}%` : "-"}
            hint={
              db.votes.length ? (
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-strong">
                    <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${upPct}%` }} />
                  </span>
                  {up} up · {db.votes.length - up} down
                </span>
              ) : (
                "No votes yet"
              )
            }
          />
          <StatCard icon={Users} tone="text-violet-600 dark:text-violet-400 bg-violet-500/12" label="Visitors who interacted" value={visitors.length} hint={visitors[0] ? `Last active ${ago(visitors[0].last, now)}` : "No one yet"} />
        </ul>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div role="tablist" aria-label="Filter" className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-line bg-bg p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => {
                  setTab(t.id);
                  setSelected(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-muted transition-colors hover:text-fg",
                  tab === t.id && "bg-surface text-fg shadow-sm",
                )}
              >
                {t.label}
                <span className={cn("rounded-md px-1.5 text-xs tabular-nums", tab === t.id ? "bg-bg text-fg" : "bg-surface text-faint")}>{t.count}</span>
              </button>
            ))}
          </div>
          <label className="relative md:ml-auto md:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people, emails, messages…"
              aria-label="Search"
              className="w-full rounded-xl border border-line bg-bg py-2.5 pr-10 pl-10 text-sm outline-none transition-colors placeholder:text-faint focus:border-faint"
            />
            <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[11px] text-faint">/</kbd>
          </label>
        </div>

        {tab === "analytics" ? (
          <div className="overflow-hidden rounded-2xl border border-line bg-bg">
            <Analytics db={db} labels={labels} />
          </div>
        ) : (
        /* Two panes */
        <div className="grid min-h-[28rem] flex-1 overflow-hidden rounded-2xl border border-line bg-bg lg:grid-cols-[minmax(20rem,26rem)_1fr]">
          {/* List */}
          <div className={cn("min-h-0 border-line lg:border-r", hasDetail && "hidden lg:block")}>
            {tab === "votes" ? (
              <VotesTable db={db} labels={labels} query={needle} />
            ) : tab === "visitors" ? (
              <ul className="divide-y divide-line">
                {listVisitors.length === 0 && <Empty query={needle} />}
                {listVisitors.map((v) => (
                  <li key={v.id}>
                    <button type="button" onClick={() => setSelected(v.id)} className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-soft", selected === v.id && "bg-surface")}>
                      <Avatar seed={v.id} name={v.name} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold">{v.name ?? "Anonymous visitor"}</span>
                          <span className="shrink-0 text-xs text-faint" title={absolute(v.last)}>
                            {ago(v.last, now)}
                          </span>
                        </span>
                        <span className="block truncate text-sm text-muted">
                          {v.email ?? device(v.info.userAgent)} · {v.items.length ? `${v.items.length} ${v.items.length === 1 ? "action" : "actions"}` : `${v.views} ${v.views === 1 ? "visit" : "visits"}, ${v.asked.length} questions`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="divide-y divide-line">
                {listItems.length === 0 && <Empty query={needle} />}
                {listItems.map((it) => {
                  const isNew = lastSeen ? it.at > lastSeen : false;
                  return (
                    <li key={it.id}>
                      <button type="button" onClick={() => setSelected(it.id)} className={cn("flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-soft", selected === it.id && "bg-surface")}>
                        <Avatar seed={it.visitorId} name={it.name} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-2">
                              {isNew && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="New" />}
                              <span className="truncate font-semibold">{it.name ?? "Anonymous visitor"}</span>
                            </span>
                            <span className="shrink-0 text-xs text-faint" title={absolute(it.at)}>
                              {ago(it.at, now)}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-2">
                            <KindBadge item={it} />
                            {it.kind === "feedback" && <Stars n={it.rating} size="size-3" />}
                            <span className="truncate text-sm text-muted">{it.kind === "vote" ? `"${it.title}"` : it.body || it.title}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Detail */}
          <div className={cn("min-h-0", !hasDetail && "hidden lg:block")}>
            {hasDetail && selectedVisitor ? (
              <Detail item={selectedItem} visitor={selectedVisitor} now={now} onBack={() => setSelected(null)} onPick={(id) => { setTab("all"); setSelected(id); }} />
            ) : (
              <div className="grid h-full place-items-center p-10 text-center">
                <div>
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface text-faint">
                    <Inbox className="size-6" />
                  </span>
                  <p className="mt-4 font-semibold">{tab === "votes" ? "Votes by answer" : "Select an item"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {tab === "votes" ? "See which answers visitors liked and which missed." : "Pick something on the left to see the person, their details and everything they did."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; tone: string; label: string; value: React.ReactNode; hint: React.ReactNode }) {
  return (
    <li className="card flex flex-col gap-3 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", tone)}>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="display text-3xl tabular-nums md:text-[2rem]">{value}</div>
      <div className="text-xs text-muted">{hint}</div>
    </li>
  );
}

function Empty({ query }: { query: string }) {
  return (
    <li className="px-6 py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface text-faint">
        <Search className="size-5" />
      </span>
      <p className="mt-3 font-semibold">{query ? "No matches" : "Nothing here yet"}</p>
      <p className="mt-1 text-sm text-muted">{query ? "Try a different name, email or word." : "New messages, feedback and votes will show up here."}</p>
    </li>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="btn btn-ghost py-2 text-sm"
      aria-label={label}
    >
      {done ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />} {done ? "Copied" : "Copy email"}
    </button>
  );
}

function Detail({ item, visitor, now, onBack, onPick }: { item?: Item; visitor: Visitor; now: number | null; onBack: () => void; onPick: (id: string) => void }) {
  const chips = [
    { icon: Monitor, v: device(visitor.info.userAgent) },
    { icon: Timer, v: visitor.info.timezone },
    { icon: Languages, v: visitor.info.language },
    { icon: Monitor, v: visitor.info.screen && `Screen ${visitor.info.screen}` },
    { icon: Globe, v: visitor.info.referrer && `From ${visitor.info.referrer.replace(/^https?:\/\//, "").slice(0, 40)}` },
    { icon: Monitor, v: visitor.info.viewport && `Window ${visitor.info.viewport}` },
    { icon: Monitor, v: visitor.info.platform && `Platform ${visitor.info.platform}` },
    { icon: Monitor, v: visitor.info.colorScheme && `${visitor.info.colorScheme} mode` },
    { icon: Monitor, v: visitor.info.touch !== undefined && (visitor.info.touch ? "Touch screen" : "Mouse / trackpad") },
    { icon: Globe, v: visitor.info.utm && `Campaign ${visitor.info.utm}` },
    { icon: Globe, v: visitor.info.landing && `Landed on ${visitor.info.landing}` },
    { icon: Users, v: visitor.info.visits && `${visitor.info.visits} ${visitor.info.visits === 1 ? "visit" : "visits"}` },
  ].filter((c) => c.v);

  const subject = encodeURIComponent(item?.kind === "message" ? "Re: your message" : "Thanks for your feedback");
  const quoted = item?.body ? encodeURIComponent(`\n\n---\nOn ${absolute(item.at)} you wrote:\n> ${item.body.split("\n").join("\n> ")}`) : "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3 lg:hidden">
        <button type="button" onClick={onBack} className="btn btn-ghost py-1.5 text-sm">
          <ChevronLeft className="size-4" /> Back
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-5 md:p-7">
        {/* Person */}
        <div className="flex flex-wrap items-start gap-4">
          <Avatar seed={visitor.id} name={visitor.name} size={52} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight">{visitor.name ?? "Anonymous visitor"}</h2>
            <p className="truncate text-sm text-muted">
              {[visitor.email, visitor.company].filter(Boolean).join(" · ") || `Visitor ${visitor.id.slice(0, 8)}`}
            </p>
            <p className="mt-0.5 text-xs text-faint">
              First seen {absolute(visitor.first)} · last active {ago(visitor.last, now)}
            </p>
          </div>
          {visitor.email && (
            <div className="flex flex-wrap gap-2">
              <a href={`mailto:${visitor.email}?subject=${subject}&body=${quoted}`} className="btn btn-primary py-2 text-sm">
                <Mail className="size-4" /> Reply
              </a>
              <CopyButton value={visitor.email} label={`Copy ${visitor.email}`} />
            </div>
          )}
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {chips.map((c, i) => (
              <li key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs text-muted">
                <c.icon className="size-3.5 text-faint" /> {c.v}
              </li>
            ))}
          </ul>
        )}

        {/* Selected item */}
        {item && (
          <section className="rounded-2xl border border-line bg-bg-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KindBadge item={item} />
                <span className="text-sm font-semibold">{item.kind === "vote" ? `on "${item.title}"` : item.title}</span>
                {item.kind === "feedback" && <Stars n={item.rating} />}
              </div>
              <span className="text-xs text-faint">{absolute(item.at)}</span>
            </div>
            {item.body ? (
              <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">{item.body}</p>
            ) : (
              <p className="mt-3 text-sm text-muted">{item.kind === "vote" ? `${item.value === "up" ? "Found this answer helpful." : "Felt this answer missed the mark."}` : "No comment left."}</p>
            )}
          </section>
        )}

        {(visitor.views > 0 || visitor.asked.length > 0) && (
          <section className="rounded-2xl border border-line p-5">
            <h3 className="eyebrow mb-2">Browsing</h3>
            <p className="text-sm text-muted">
              {visitor.views} {visitor.views === 1 ? "visit" : "visits"} · {visitor.asked.length} {visitor.asked.length === 1 ? "question" : "questions"} asked
            </p>
            {visitor.asked.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {[...new Set(visitor.asked)].map((q) => (
                  <li key={q} className="tag">
                    {q}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Timeline */}
        <section>
          <h3 className="eyebrow mb-3">Activity · {visitor.items.length}</h3>
          <ol className="relative space-y-1 border-l border-line pl-5">
            {visitor.items.map((it) => (
              <li key={it.id} className="relative">
                <span className={cn("absolute top-3.5 -left-[25px] size-2 rounded-full ring-4 ring-bg", it.id === item?.id ? "bg-accent" : "bg-surface-strong")} />
                <button type="button" onClick={() => onPick(it.id)} className={cn("w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-bg-soft", it.id === item?.id && "bg-bg-soft")}>
                  <span className="flex flex-wrap items-center gap-2">
                    <KindBadge item={it} />
                    <span className="truncate text-sm font-medium">{it.kind === "vote" ? `"${it.title}"` : it.title}</span>
                    <span className="ml-auto text-xs text-faint" title={absolute(it.at)}>
                      {ago(it.at, now)}
                    </span>
                  </span>
                  {it.body && <span className="mt-1 line-clamp-2 block text-sm text-muted">{it.body}</span>}
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function VotesTable({ db, labels, query }: { db: Db; labels: Record<string, string>; query: string }) {
  const rows = useMemo(() => {
    const m = new Map<string, { up: number; down: number }>();
    for (const v of db.votes) {
      const r = m.get(v.intentId) ?? { up: 0, down: 0 };
      r[v.value]++;
      m.set(v.intentId, r);
    }
    return [...m.entries()].map(([id, r]) => ({ id, label: labels[id] ?? id, ...r, total: r.up + r.down })).sort((a, b) => b.total - a.total);
  }, [db.votes, labels]);
  const shown = rows.filter((r) => !query || r.label.toLowerCase().includes(query));
  if (!shown.length) return <ul><Empty query={query} /></ul>;
  return (
    <ul className="divide-y divide-line">
      {shown.map((r) => {
        const pct = Math.round((r.up / r.total) * 100);
        return (
          <li key={r.id} className="px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-semibold">{r.label}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">{pct}%</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-strong" aria-label={`${pct}% positive`}>
                <span className={cn("block h-full rounded-full", pct >= 50 ? "bg-emerald-500" : "bg-accent")} style={{ width: `${pct}%` }} />
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted tabular-nums">
                <ThumbsUp className="size-3.5" /> {r.up}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted tabular-nums">
                <ThumbsDown className="size-3.5" /> {r.down}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
