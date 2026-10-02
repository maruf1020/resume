"use client";

import { motion } from "motion/react";
import { PanelLeftClose, PanelLeftOpen, SquarePen, X } from "lucide-react";
import { Github, Linkedin } from "@/components/brand-icons";
import { Avatar } from "@/components/photo-viewer";
import { primaryIntents } from "@/content/intents";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { cn } from "@/lib/utils";

type Props = {
  activeIntent?: string;
  onAsk: (intentId: string) => void;
  onNew: () => void;
  /** Desktop: collapse/expand the rail. Drawer: close. */
  onToggle: () => void;
  variant: "desktop" | "drawer";
  /** Desktop only: show the slim icon rail instead of the full panel. */
  collapsed?: boolean;
};

/** Label shown beside a rail icon on hover/focus. */
const RailTip = ({ children }: { children: React.ReactNode }) => (
  <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-lg bg-fg px-2.5 py-1 text-[13px] font-medium whitespace-nowrap text-bg opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
    {children}
  </span>
);

export function Sidebar({ activeIntent, onAsk, onNew, onToggle, variant, collapsed = false }: Props) {
  const rail = variant === "desktop" && collapsed;
  // Drawer rows are finger-sized (44px+); the desktop list stays compact.
  const rowPad = variant === "drawer" ? "py-2.5" : "py-2";

  const item = (id: string, label: string, Icon?: React.ComponentType<{ className?: string }>) => {
    const active = activeIntent === id;
    return (
      <li key={id}>
        <button
          type="button"
          onClick={() => onAsk(id)}
          aria-current={active ? "true" : undefined}
          aria-label={rail ? label : undefined}
          className={cn(
            "side-row group relative flex w-full items-center gap-3 rounded-xl text-left text-[15px] font-medium text-muted transition-colors hover:text-fg",
            rowPad,
            rail ? "justify-center px-0" : "px-3",
            active && "text-fg",
          )}
        >
          {active && (
            <motion.span
              layoutId={`active-pill-${variant}`}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="absolute inset-0 rounded-xl bg-surface"
            />
          )}
          {!active && <span className="absolute inset-0 rounded-xl transition-colors group-hover:bg-surface/70" />}
          {Icon && <Icon className="relative size-[18px] shrink-0" />}
          {rail ? <RailTip>{label}</RailTip> : <span className="relative truncate">{label}</span>}
        </button>
      </li>
    );
  };

  const ToggleIcon = variant === "drawer" ? X : rail ? PanelLeftOpen : PanelLeftClose;

  return (
    <nav aria-label="Topics" className={cn("flex h-full flex-col bg-bg-soft", rail ? "w-[4.25rem]" : "w-[17.5rem]")}>
      <div className={cn("flex items-center pt-3 pb-2", rail ? "flex-col gap-1 px-2" : "justify-between px-3")}>
        <div className="flex items-center gap-2.5 px-1.5 py-1">
          <Avatar size={34} />
          {!rail && (
            <button type="button" onClick={onNew} className="rounded-lg px-1 text-[17px] font-semibold tracking-tight pointer-coarse:min-h-11 pointer-coarse:min-w-11">
              {profile.shortName}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          data-drawer-close={variant === "drawer" ? "" : undefined}
          className="group relative icon-btn"
          aria-label={variant === "drawer" ? "Close menu" : rail ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ToggleIcon className="size-5" />
          {rail && <RailTip>Expand sidebar</RailTip>}
        </button>
      </div>

      <div className={rail ? "px-2" : "px-3"}>
        <button
          type="button"
          onClick={onNew}
          aria-label={rail ? "New chat" : undefined}
          className={cn(
            "side-row group relative flex w-full items-center gap-3 rounded-xl text-[15px] font-semibold transition-colors hover:bg-surface",
            rowPad,
            rail ? "justify-center" : "px-3",
          )}
        >
          <SquarePen className="size-[18px]" />
          {rail ? <RailTip>New chat</RailTip> : "New chat"}
        </button>
      </div>

      {/* Touch rail rows are 44px, so on short tablets the rail scrolls instead of pushing the footer off screen. */}
      <div className={cn("mt-4 flex-1 pb-4", rail ? "no-scrollbar min-h-0 overflow-visible px-2 pointer-coarse:overflow-y-auto" : "no-scrollbar overflow-y-auto px-3")}>
        {!rail && <div className="eyebrow px-3 pb-2">Ask about</div>}
        <ul className="space-y-1">{primaryIntents.map((i) => item(i.id, i.label, i.icon))}</ul>
        {!rail && (
          <>
            <div className="eyebrow mt-6 px-3 pb-2">Projects</div>
            <ul className="space-y-1">{projects.map((p) => item(`project-${p.id}`, p.name))}</ul>
          </>
        )}
      </div>

      {/* One-row footer: who this is, plus profile links. */}
      <div className={cn("flex items-center gap-2 border-t border-line py-2.5", rail ? "justify-center px-2" : "px-3")}>
        <Avatar size={32} />
        {!rail && (
          <>
            {/* The narrow phone drawer shows the short name (as in its header), so it is never cut off. */}
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{variant === "drawer" ? profile.shortName : profile.name}</span>
            <a href={profile.links.github} target="_blank" rel="noreferrer" className="icon-btn size-8" aria-label="GitHub">
              <Github className="size-4" />
            </a>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="icon-btn size-8" aria-label="LinkedIn">
              <Linkedin className="size-4" />
            </a>
          </>
        )}
      </div>
    </nav>
  );
}
