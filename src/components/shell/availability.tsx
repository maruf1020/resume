"use client";

import { cn } from "@/lib/utils";

/** Live availability badge. Click = "Hire me". */
export function Availability({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="I'm open to new roles - click to see how to hire me"
      className={cn(
        "flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm transition-colors hover:border-surface-strong hover:bg-surface",
        className,
      )}
    >
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-semibold whitespace-nowrap">
        Open to <span className="hidden sm:inline">new </span>roles
      </span>
    </button>
  );
}
