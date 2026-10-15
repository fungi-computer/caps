import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by Textarea. */
export type TextareaProps = {
  invalid?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

/** A styled multiline text input that preserves caller-owned value and event behavior. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, ...props }, ref) {
    return (
      <textarea
        {...props}
        aria-invalid={
          invalid
            ? true
            : props["aria-invalid"] === false
              ? undefined
              : props["aria-invalid"]
        }
        className={cn(
          "textarea textarea-bordered w-full",
          invalid && "textarea-error",
          className,
        )}
        ref={ref}
      />
    );
  },
);
