"use client";

import { useState } from "react";
import { Check, Loader2, Send, Star } from "lucide-react";
import { postApi } from "@/lib/visitor";
import { cn } from "@/lib/utils";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };

const field =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[16px] outline-none transition-colors placeholder:text-faint focus:border-faint";
const label = "mb-1.5 block text-sm font-semibold";

/** Hidden field real people never fill; bots usually do. */
const Honeypot = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
    <label>
      Website
      <input tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} name="website" />
    </label>
  </div>
);

function Sent({ title, body }: { title: string; body: string }) {
  return (
    <div className="card flex items-start gap-3 p-5 md:p-6" role="status">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <Check className="size-5" />
      </span>
      <div>
        <div className="text-lg font-semibold">{title}</div>
        <p className="mt-1 text-[15px] text-muted">{body}</p>
      </div>
    </div>
  );
}

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "", website: "" });
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ state: "sending" });
    const res = await postApi("/api/contact/", form);
    setStatus(res.ok ? { state: "sent" } : { state: "error", message: res.error ?? "Something went wrong." });
  };

  if (status.state === "sent")
    return <Sent title="Message sent - thank you!" body={`I'll reply to ${form.email} as soon as I can, usually within a day.`} />;

  return (
    <form onSubmit={submit} className="card relative space-y-4 p-5 md:p-6" noValidate>
      <div className="eyebrow">Send me a message</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className={label}>
            Name
          </label>
          <input id="c-name" required maxLength={120} autoComplete="name" value={form.name} onChange={set("name")} className={field} />
        </div>
        <div>
          <label htmlFor="c-email" className={label}>
            Email
          </label>
          <input
            id="c-email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            className={field}
          />
        </div>
      </div>
      <div>
        <label htmlFor="c-company" className={label}>
          Company <span className="font-normal text-faint">(optional)</span>
        </label>
        <input id="c-company" maxLength={160} autoComplete="organization" value={form.company} onChange={set("company")} className={field} />
      </div>
      <div>
        <label htmlFor="c-message" className={label}>
          Message
        </label>
        <textarea
          id="c-message"
          required
          rows={4}
          maxLength={4000}
          value={form.message}
          onChange={set("message")}
          placeholder="A role, a project, or just hello…"
          className={cn(field, "resize-y")}
        />
      </div>
      <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
      {status.state === "error" && (
        <p role="alert" className="text-sm font-medium text-accent">
          {status.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={status.state === "sending"} className="btn btn-primary disabled:opacity-60">
          {status.state === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send message
        </button>
        <span className="text-xs text-faint">Stored privately so I can reply. Never shared.</span>
      </div>
    </form>
  );
}

const ratingLabels = ["Not useful", "Could be better", "OK", "Good", "Loved it"];

export function FeedbackForm() {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [form, setForm] = useState({ message: "", name: "", email: "", website: "" });
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ state: "sending" });
    const res = await postApi("/api/feedback/", { ...form, rating });
    setStatus(res.ok ? { state: "sent" } : { state: "error", message: res.error ?? "Something went wrong." });
  };

  if (status.state === "sent") return <Sent title="Thanks for the feedback!" body="Every note helps me make this site better." />;

  const shown = hover ?? rating;
  return (
    <form onSubmit={submit} className="card relative space-y-4 p-5 md:p-6" noValidate>
      <div className="eyebrow">How was this site?</div>
      <div>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} of 5 - ${ratingLabels[n - 1]}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(rating === n ? null : n)}
              className="grid size-11 place-items-center rounded-xl transition-transform hover:scale-110"
            >
              <Star className={cn("size-7 transition-colors", shown && n <= shown ? "fill-accent text-accent" : "text-faint")} />
            </button>
          ))}
          <span className="ml-2 text-sm font-medium text-muted">{shown ? ratingLabels[shown - 1] : "Tap a star"}</span>
        </div>
      </div>
      <div>
        <label htmlFor="f-message" className={label}>
          What should I keep, change or add?
        </label>
        <textarea id="f-message" rows={3} maxLength={4000} value={form.message} onChange={set("message")} className={cn(field, "resize-y")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-name" className={label}>
            Name <span className="font-normal text-faint">(optional)</span>
          </label>
          <input id="f-name" maxLength={120} autoComplete="name" value={form.name} onChange={set("name")} className={field} />
        </div>
        <div>
          <label htmlFor="f-email" className={label}>
            Email <span className="font-normal text-faint">(optional)</span>
          </label>
          <input id="f-email" type="email" maxLength={200} autoComplete="email" value={form.email} onChange={set("email")} className={field} />
        </div>
      </div>
      <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />
      {status.state === "error" && (
        <p role="alert" className="text-sm font-medium text-accent">
          {status.message}
        </p>
      )}
      <button type="submit" disabled={status.state === "sending"} className="btn btn-primary disabled:opacity-60">
        {status.state === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send feedback
      </button>
    </form>
  );
}
