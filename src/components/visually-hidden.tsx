import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by VisuallyHidden. */
export type VisuallyHiddenProps = {
  asChild?: boolean;
} & HTMLAttributes<HTMLElement>;

/** Content visually hidden while remaining available to assistive technology. */
export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(
  function VisuallyHidden({ asChild = false, className, ...props }, ref) {
    const classes = cn(
      "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]",
      className,
    );
    if (asChild) return <Slot {...props} className={classes} ref={ref} />;
    return <span {...props} className={classes} ref={ref} />;
  },
);
