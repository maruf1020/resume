"use client";

import { useEffect, useRef, useState } from "react";
import { introPools, longestIntro, staticIntro } from "@/content/intro";

type Seg = { text: string; typing: boolean };

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

/** Splits "Oh,^250 hi." into typed chunks and pauses. */
function parse(line: string): (string | number)[] {
  return line.split(/(\^\d+)/).flatMap<string | number>((part) => (part.startsWith("^") ? [Number(part.slice(1))] : [...part]));
}
const clean = (line: string) => line.replace(/\^\d+/g, "");
const pick = <T,>(arr: T[], not?: T) => {
  const options = arr.length > 1 && not !== undefined ? arr.filter((x) => x !== not) : arr;
  return options[Math.floor(Math.random() * options.length)];
};

const MAX_LINES = 4;
const LINE_HEIGHT = 1.06;

/** Largest font size (px) at which `text` wraps into at most MAX_LINES lines inside `el`. */
function fitFontSize(el: HTMLElement, text: string): number {
  const cs = getComputedStyle(el);
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  Object.assign(probe.style, {
    position: "absolute",
    visibility: "hidden",
    left: "-9999px",
    top: "0",
    width: `${el.clientWidth}px`,
    fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight,
    letterSpacing: "-0.035em",
    lineHeight: String(LINE_HEIGHT),
    whiteSpace: "normal",
  });
  probe.textContent = `${text} ▍`;
  document.body.appendChild(probe);
  let lo = 22;
  let hi = 84;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    probe.style.fontSize = `${mid}px`;
    const lines = Math.round(probe.offsetHeight / (mid * LINE_HEIGHT));
    if (lines <= MAX_LINES) lo = mid;
    else hi = mid;
  }
  probe.remove();
  return Math.floor(lo);
}

export function TypedIntro() {
  const [segs, setSegs] = useState<Seg[]>(() => introPools.map(() => ({ text: "", typing: false })));
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLHeadingElement>(null);

  // Size the heading once per width so the longest sentence still fits in 4 lines: no jumping while typing.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => el.style.setProperty("--intro-size", `${fitFontSize(el, longestIntro)}px`);
    fit();
    document.fonts?.ready.then(fit).catch(() => {});
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;
    const current: string[] = introPools.map(() => "");

    const update = (i: number, text: string, typing: boolean) =>
      setSegs((prev) => prev.map((s, j) => (j === i ? { text, typing } : s)));

    const type = async (i: number, line: string) => {
      setActive(i);
      let out = "";
      for (const tok of parse(line)) {
        if (typeof tok === "number") {
          update(i, out, false);
          await sleep(tok, signal);
        } else {
          out += tok;
          update(i, out, true);
          await sleep(28 + Math.random() * 38, signal);
        }
      }
      update(i, out, false);
      current[i] = line;
    };

    const erase = async (i: number) => {
      setActive(i);
      let out = clean(current[i]);
      while (out.length) {
        out = out.slice(0, -1);
        update(i, out, true);
        await sleep(14, signal);
      }
    };

    (async () => {
      await sleep(350, signal);
      for (const [i, pool] of introPools.entries()) {
        if (!pool.firstPass) continue;
        await type(i, pick(pool.lines));
        await sleep(420, signal);
      }
      // Rotation: swap one sentence at a time, forever.
      for (;;) {
        await sleep(2600, signal);
        const i = Math.floor(Math.random() * introPools.length);
        const pool = introPools[i];
        if (current[i]) await erase(i);
        await sleep(160, signal);
        await type(i, pick(pool.lines, current[i]));
      }
    })().catch(() => {});

    return () => ctrl.abort();
  }, []);

  return (
    <h1 ref={ref} className="intro display w-full text-fg">
      <span className="intro-static">{staticIntro}</span>
      <span className="intro-typing" aria-hidden="true">
        {segs.map((s, i) =>
          s.text || i === active ? (
            <span key={i}>
              <span className="seg" data-active={i === active} data-typing={s.typing}>
                {clean(s.text)}
              </span>{" "}
            </span>
          ) : null,
        )}
      </span>
      {/* Screen readers get the stable sentence, not the typing loop. */}
      <span className="sr-only intro-typing">{staticIntro}</span>
    </h1>
  );
}
