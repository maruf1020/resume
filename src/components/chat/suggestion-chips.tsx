"use client";

import { Ellipsis } from "lucide-react";
import { getIntent, type Intent } from "@/content/intents";
import { cn } from "@/lib/utils";

type Props = {
  ids?: string[];
  intents?: Intent[];
  onPick: (intentId: string) => void;
  /** Wrap onto several lines instead of scrolling sideways. */
  wrap?: boolean;
  /** Centre the chips (wrapping on desktop, still swipeable on phones). */
  center?: boolean;
  /** Small chips on a single line (the bottom dock). */
  compact?: boolean;
  /** Adds a trailing "More" chip. */
  onMore?: () => void;
  className?: string;
};

export function SuggestionChips({ ids, intents, onPick, wrap, center, compact, onMore, className }: Props) {
  const list = intents ?? (ids ?? []).map((id) => getIntent(id)).filter((i): i is Intent => !!i);
  const chip = compact ? "chip chip-sm" : "chip";
  const icon = compact ? "size-3.5 text-faint" : "size-4 text-faint";
  const items = (
    <>
      {list.map((i) => (
        <li key={i.id} className="snap-start">
          <button type="button" className={chip} onClick={() => onPick(i.id)}>
            <i.icon className={icon} aria-hidden="true" />
            {i.label}
          </button>
        </li>
      ))}
      {onMore && (
        <li className="snap-start">
          <button type="button" className={chip} onClick={onMore}>
            <Ellipsis className={icon} aria-hidden="true" />
            More
          </button>
        </li>
      )}
    </>
  );

  if (compact)
    // One line: centred when it fits, scrolls sideways when it doesn't.
    return (
      <div className={cn("no-scrollbar -mx-4 snap-x overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
        <ul className="mx-auto flex w-max gap-1.5">{items}</ul>
      </div>
    );

  return (
    <ul
      className={cn(
        "flex gap-2",
        wrap ? "flex-wrap" : "no-scrollbar -mx-5 snap-x overflow-x-auto px-5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0",
        center && "md:justify-center",
        className,
      )}
    >
      {items}
    </ul>
  );
}
