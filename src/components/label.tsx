import { forwardRef, type LabelHTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by Label. */
export type LabelProps = {
  /** Adds a quiet "Optional" readout after the text. */
  optional?: boolean;
  required?: boolean;
} & LabelHTMLAttributes<HTMLLabelElement>;

/** A label primitive that associates caller-provided text with a form control. */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { children, className, optional, required, ...props },
  ref,
) {
  return (
    <label
      {...props}
      className={cn(
        "label caps-label cursor-pointer justify-start gap-sm text-sm font-semibold text-base-content",
        className,
      )}
      ref={ref}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="text-error">
          *
        </span>
      ) : null}
      {optional && !required ? (
        <span className="caps-label-optional">Optional</span>
      ) : null}
    </label>
  );
});
