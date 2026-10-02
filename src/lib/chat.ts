"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { Sparkles } from "lucide-react";
import { fallbackIntent, getIntent, type Block, type Intent } from "@/content/intents";
import { askPath, plain, withBase } from "./utils";
import { postApi } from "./visitor";

export type Phase = "thinking" | "streaming" | "done";

export type UserMessage = { id: string; role: "user"; text: string };

/** A free-form question on its way to, or back from, the AI (POST /api/ask). */
export type AiState =
  | { status: "loading"; requestId: string }
  /** `topicId` when the AI chose a curated topic and wrote tailored text above that topic's cards. */
  | { status: "ready"; answerId: string; text: string; cards: Block[]; suggestedTopics: string[]; topicId?: string }
  /** The visitor pressed Stop (or asked something else) before the answer arrived. */
  | { status: "stopped" };

export type AssistantMessage = {
  id: string;
  role: "assistant";
  /** The curated answer to play; "ai" while the AI handles a free-form question, "fallback" when nothing fits. */
  intentId: string;
  variant: number;
  phase: Phase;
  /** False for answers that should appear instantly (deep links, reduced motion). */
  animate: boolean;
  /** The visitor's own words (free-form questions only). */
  question?: string;
  ai?: AiState;
};
export type Message = UserMessage | AssistantMessage;

/** What the server did with a free-form question. */
export type AiResult =
  | { route: "topic"; intentId: string; answerId: string; text?: string; cards: Block[]; suggestedTopics: string[] }
  | { route: "answer"; answerId: string; text: string; cards: Block[]; suggestedTopics: string[] }
  | { route: "decline" | "failed" };

type State = { messages: Message[]; seq: number };

type Action =
  | { type: "ask"; intentId: string; text: string; variant: number; ai?: AiState }
  | { type: "ai-result"; requestId: string; result: AiResult }
  | { type: "phase"; id: string; phase: Phase }
  | { type: "stop" }
  | { type: "regenerate"; id: string }
  | { type: "reset" };

const finishAll = (messages: Message[]) =>
  messages.map((m) =>
    m.role === "assistant" && m.phase !== "done" ? { ...m, phase: "done" as const, ai: m.ai?.status === "loading" ? { status: "stopped" as const } : m.ai } : m,
  );

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ask": {
      const seq = state.seq + 2;
      return {
        seq,
        messages: [
          ...finishAll(state.messages),
          { id: `u${seq}`, role: "user", text: action.text },
          {
            id: `a${seq}`,
            role: "assistant",
            intentId: action.intentId,
            variant: action.variant,
            phase: "thinking",
            animate: true,
            question: action.ai ? action.text : undefined,
            ai: action.ai,
          },
        ],
      };
    }
    case "ai-result":
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.role !== "assistant" || m.ai?.status !== "loading" || m.ai.requestId !== action.requestId) return m;
          const r = action.result;
          // A curated topic fits. Without tailored text the curated answer plays as is; with it, the
          // model's words lead and the topic's cards and follow-ups come along.
          if (r.route === "topic") {
            if (!r.text) return { ...m, intentId: r.intentId, variant: 0, ai: undefined };
            return { ...m, intentId: r.intentId, ai: { status: "ready", answerId: r.answerId, text: r.text, cards: r.cards, suggestedTopics: r.suggestedTopics, topicId: r.intentId } };
          }
          if (r.route === "answer") return { ...m, ai: { status: "ready", answerId: r.answerId, text: r.text, cards: r.cards, suggestedTopics: r.suggestedTopics } };
          return { ...m, intentId: "fallback", ai: undefined };
        }),
      };
    case "phase":
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id && m.role === "assistant" ? { ...m, phase: action.phase } : m)),
      };
    case "stop":
      return { ...state, messages: finishAll(state.messages) };
    case "regenerate":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id && m.role === "assistant" ? { ...m, variant: m.variant + 1, phase: "thinking", animate: true } : m,
        ),
      };
    case "reset":
      return { messages: [], seq: state.seq };
  }
}

function initState(initialIntent?: string): State {
  const intent = initialIntent ? getIntent(initialIntent) : undefined;
  if (!intent) return { messages: [], seq: 0 };
  return {
    seq: 2,
    messages: [
      { id: "u2", role: "user", text: intent.prompt },
      { id: "a2", role: "assistant", intentId: intent.id, variant: 0, phase: "done", animate: false },
    ],
  };
}

const syncUrl = (path: string) => {
  if (typeof window !== "undefined" && window.location.pathname !== path) window.history.replaceState(null, "", path);
};

const randomId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/** The intent to render for a message: a curated one, or a one-off built from the AI's answer. */
export function resolveIntent(msg: AssistantMessage): Intent {
  const ai = msg.ai;
  if (!ai) return getIntent(msg.intentId) ?? fallbackIntent;
  const base = { id: "ai", label: "AI answer", prompt: msg.question ?? "", icon: Sparkles, keywords: [] as string[] };
  if (ai.status === "ready") return { ...base, label: (ai.topicId && getIntent(ai.topicId)?.label) || base.label, answers: [ai.text], blocks: ai.cards, followUps: ai.suggestedTopics };
  if (ai.status === "stopped") return { ...base, answers: ["Stopped. Ask me anything else whenever you like."], blocks: [], followUps: ["projects", "skills", "hire"] };
  return { ...base, answers: [""], blocks: [], followUps: [] };
}

const MAX_TURNS = 6;

/** The last few question/answer pairs, so the AI can resolve "tell me more about that". */
function buildHistory(messages: Message[]): { q: string; a: string }[] {
  const turns: { q: string; a: string }[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const m = messages[i];
    const next = messages[i + 1];
    if (m.role !== "user" || next.role !== "assistant") continue;
    if (next.ai && next.ai.status !== "ready") continue;
    const intent = resolveIntent(next);
    const a = plain(intent.answers[next.variant % intent.answers.length] ?? "");
    if (a) turns.push({ q: m.text.slice(0, 300), a: a.slice(0, 600) });
  }
  return turns.slice(-MAX_TURNS);
}

export function useChat(initialIntent?: string) {
  const [state, dispatch] = useReducer(reducer, initialIntent, initState);
  // The latest messages, for building the AI's history outside React's render.
  const messagesRef = useRef(state.messages);
  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

  const askAi = useCallback((question: string) => {
    const requestId = randomId();
    const history = buildHistory(messagesRef.current);
    dispatch({ type: "ask", intentId: "ai", text: question, variant: 0, ai: { status: "loading", requestId } });
    postApi("/api/ask/", { question, history }).then((res) => {
      const common = {
        answerId: typeof res.answerId === "string" ? res.answerId : requestId,
        cards: Array.isArray(res.cards) ? (res.cards as Block[]) : [],
        suggestedTopics: Array.isArray(res.suggestedTopics) ? (res.suggestedTopics as string[]) : [],
      };
      const result: AiResult = !res.ok
        ? { route: "failed" }
        : res.route === "topic" && typeof res.intentId === "string"
          ? { route: "topic", intentId: res.intentId, text: typeof res.text === "string" && res.text ? res.text : undefined, ...common }
          : res.route === "answer" && typeof res.text === "string"
            ? { route: "answer", text: res.text, ...common }
            : { route: "decline" };
      dispatch({ type: "ai-result", requestId, result });
      if (result.route === "topic") syncUrl(askPath(result.intentId));
    });
  }, []);

  const ask = useCallback(
    (intentId: string, text?: string) => {
      // Free-form text: the AI decides whether a curated answer fits or writes one from the CV.
      if (intentId === "ai" && text?.trim()) return askAi(text.trim());
      const intent = getIntent(intentId) ?? fallbackIntent;
      // "Surprise me" starts on a random fact; everything else starts on the first wording.
      const variant = intent.id === "surprise" ? Math.floor(Math.random() * intent.answers.length) : 0;
      dispatch({ type: "ask", intentId: intent.id, text: text?.trim() || intent.prompt, variant });
      if (intent.id !== "fallback") syncUrl(askPath(intent.id));
    },
    [askAi],
  );

  const setPhase = useCallback((id: string, phase: Phase) => dispatch({ type: "phase", id, phase }), []);
  const stop = useCallback(() => dispatch({ type: "stop" }), []);
  const regenerate = useCallback((id: string) => dispatch({ type: "regenerate", id }), []);
  const reset = useCallback(() => {
    dispatch({ type: "reset" });
    syncUrl(withBase("/"));
  }, []);

  const generating = state.messages.some((m) => m.role === "assistant" && m.phase !== "done");

  return { messages: state.messages, generating, ask, setPhase, stop, regenerate, reset };
}

export type Chat = ReturnType<typeof useChat>;
