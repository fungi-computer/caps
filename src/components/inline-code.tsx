import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** A subdued inline code value for identifiers and other technical labels. */
export const InlineCode = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function InlineCode({ className, ...props }, ref) {
    return (
      <code
        {...props}
        className={cn("caps-inline-code", className)}
        ref={ref}
      />
    );
  },
);
