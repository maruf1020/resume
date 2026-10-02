"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { Composer, type ComposerHandle } from "@/components/chat/composer";
import { PhotoViewerProvider } from "@/components/photo-viewer";
import { AssistantMessage, UserMessage } from "@/components/chat/messages";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { TypedIntro } from "@/components/hero/typed-intro";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { getIntent, type Intent } from "@/content/intents";

// The landing screen shows a short, curated set; "More" opens the full list.
const LANDING = ["about", "experience", "projects", "skills", "hire"]
  .map((id) => getIntent(id))
  .filter((i): i is Intent => !!i);
import { useChat } from "@/lib/chat";

export function ChatApp({ initialIntent }: { initialIntent?: string }) {
  const chat = useChat(initialIntent);
  const { messages, generating, ask: chatAsk } = chat;
  const empty = messages.length === 0;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [showDown, setShowDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composer = useRef<ComposerHandle>(null);

  const toggleSidebar = (open: boolean) => setSidebarOpen(open);

  const ask = useCallback(
    (intentId: string, text?: string) => {
      setDrawer(false);
      chatAsk(intentId, text);
    },
    [chatAsk],
  );

  const reset = () => {
    setDrawer(false);
    chat.reset();
    requestAnimationFrame(() => composer.current?.focus());
  };

  // Like ChatGPT: each new question scrolls to the top of the view and its answer fills in below,
  // so long answers (timeline, projects) are read from the start.
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    const scroller = scrollRef.current;
    const last = messages.at(-1);
    if (!scroller || last?.role !== "assistant" || last.phase !== "thinking") return;
    const question = scroller.querySelector<HTMLElement>(`[data-msg="${messages.at(-2)?.id}"]`);
    if (question) scroller.scrollTo({ top: question.offsetTop - 16, behavior: "smooth" });
    // Only when a new question arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId]);

  const onScroll = () => {
    const s = scrollRef.current;
    if (!s) return;
    setShowDown(s.scrollHeight - s.scrollTop - s.clientHeight > 160);
  };

  // "/" focuses the composer from anywhere, like a command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const palette = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (palette || (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName))) {
        e.preventDefault();
        composer.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
  }, [drawer]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const activeIntent = lastAssistant?.role === "assistant" ? lastAssistant.intentId : undefined;


  return (
    <MotionConfig reducedMotion="user">
    <PhotoViewerProvider>
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar: full panel or a slim icon rail */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? "17.5rem" : "4.25rem" }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className={`relative z-20 hidden shrink-0 border-r border-line lg:block ${sidebarOpen ? "overflow-hidden" : "overflow-visible"}`}
      >
        <Sidebar
          variant="desktop"
          collapsed={!sidebarOpen}
          activeIntent={activeIntent}
          onAsk={ask}
          onNew={reset}
          onToggle={() => toggleSidebar(!sidebarOpen)}
        />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
              className="relative h-full w-[17.5rem] max-w-[85vw] shadow-2xl"
            >
              <Sidebar variant="drawer" activeIntent={activeIntent} onAsk={ask} onNew={reset} onToggle={() => setDrawer(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenDrawer={() => setDrawer(true)}
          onNew={reset}
          onAsk={ask}
        />

        <LayoutGroup>
          <main ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto">
            {empty ? (
              <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-5 py-8 md:px-10">
                <TypedIntro />
              </div>
            ) : (
              <div aria-live="polite" className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-6 pb-10 md:px-6 md:pt-10">
                {messages.map((m, i) => {
                  const isLast = i === messages.length - 1;
                  return m.role === "user" ? (
                    <div key={m.id} data-msg={m.id}>
                      <UserMessage text={m.text} />
                    </div>
                  ) : (
                    // The newest answer reserves a screen of room so its question can scroll to the top.
                    <div key={`${m.id}-${m.variant}`} className={isLast && messages.length > 2 ? "min-h-[calc(100dvh-16rem)]" : undefined}>
                      <AssistantMessage
                        msg={m}
                        isLast={isLast}
                        onPhase={chat.setPhase}
                        onAsk={ask}
                        onRegenerate={chat.regenerate}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          {/* Bottom dock: always pinned, like other AI chat apps. */}
          <div className="relative shrink-0 px-4 pt-2 pb-safe md:px-6">
              <AnimatePresence>
                {showDown && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    onClick={() => {
                      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
                    }}
                    aria-label="Scroll to latest answer"
                    className="absolute -top-12 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full border border-line bg-bg shadow-md"
                  >
                    <ArrowDown className="size-4" />
                  </motion.button>
                )}
              </AnimatePresence>
              {!empty && <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-bg to-transparent" />}
              <div className="mx-auto max-w-3xl">
                <Composer ref={composer} onSubmit={ask} generating={generating} onStop={chat.stop} />
                {empty && (
                  <SuggestionChips intents={LANDING} onPick={ask} onMore={() => composer.current?.showAll()} compact className="mt-2.5" />
                )}
                <p className="mt-2 text-center text-xs text-faint">
                  {empty ? (
                    <>
                      Pick a question or type <kbd className="rounded border border-line px-1 font-mono text-[11px]">/</kbd> to see
                      everything you can ask.
                    </>
                  ) : (
                    <>Answers come straight from Maruf&apos;s CV - nothing is generated.</>
                  )}
                </p>
              </div>
            </div>
        </LayoutGroup>
      </div>
    </div>
    </PhotoViewerProvider>
    </MotionConfig>
  );
}
