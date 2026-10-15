import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by CountBadge. */
export type CountBadgeProps = {
  count: ReactNode;
  /** Semantic count emphasis; warnings call attention to items needing action. */
  tone?: "neutral" | "warning";
  label?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

/** A badge displaying a caller-provided count and label. */
export const CountBadge = forwardRef<HTMLSpanElement, CountBadgeProps>(
  function CountBadge(
    { className, count, label, tone = "neutral", ...props },
    ref,
  ) {
    return (
      <span
        {...props}
        className={cn("inline-flex items-center gap-xs", className)}
        ref={ref}
      >
        <span
          className={
            tone === "warning"
              ? "badge badge-warning badge-sm tabular-nums caps-numeric"
              : "badge badge-neutral badge-sm tabular-nums caps-numeric"
          }
        >
          {count}
        </span>
        {label !== undefined ? (
          <span className="text-sm text-base-content">{label}</span>
        ) : null}
      </span>
    );
  },
);
