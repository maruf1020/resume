"use client";

import { forwardRef, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, CornerDownLeft, Square } from "lucide-react";
import { matchIntents } from "@/lib/match-intent";
import { cn, withBase } from "@/lib/utils";

type Props = {
  onSubmit: (intentId: string, text?: string) => void;
  generating: boolean;
  onStop: () => void;
  className?: string;
};

/** A single "word" of 8+ characters might be the private access code; only those are checked with the server. */
const mightBeCode = (q: string) => q.length >= 8 && !/\s/.test(q) && !q.startsWith("/");

async function tryAccessCode(code: string): Promise<boolean> {
  try {
    const res = await fetch(withBase("/api/admin/session/"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type ComposerHandle = { focus: () => void; showAll: () => void };

export const Composer = forwardRef<ComposerHandle, Props>(function Composer({ onSubmit, generating, onStop, className }, ref) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      // "More" chip: open the list of everything you can ask.
      showAll: () => {
        setValue("/");
        setOpen(true);
        setActive(0);
        inputRef.current?.focus();
      },
    }),
    [],
  );
  const [checking, setChecking] = useState(false);

  const matches = useMemo(() => (value.trim() ? matchIntents(value) : []), [value]);
  const showList = open && value.trim().length > 0;

  const send = (intentId: string, text?: string) => {
    onSubmit(intentId, text);
    setValue("");
    setOpen(false);
    setActive(0);
  };

  const submit = async () => {
    if (generating) return onStop();
    const q = value.trim();
    if (!q || checking) return;
    if (mightBeCode(q)) {
      setChecking(true);
      const ok = await tryAccessCode(q);
      setChecking(false);
      if (ok) {
        // Never echo the code into the chat.
        setValue("");
        setOpen(false);
        window.location.assign(withBase("/admin/"));
        return;
      }
    }
    if (matches.length) send(matches[active]?.id ?? matches[0].id);
    else send("fallback", q);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && matches.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % matches.length);
    } else if (e.key === "ArrowUp" && matches.length) {
      e.preventDefault();
      setActive((a) => (a - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-0 bottom-full z-20 mb-2 overflow-hidden rounded-3xl border border-line bg-bg shadow-[0_18px_50px_-12px_rgb(0_0_0/0.25)]"
          >
            {matches.length ? (
              <ul id={listId} role="listbox" aria-label="Questions you can ask" className="max-h-[50vh] overflow-y-auto p-1.5">
                {matches.map((m, i) => (
                  <li
                    key={m.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      send(m.id);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2.5",
                      i === active && "bg-surface",
                    )}
                  >
                    <m.icon className="size-[18px] shrink-0 text-faint" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{m.label}</span>
                      <span className="block truncate text-sm text-muted">{m.prompt}</span>
                    </span>
                    {i === active && <CornerDownLeft className="size-4 shrink-0 text-faint" aria-hidden="true" />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-[15px] text-muted">
                I only answer questions about Maruf. Press <span className="font-semibold text-fg">Enter</span> anyway, or try
                &ldquo;projects&rdquo;, &ldquo;skills&rdquo; or &ldquo;hire&rdquo;.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 rounded-[1.75rem] border border-line bg-bg p-2 pl-5 shadow-[0_6px_30px_-12px_rgb(0_0_0/0.18)] transition-[border-color,box-shadow] focus-within:border-faint/60 focus-within:shadow-[0_8px_34px_-12px_rgb(0_0_0/0.28)]">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.slice(0, 80));
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder="Ask about my work, projects, skills…"
          aria-label="Ask a question about Maruf"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && matches.length ? `${listId}-${active}` : undefined}
          enterKeyHint="send"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[17px] font-medium outline-none placeholder:font-normal placeholder:text-faint"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!generating && !value.trim()}
          aria-label={generating ? "Stop generating" : "Send"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-bg transition-opacity disabled:opacity-25"
        >
          {generating ? <Square className="size-4 fill-current" /> : <ArrowUp className="size-5" strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
});
