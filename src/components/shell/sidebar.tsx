"use client";

import { IntentLink } from "@/components/chat/intent-link";
import { motion } from "motion/react";
import { PanelLeftClose, PanelLeftOpen, SquarePen, X } from "lucide-react";
import { Facebook, Github, Instagram, Linkedin, Whatsapp } from "@/components/brand-icons";
import { Avatar } from "@/components/photo-viewer";
import { usePersona } from "@/lib/persona/context";
import { iconFor } from "@/lib/persona/icons";
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
  const persona = usePersona();
  const { identity } = persona;
  // Profile links in the footer, in this order (whichever the persona has).
  const SOCIAL = { github: Github, linkedin: Linkedin, facebook: Facebook, instagram: Instagram, whatsapp: Whatsapp } as const;
  const socials = (Object.keys(SOCIAL) as (keyof typeof SOCIAL)[]).flatMap((kind) => {
    const link = identity.links.find((l) => l.kind === kind);
    return link ? [{ ...link, Icon: SOCIAL[kind] }] : [];
  });
  // "Maruf Billah": given + family name when known (the full name may carry a prefix), else the full name.
  const displayName = [identity.givenName, identity.familyName].filter(Boolean).join(" ") || identity.name;
  const rail = variant === "desktop" && collapsed;
  // Drawer rows are finger-sized (44px+); the desktop list stays compact.
  const rowPad = variant === "drawer" ? "py-2.5" : "py-2";

  const item = (id: string, label: string, Icon?: React.ComponentType<{ className?: string }>) => {
    const active = activeIntent === id;
    return (
      <li key={id}>
        <IntentLink
          intentId={id}
          onPick={onAsk}
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
        </IntentLink>
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
              {displayName}
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
          aria-label={rail ? persona.labels.newChat : undefined}
          className={cn(
            "side-row group relative flex w-full items-center gap-3 rounded-xl text-[15px] font-semibold transition-colors hover:bg-surface",
            rowPad,
            rail ? "justify-center" : "px-3",
          )}
        >
          <SquarePen className="size-[18px]" />
          {rail ? <RailTip>{persona.labels.newChat}</RailTip> : persona.labels.newChat}
        </button>
      </div>

      {/* Touch rail rows are 44px, so on short tablets the rail scrolls instead of pushing the footer off screen. */}
      <div className={cn("mt-4 flex-1 pb-4", rail ? "no-scrollbar min-h-0 overflow-visible px-2 pointer-coarse:overflow-y-auto" : "no-scrollbar overflow-y-auto px-3")}>
        {/* The first group is the main topics (also the icon rail); the rest only show when the panel is open. */}
        {persona.sidebar.map((group, gi) =>
          rail && gi > 0 ? null : (
            <div key={group.title}>
              {!rail && <div className={cn("eyebrow px-3 pb-2", gi > 0 && "mt-6")}>{group.title}</div>}
              <ul className="space-y-1">
                {group.ids.map((id) => {
                  const q = persona.get(id);
                  return q ? item(q.id, q.label, group.icons || rail ? iconFor(q.icon) : undefined) : null;
                })}
              </ul>
            </div>
          ),
        )}
      </div>

      {/* Footer: profile links (the header already shows who this is). The slim rail keeps just the avatar. */}
      <div className={cn("flex items-center border-t border-line py-2.5", rail ? "justify-center px-2" : "justify-between px-4")}>
        {rail ? (
          <Avatar size={32} />
        ) : (
          socials.map(({ kind, href, label, Icon }) => (
            <a key={kind} href={href} target="_blank" rel="noreferrer me" className="icon-btn size-9" aria-label={label} title={label}>
              <Icon className="size-[18px]" />
            </a>
          ))
        )}
      </div>
    </nav>
  );
}
