"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { Composer, type ComposerHandle } from "@/components/chat/composer";
import { useVisibleHeight } from "@/lib/use-visible-height";
import { ConsentBanner } from "@/components/consent";
import { PhotoViewerProvider } from "@/components/photo-viewer";
import { AssistantMessage, UserMessage } from "@/components/chat/messages";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { TypedIntro } from "@/components/hero/typed-intro";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { resolveIntent, useChat } from "@/lib/chat";
import { startSession, track } from "@/lib/consent";
import { RichText } from "@/components/chat/rich-text";
import { usePersona } from "@/lib/persona/context";
import type { Question } from "@/lib/persona/types";
import { focusInOtherModal, useFocusTrap } from "@/lib/use-focus-trap";

export function ChatApp({ initialIntent, aiEnabled = false }: { initialIntent?: string; aiEnabled?: boolean }) {
  const persona = usePersona();
  // The landing screen shows a short, curated set; "More" opens the full list.
  const landing = persona.landing.map((id) => persona.get(id)).filter((q): q is Question => !!q);
  const chat = useChat(persona, initialIntent);
  const { messages, generating, ask: chatAsk } = chat;
  const empty = messages.length === 0;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [showDown, setShowDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composer = useRef<ComposerHandle>(null);
  // The question box stays above the on-screen keyboard on phones.
  useVisibleHeight();
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Publish the bottom dock's height so overlays (the privacy banner) can sit just above the composer.
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty("--dock-h", `${dock.offsetHeight}px`));
    ro.observe(dock);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--dock-h");
    };
  }, []);

  const toggleSidebar = (open: boolean) => setSidebarOpen(open);

  // Publish the desktop sidebar's width so the short-window privacy strip starts right of it, not over the topics.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--side-w", sidebarOpen ? "17.5rem" : "4.25rem");
    return () => {
      root.style.removeProperty("--side-w");
    };
  }, [sidebarOpen]);

  const ask = useCallback(
    (intentId: string, text?: string) => {
      setDrawer(false);
      chatAsk(intentId, text);
      track("ask", { intentId });
    },
    [chatAsk],
  );

  // One anonymous page view per load (device details only if the visitor accepted).
  useEffect(() => {
    startSession();
    track("pageview", { path: window.location.pathname });
  }, []);

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
      // Never pull focus out of an open dialog (photo viewer, drawer) or out of an editable field.
      if (document.querySelector('[aria-modal="true"]') || t.closest?.('[role="dialog"]') || t.isContentEditable) return;
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

  // Mobile drawer is a modal dialog: focus moves in, Tab stays inside, Esc closes, focus returns to "Open menu".
  useFocusTrap(drawerRef, drawer);
  useEffect(() => {
    if (!drawer) return;
    const menu = menuRef.current;
    const raf = requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("[data-drawer-close]")?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (drawerRef.current && focusInOtherModal(drawerRef.current))) return;
      e.preventDefault();
      setDrawer(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      // Unless something else already took focus (e.g. the composer after "New chat").
      requestAnimationFrame(() => {
        const a = document.activeElement;
        if (!a || a === document.body || !a.isConnected || a.closest('[aria-label="Menu"][role="dialog"]')) menu?.focus();
      });
    };
  }, [drawer]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const activeIntent = lastAssistant?.role === "assistant" ? lastAssistant.intentId : undefined;

  // One short screen-reader update per answer, instead of announcing every streamed word.
  const status =
    lastAssistant?.role === "assistant" && lastAssistant.animate
      ? lastAssistant.phase === "done"
        ? `Answer ready: ${resolveIntent(lastAssistant, persona).label}`
        : persona.labels.thinkingStatus
      : "";

  // Pair each question with its answer so every answer is a section headed by its question.
  const turns: { question?: Extract<(typeof messages)[number], { role: "user" }>; answer?: Extract<(typeof messages)[number], { role: "assistant" }> }[] = [];
  for (const m of messages) {
    if (m.role === "user") turns.push({ question: m });
    else if (turns.length && !turns[turns.length - 1].answer) turns[turns.length - 1].answer = m;
    else turns.push({ answer: m });
  }

  return (
    <MotionConfig reducedMotion="user">
    <PhotoViewerProvider>
    {/* First Tab stop: jump past the sidebar and topics straight to the question box. */}
    <a
      href="#question-box"
      onClick={(e) => {
        e.preventDefault();
        composer.current?.focus();
      }}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-[60] focus-visible:rounded-xl focus-visible:bg-card focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-semibold focus-visible:shadow-lg"
    >
      Skip to question box
    </a>
    {/* The Privacy answer carries the same Accept/Reject, so the banner steps aside while it is shown. */}
    <ConsentBanner onLearnMore={persona.get("privacy") ? () => chatAsk("privacy") : undefined} hidden={activeIntent === "privacy" || drawer} />
    <div className="flex h-[var(--app-h,100dvh)] overflow-hidden">
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
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop: tap to close. Keyboard users close with Esc or the X button. */}
            <div aria-hidden="true" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
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

      <div className="flex min-w-0 flex-1 flex-col" inert={drawer}>
        <TopBar
          menuRef={menuRef}
          onOpenDrawer={() => setDrawer(true)}
          onNew={reset}
          onAsk={ask}
        />

        <LayoutGroup>
          <main ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-y-auto">
            {empty ? (
              <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center px-5 pt-8 pb-[calc(2rem+var(--consent-h,0px))] md:px-10">
                <TypedIntro />
              </div>
            ) : (
              <div role="log" aria-live="off" aria-label="Conversation" className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-6 pb-[calc(2.5rem+var(--consent-h,0px))] md:px-6 md:pt-10">
                <h1 className="sr-only">
                  {persona.identity.name}
                  {persona.identity.role ? ` - ${persona.identity.role}` : ""}
                </h1>
                {turns.map(({ question, answer }, i) => {
                  const isLast = i === turns.length - 1;
                  return (
                    <section key={question?.id ?? answer?.id} aria-label={question ? undefined : "Answer"} aria-labelledby={question ? `q-${question.id}` : undefined} className="space-y-8">
                      {question && (
                        <>
                          <h2 id={`q-${question.id}`} className="sr-only">
                            {question.text}
                          </h2>
                          <div data-msg={question.id} aria-hidden="true">
                            <UserMessage text={question.text} />
                          </div>
                        </>
                      )}
                      {answer && (
                        // The newest answer reserves a screen of room so its question can scroll to the top.
                        <div key={`${answer.id}-${answer.variant}`} className={isLast && messages.length > 2 ? "min-h-[calc(100dvh-16rem)]" : undefined}>
                          <AssistantMessage
                            msg={answer}
                            isLast={isLast}
                            onPhase={chat.setPhase}
                            onAsk={ask}
                            onRegenerate={chat.regenerate}
                          />
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </main>
          <p role="status" aria-live="polite" className="sr-only">
            {status}
          </p>

          {/* Bottom dock: always pinned, like other AI chat apps. */}
          <div ref={dockRef} id="question-box" className="relative shrink-0 px-4 pt-2 pb-safe md:px-6">
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
                    className="absolute -top-12 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full border border-line bg-card shadow-md pointer-coarse:size-11"
                  >
                    <ArrowDown className="size-4" />
                  </motion.button>
                )}
              </AnimatePresence>
              {!empty && <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-bg to-transparent" />}
              <div className="mx-auto max-w-3xl">
                <Composer ref={composer} onSubmit={ask} generating={generating} onStop={chat.stop} aiEnabled={aiEnabled} />
                {empty && (
                  <SuggestionChips intents={landing} onPick={ask} onMore={() => composer.current?.showAll()} compact className="mt-2.5" />
                )}
                <p className="mt-2 text-center text-xs text-faint">
                  {empty ? (
                    <>
                      {persona.labels.pickHintBefore} <kbd className="rounded border border-line px-1 font-mono text-[11px]">/</kbd>{" "}
                      {persona.labels.pickHintAfter}
                    </>
                  ) : (
                    <RichText text={aiEnabled ? persona.labels.footerAi : persona.labels.footerNoAi} />
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
