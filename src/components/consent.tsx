"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ShieldCheck } from "lucide-react";
import { setConsent, useConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

/** First-visit choice. Rejecting keeps analytics anonymous; nothing about the device is stored. */
export function ConsentBanner({ onLearnMore }: { onLearnMore: () => void }) {
  const consent = useConsent();
  return (
    <AnimatePresence>
      {consent === null && (
        <motion.div
          role="dialog"
          aria-label="Privacy choices"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 top-16 z-50 rounded-2xl border border-line bg-bg/95 p-4 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.3)] backdrop-blur-xl sm:inset-x-auto sm:right-4 sm:w-[23rem]"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <ShieldCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">Your privacy</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                I count visits and questions anonymously. With your OK, I also keep basic device details (browser, screen, timezone, where you came from) so I know who visits. No ads, no third parties.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setConsent("granted")} className="btn btn-primary py-2 text-sm">
              Accept
            </button>
            <button type="button" onClick={() => setConsent("denied")} className="btn btn-ghost py-2 text-sm">
              Reject
            </button>
            <button type="button" onClick={onLearnMore} className="ml-auto text-sm font-semibold text-muted underline-offset-4 hover:text-fg hover:underline">
              How I use data
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shown in the "Privacy" answer: what's stored, and a way to change the choice. */
export function PrivacyChoice() {
  const consent = useConsent();
  const rows = [
    { k: "Always, anonymously", v: "Which pages are opened and which questions are asked - no id, no device details." },
    { k: "Only if you accept", v: "Browser, OS, screen and window size, timezone, language, colour scheme, touch support, the page you came from and campaign link, visit count." },
    { k: "Only if you send it", v: "Messages, feedback and thumbs up/down you choose to send, with the details you type in." },
    { k: "Never", v: "Ads, third-party trackers, selling data, or your IP address." },
  ];
  return (
    <div className="card overflow-hidden">
      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.k} data-gs="row" className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-5 md:px-5">
            <dt className="shrink-0 text-sm font-semibold sm:w-40">{r.k}</dt>
            <dd className="text-[15px] leading-relaxed text-muted">{r.v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-2 border-t border-line p-4 md:px-5">
        <span className="mr-auto text-sm text-muted">
          Your choice: <span className="font-semibold text-fg">{consent === "granted" ? "accepted" : consent === "denied" ? "rejected" : "not set"}</span>
        </span>
        {(["granted", "denied"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setConsent(v)}
            aria-pressed={consent === v}
            className={cn("btn py-2 text-sm", consent === v ? "btn-primary" : "btn-ghost")}
          >
            {consent === v && <Check className="size-4" />}
            {v === "granted" ? "Accept" : "Reject"}
          </button>
        ))}
      </div>
    </div>
  );
}
