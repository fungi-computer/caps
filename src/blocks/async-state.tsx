import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** Supported AsyncStateValue values. */
export type AsyncStateValue = "loading" | "empty" | "error" | "content";

/** Props accepted by AsyncState. */
export type AsyncStateProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "content"
> & {
  /** The host's explicit state; this block does not infer it from its slots. */
  state: AsyncStateValue;
  loading: ReactNode;
  empty: ReactNode;
  error: ReactNode;
  content: ReactNode;
};

/** Selects a caller-rendered state region without fetching or inventing copy. */
export const AsyncState = forwardRef<HTMLDivElement, AsyncStateProps>(
  function AsyncState(
    { className, content, empty, error, loading, state, ...props },
    ref,
  ) {
    const regions = { content, empty, error, loading };
    return (
      <div {...props} className={cn("async-state", className)} ref={ref}>
        {regions[state]}
      </div>
    );
  },
);
