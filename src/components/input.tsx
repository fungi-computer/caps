import { forwardRef, type ReactNode, type InputHTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by Input. */
export type InputProps = {
  invalid?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

/** A styled native text input that preserves caller-owned value and event behavior. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      {...props}
      aria-invalid={
        invalid
          ? true
          : props["aria-invalid"] === false
            ? undefined
            : props["aria-invalid"]
      }
      className={cn("input caps-input w-full", className)}
      ref={ref}
    />
  );
});

/** A native search input with an optional decorative leading icon. */
export const SearchInput = forwardRef<
  HTMLInputElement,
  InputProps & { leading?: ReactNode }
>(function SearchInput({ leading, className, ...props }, ref) {
  return (
    <span
      className="caps-search-input"
      data-leading={leading ? "true" : undefined}
    >
      {leading ? (
        <span className="caps-search-leading" aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <Input {...props} type="search" className={className} ref={ref} />
    </span>
  );
});
