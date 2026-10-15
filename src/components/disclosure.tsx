import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn, cva } from "../lib/cn.js";

/** Semantic tone of the disclosure header. */
export type DisclosureTone = "neutral" | "error";
/** Density: `group` for a summary header, `row` for a compact nested row. */
export type DisclosureSize = "group" | "row";

const disclosureVariants = cva("caps-disclosure", {
  variants: {
    tone: { neutral: "", error: "caps-disclosure-error" },
    size: { group: "caps-disclosure-group", row: "caps-disclosure-row" },
  },
  defaultVariants: { tone: "neutral", size: "group" },
});

/** Props accepted by Disclosure. */
export type DisclosureProps = Readonly<{
  /** Controlled open state; the caller owns persistence. */
  open: boolean;
  /** Called with the requested open state. */
  onOpenChange: (open: boolean) => void;
  /** One-line header content. */
  summary: ReactNode;
  /** Optional leading visual, such as a status bead or icon. */
  leading?: ReactNode;
  /** Optional trailing metadata, such as a duration. */
  trailing?: ReactNode;
  /** Panel content, mounted only while open. */
  children?: ReactNode;
  tone?: DisclosureTone;
  size?: DisclosureSize;
  className?: string;
}>;

/**
 * A controlled one-line disclosure over Base UI Collapsible. The header is a
 * native button carrying `aria-expanded` and `aria-controls`, so Enter and
 * Space toggle it.
 */
export function Disclosure({
  open,
  onOpenChange,
  summary,
  leading,
  trailing,
  children,
  tone,
  size,
  className,
}: DisclosureProps) {
  return (
    <Collapsible.Root
      className={cn(disclosureVariants({ tone, size }), className)}
      onOpenChange={onOpenChange}
      open={open}
    >
      <Collapsible.Trigger className="caps-disclosure-trigger">
        {leading === undefined ? null : (
          <span className="caps-disclosure-leading">{leading}</span>
        )}
        <span className="caps-disclosure-summary">{summary}</span>
        {trailing === undefined ? null : (
          <span className="caps-disclosure-trailing">{trailing}</span>
        )}
        <ChevronRight
          aria-hidden="true"
          className="caps-disclosure-chevron"
          size={12}
        />
      </Collapsible.Trigger>
      <Collapsible.Panel className="caps-disclosure-panel">
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
