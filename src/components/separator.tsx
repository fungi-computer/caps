import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by Separator. */
export type SeparatorProps = {
  decorative?: boolean;
  orientation?: "horizontal" | "vertical";
} & HTMLAttributes<HTMLDivElement>;

/** A visual separator between regions. */
export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  function Separator(
    { className, decorative = true, orientation = "horizontal", ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        aria-orientation={decorative ? undefined : orientation}
        className={cn(
          "shrink-0 bg-base-300",
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          className,
        )}
        role={decorative ? "none" : "separator"}
        ref={ref}
      />
    );
  },
);
