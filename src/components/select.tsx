import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "../lib/cn.js";

/** Props accepted by Select. */
export type SelectProps = {
  invalid?: boolean;
} & SelectHTMLAttributes<HTMLSelectElement>;

/** A styled native select that preserves caller-owned value and event behavior. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, ...props }, ref) {
    return (
      <span className="caps-select-shell">
        <select
          {...props}
          aria-invalid={
            invalid
              ? true
              : props["aria-invalid"] === false
                ? undefined
                : props["aria-invalid"]
          }
          className={cn(
            "select select-bordered caps-select w-full",
            invalid && "select-error",
            className,
          )}
          ref={ref}
        />
        {!props.multiple && (!props.size || props.size <= 1) ? (
          <ChevronDown className="caps-select-chevron" aria-hidden="true" />
        ) : null}
      </span>
    );
  },
);
