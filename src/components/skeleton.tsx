import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by Skeleton. */
export type SkeletonProps = HTMLAttributes<HTMLSpanElement>;

/** A loading placeholder that preserves caller-provided native span props. */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <span
        {...props}
        aria-hidden={props["aria-hidden"] ?? true}
        className={cn("skeleton", className)}
        ref={ref}
      />
    );
  },
);
