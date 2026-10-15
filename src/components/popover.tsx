import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** The positioned box a Popover attaches to. */
export const PopoverAnchor = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function PopoverAnchor({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("caps-popover-anchor", className)}
    />
  );
});

/** Props accepted by Popover. */
export type PopoverProps = HTMLAttributes<HTMLDivElement> & {
  /** Whether the popover is shown. */
  open: boolean;
  /** Which edge of the anchor it opens from. */
  side?: "top" | "bottom";
};

/**
 * A non-modal raised panel attached to its PopoverAnchor. It never takes
 * focus, so the anchored control (for example a composer) keeps typing while
 * the popover lists suggestions.
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  function Popover({ className, open, side = "top", ...props }, ref) {
    if (!open) return null;
    return (
      <div
        {...props}
        ref={ref}
        className={cn("caps-popover", className)}
        data-side={side}
      />
    );
  },
);

/** Props accepted by PopoverOption. */
export type PopoverOptionProps = HTMLAttributes<HTMLDivElement> & {
  /** Whether keyboard navigation currently highlights this option. */
  active: boolean;
};

/** One option row inside a Popover list; pointer presses keep focus where it is. */
export const PopoverOption = forwardRef<HTMLDivElement, PopoverOptionProps>(
  function PopoverOption({ active, className, onMouseDown, ...props }, ref) {
    return (
      <div
        role="option"
        aria-selected={active}
        {...props}
        ref={ref}
        className={cn("caps-popover-option", className)}
        data-active={active}
        onMouseDown={(event) => {
          event.preventDefault();
          onMouseDown?.(event);
        }}
      />
    );
  },
);
