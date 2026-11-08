import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { Button } from "./button.js";
import { Status } from "./status.js";
import { cn } from "../lib/cn.js";

/** Props accepted by FailureLine. */
export type FailureLineProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** One plain line naming the real cause; never a raw code. */
  message: ReactNode;
  /** Called when Retry is chosen; without it no Retry button shows. */
  onRetry?: () => void;
  /** Called when Dismiss is chosen; without it no Dismiss button shows. */
  onDismiss?: () => void;
  retryLabel?: string;
  dismissLabel?: string;
  /** A more specific accessible name for Retry, such as "Retry prompt". */
  retryAriaLabel?: string;
  /** A more specific accessible name for Dismiss. */
  dismissAriaLabel?: string;
  /** How many times it failed; above 1 the line adds a "Failed" line with the count once. */
  count?: number;
  /** `row` sits in a list or under a control; `tile` fills a media tile. */
  density?: "row" | "tile";
  /** `status` is polite; use `alert` only for a single, urgent failure. */
  role?: "status" | "alert";
};

/**
 * One item failure: an error dot, one line, and labelled Retry and Dismiss.
 * It never uses the bang glyph; the dot is the whole signal.
 */
export const FailureLine = forwardRef<HTMLDivElement, FailureLineProps>(
  function FailureLine(
    {
      className,
      count,
      density = "row",
      dismissAriaLabel,
      dismissLabel = "Dismiss",
      message,
      onDismiss,
      onRetry,
      retryAriaLabel,
      retryLabel = "Retry",
      role = "status",
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        className={cn("caps-failure-line", className)}
        data-density={density}
        ref={ref}
        role={role}
      >
        <Status glyph="dot" tone="error" />
        <span className="caps-failure-line-copy">
          <span>{message}</span>
          {count !== undefined && count > 1 ? (
            <span className="caps-failure-line-count">
              Failed {count} times
            </span>
          ) : null}
        </span>
        {onRetry || onDismiss ? (
          <span className="caps-failure-line-actions">
            {onRetry ? (
              <Button
                aria-label={retryAriaLabel}
                size="sm"
                variant="outline"
                onClick={onRetry}
              >
                {retryLabel}
              </Button>
            ) : null}
            {onDismiss ? (
              <Button
                aria-label={dismissAriaLabel}
                size="sm"
                variant="ghost"
                onClick={onDismiss}
              >
                {dismissLabel}
              </Button>
            ) : null}
          </span>
        ) : null}
      </div>
    );
  },
);
