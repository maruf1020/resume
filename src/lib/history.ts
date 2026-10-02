"use client";

// Chat history lives only in this browser (localStorage). Nothing is sent anywhere.

export type SavedMessage = { role: "user"; text: string } | { role: "assistant"; intentId: string; variant: number };
export type SavedChat = { id: string; n: number; createdAt: string; updatedAt: string; messages: SavedMessage[] };

const KEY = "portfolio:chats";
const MAX_CHATS = 30;
const EVENT = "portfolio:chats-changed";

let cache: SavedChat[] | null = null;

function read(): SavedChat[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    cache = Array.isArray(parsed) ? (parsed as SavedChat[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(chats: SavedChat[]) {
  cache = chats.slice(-MAX_CHATS);
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full or blocked: history just won't persist */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const history = {
  subscribe(cb: () => void) {
    window.addEventListener(EVENT, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(EVENT, cb);
      window.removeEventListener("storage", cb);
    };
  },
  /** Oldest first. Stable reference between changes (needed by useSyncExternalStore). */
  list: (): SavedChat[] => read(),
  serverList: (): SavedChat[] => EMPTY,

  /** Save the given messages into chat `id`, or create a new numbered chat. Returns the chat id. */
  save(id: string | null, messages: SavedMessage[]): string {
    const chats = [...read()];
    const now = new Date().toISOString();
    const i = id ? chats.findIndex((c) => c.id === id) : -1;
    if (i >= 0) {
      chats[i] = { ...chats[i], messages, updatedAt: now };
      write(chats);
      return chats[i].id;
    }
    const n = chats.reduce((m, c) => Math.max(m, c.n), 0) + 1;
    const created: SavedChat = { id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, n, createdAt: now, updatedAt: now, messages };
    write([...chats, created]);
    return created.id;
  },
};

const EMPTY: SavedChat[] = [];
