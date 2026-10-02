"use client";

import { useCallback, useReducer } from "react";
import { fallbackIntent, getIntent } from "@/content/intents";
import type { SavedMessage } from "./history";
import { askPath, withBase } from "./utils";

export type Phase = "thinking" | "streaming" | "done";

export type UserMessage = { id: string; role: "user"; text: string };
export type AssistantMessage = {
  id: string;
  role: "assistant";
  intentId: string;
  variant: number;
  phase: Phase;
  /** False for answers that should appear instantly (deep links, reduced motion). */
  animate: boolean;
};
export type Message = UserMessage | AssistantMessage;

type State = { messages: Message[]; seq: number };

type Action =
  | { type: "ask"; intentId: string; text: string; variant: number }
  | { type: "phase"; id: string; phase: Phase }
  | { type: "stop" }
  | { type: "regenerate"; id: string }
  | { type: "reset" }
  | { type: "load"; messages: SavedMessage[] };

const finishAll = (messages: Message[]) =>
  messages.map((m) => (m.role === "assistant" && m.phase !== "done" ? { ...m, phase: "done" as const } : m));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ask": {
      const seq = state.seq + 2;
      return {
        seq,
        messages: [
          ...finishAll(state.messages),
          { id: `u${seq}`, role: "user", text: action.text },
          { id: `a${seq}`, role: "assistant", intentId: action.intentId, variant: action.variant, phase: "thinking", animate: true },
        ],
      };
    }
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
    case "load": {
      // Restored chats appear instantly, fully answered.
      let seq = state.seq;
      const messages: Message[] = action.messages.map((m) => {
        seq += 1;
        return m.role === "user"
          ? { id: `u${seq}`, role: "user", text: m.text }
          : { id: `a${seq}`, role: "assistant", intentId: m.intentId, variant: m.variant, phase: "done", animate: false };
      });
      return { messages, seq };
    }
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

export function useChat(initialIntent?: string) {
  const [state, dispatch] = useReducer(reducer, initialIntent, initState);

  const ask = useCallback((intentId: string, text?: string) => {
    const intent = getIntent(intentId) ?? fallbackIntent;
    // "Surprise me" starts on a random fact; everything else starts on the first wording.
    const variant = intent.id === "surprise" ? Math.floor(Math.random() * intent.answers.length) : 0;
    dispatch({ type: "ask", intentId: intent.id, text: text?.trim() || intent.prompt, variant });
    if (intent.id !== "fallback") syncUrl(askPath(intent.id));
  }, []);

  const setPhase = useCallback((id: string, phase: Phase) => dispatch({ type: "phase", id, phase }), []);
  const stop = useCallback(() => dispatch({ type: "stop" }), []);
  const regenerate = useCallback((id: string) => dispatch({ type: "regenerate", id }), []);
  const reset = useCallback(() => {
    dispatch({ type: "reset" });
    syncUrl(withBase("/"));
  }, []);

  const generating = state.messages.some((m) => m.role === "assistant" && m.phase !== "done");

  const load = useCallback((messages: SavedMessage[]) => {
    dispatch({ type: "load", messages });
    syncUrl(withBase("/"));
  }, []);

  return { messages: state.messages, generating, ask, setPhase, stop, regenerate, reset, load };
}

export type Chat = ReturnType<typeof useChat>;
