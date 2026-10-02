"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatedBlocks } from "@/components/blocks/animated-blocks";
import { BlockView } from "@/components/blocks/blocks";
import { fallbackIntent, getIntent } from "@/content/intents";
import type { AssistantMessage as AssistantMsg, Phase } from "@/lib/chat";
import { cn, plain } from "@/lib/utils";
import { postApi, readVotes, rememberVote } from "@/lib/visitor";
import { RichText } from "./rich-text";
import { SuggestionChips } from "./suggestion-chips";

export function UserMessage({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex justify-end"
    >
      <p className="max-w-[85%] rounded-[1.6rem] rounded-br-lg bg-surface px-5 py-3 text-[17px] leading-snug font-medium md:text-lg">
        {text}
      </p>
    </motion.div>
  );
}

export function AssistantAvatar() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-[0.7rem] bg-fg text-[15px] font-bold text-bg md:size-9">
      <span aria-hidden="true">M</span>
      <span className="sr-only">Maruf&apos;s assistant:</span>
    </span>
  );
}

type Props = {
  msg: AssistantMsg;
  isLast: boolean;
  onPhase: (id: string, phase: Phase) => void;
  onAsk: (intentId: string) => void;
  onRegenerate: (id: string) => void;
};

export function AssistantMessage({ msg, isLast, onPhase, onAsk, onRegenerate }: Props) {
  const intent = getIntent(msg.intentId) ?? fallbackIntent;
  const text = intent.answers[msg.variant % intent.answers.length];
  const words = text.split(/(\s+)/);
  const reduced = useReducedMotion();
  const instant = !msg.animate || !!reduced;
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const voteKey = `${intent.id}:${msg.variant % intent.answers.length}`;
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [voteNote, setVoteNote] = useState(false);

  // Restore this visitor's earlier vote on this exact wording.
  useEffect(() => {
    const saved = readVotes()[voteKey] ?? null;
    if (saved) queueMicrotask(() => setVote(saved));
  }, [voteKey]);

  const castVote = async (value: "up" | "down") => {
    const next = vote === value ? null : value;
    setVote(next);
    setVoteNote(next === "down");
    rememberVote(voteKey, next);
    const res = await postApi("/api/vote/", { intentId: intent.id, variant: msg.variant % intent.answers.length, value: next });
    if (!res.ok) {
      setVote(vote);
      rememberVote(voteKey, vote);
    }
  };

  // thinking → streaming → done. Stopping (phase forced to "done") short-circuits everything.
  useEffect(() => {
    if (msg.phase === "thinking") {
      if (instant) return onPhase(msg.id, "done");
      const t = setTimeout(() => onPhase(msg.id, "streaming"), 450 + Math.random() * 300);
      return () => clearTimeout(t);
    }
    if (msg.phase === "streaming") {
      if (count >= words.length) return onPhase(msg.id, "done");
      const t = setTimeout(() => setCount((c) => Math.min(words.length, c + 2)), 24);
      return () => clearTimeout(t);
    }
  }, [msg.phase, msg.id, count, words.length, instant, onPhase]);

  const done = msg.phase === "done";
  const shown = done ? text : words.slice(0, count).join("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plain(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const appear = (i: number) =>
    msg.animate
      ? {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.35, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] as const },
        }
      : {};

  return (
    <div className="flex gap-3 md:gap-4">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 pt-0.5">
        {msg.phase === "thinking" ? (
          <p className="shimmer text-[17px] font-medium md:text-lg">Reading Maruf&apos;s CV…</p>
        ) : (
          <p className="text-[18px] leading-[1.65] text-fg/90 md:text-[19px]">
            <RichText text={shown} />
          </p>
        )}

        {done && (
          <>
            {intent.blocks.length > 0 && (
              <AnimatedBlocks animate={msg.animate} className="mt-5 -ml-11 space-y-4 md:ml-0">
                {intent.blocks.map((b, i) => (
                  <div key={i}>
                    <BlockView block={b} onAsk={onAsk} />
                  </div>
                ))}
              </AnimatedBlocks>
            )}

            <motion.div {...appear(intent.blocks.length)} className="mt-3 -ml-[3.375rem] flex items-center gap-0.5 text-faint md:-ml-2.5">
              <button type="button" className="icon-btn size-9" onClick={copy} aria-label="Copy answer">
                {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
              </button>
              <button
                type="button"
                className={cn("icon-btn size-9", vote === "up" && "text-accent hover:text-accent")}
                onClick={() => castVote("up")}
                aria-label="Good answer"
                aria-pressed={vote === "up"}
              >
                <ThumbsUp className={cn("size-4", vote === "up" && "fill-current")} />
              </button>
              <button
                type="button"
                className={cn("icon-btn size-9", vote === "down" && "text-accent hover:text-accent")}
                onClick={() => castVote("down")}
                aria-label="Bad answer"
                aria-pressed={vote === "down"}
              >
                <ThumbsDown className={cn("size-4", vote === "down" && "fill-current")} />
              </button>
              {intent.id !== "fallback" && (
                <button type="button" className="icon-btn size-9" onClick={() => onRegenerate(msg.id)} aria-label="Regenerate answer">
                  <RefreshCw className="size-4" />
                </button>
              )}
              {vote === "up" && <span className="ml-1 text-sm text-faint">Thanks!</span>}
            </motion.div>
            {voteNote && (
              <p className="mt-1 -ml-11 text-sm text-muted md:ml-0">
                Sorry it missed.{" "}
                <button type="button" className="font-semibold text-fg underline-offset-4 hover:underline" onClick={() => onAsk("feedback")}>
                  Tell me what was missing
                </button>
              </p>
            )}

            {isLast && intent.followUps.length > 0 && (
              <motion.div {...appear(intent.blocks.length + 1)} className="mt-3 -ml-11 md:ml-0">
                <SuggestionChips ids={intent.followUps} onPick={onAsk} wrap />
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
