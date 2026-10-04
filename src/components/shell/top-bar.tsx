"use client";

import { useState } from "react";
import { Check, Download, FileText, Link2, Menu, SquarePen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-provider";
import { Availability } from "./availability";
import { LanguageSwitch } from "./language-switch";
import { UnlockedPill } from "./unlocked-pill";
import { usePersona } from "@/lib/persona/context";
import { cn } from "@/lib/utils";

type Props = {
  onOpenDrawer: () => void;
  onNew: () => void;
  onAsk: (intentId: string) => void;
  /** The "Open menu" button, so focus can return to it when the drawer closes. */
  menuRef?: React.Ref<HTMLButtonElement>;
};

export function TopBar({ onOpenDrawer, onNew, onAsk, menuRef }: Props) {
  const persona = usePersona();
  const { document: doc, availability } = persona;
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 px-2 md:px-3">
      <button ref={menuRef} type="button" className="icon-btn lg:hidden" onClick={onOpenDrawer} aria-label="Open menu" aria-haspopup="dialog">
        <Menu className="size-5" />
      </button>

      {availability.show && <Availability onClick={availability.action ? () => onAsk(availability.action!) : undefined} className="ml-1" />}
      <UnlockedPill />

      <div className="ml-auto flex items-center gap-1">
        <button type="button" className="icon-btn" onClick={share} aria-label="Copy link to this answer">
          {copied ? <Check className="size-[18px] text-accent" /> : <Link2 className="size-[18px]" />}
        </button>
        <ThemeToggle />
        <button type="button" className="icon-btn lg:hidden" onClick={onNew} aria-label={persona.labels.newChat}>
          <SquarePen className="size-[18px]" />
        </button>
        <LanguageSwitch />
        {doc.pdfUrl ? (
          <>
            <a href={persona.fileHref(doc.pdfUrl)} download className="icon-btn sm:hidden" aria-label={doc.download}>
              <Download className="size-[18px]" />
            </a>
            <a href={persona.fileHref(doc.pdfUrl)} download className={cn("btn btn-primary ml-1 hidden py-2 text-sm sm:inline-flex")}>
              <Download className="size-4" /> {doc.label}
            </a>
          </>
        ) : (
          <>
            {/* No PDF for this visitor (not made yet, or shared with a code only): the document page explains. */}
            <a href={persona.href(doc.pageUrl)} className="icon-btn sm:hidden" aria-label={doc.label}>
              <FileText className="size-[18px]" />
            </a>
            <a href={persona.href(doc.pageUrl)} className={cn("btn btn-primary ml-1 hidden py-2 text-sm sm:inline-flex")}>
              <FileText className="size-4" /> {doc.label}
            </a>
          </>
        )}
      </div>
    </header>
  );
}
