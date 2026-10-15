import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
} from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by InputGroup. */
export type InputGroupProps = HTMLAttributes<HTMLDivElement>;

/** Join a control with caller-owned prefixes, suffixes, or actions. */
export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  function InputGroup({ children, className, ...props }, ref) {
    return (
      <div
        {...props}
        className={cn(
          "caps-input-group join flex w-full items-stretch [&>*]:join-item [&>*:first-child]:rounded-e-none [&>*:last-child]:rounded-s-none [&>*:not(:first-child):not(:last-child)]:rounded-none [&>.btn]:shrink-0 [&>.input]:min-w-0 [&>.input]:flex-1 [&>.select]:min-w-0 [&>.select]:flex-1",
          className,
        )}
        ref={ref}
      >
        {Children.map(children, (child) =>
          isValidElement<{ className?: string }>(child)
            ? cloneElement(child, {
                className: cn(
                  "join-item caps-input-group-control",
                  child.props.className,
                ),
              })
            : child,
        )}
      </div>
    );
  },
);

/** Props accepted by InputGroupAddon. */
export type InputGroupAddonProps = HTMLAttributes<HTMLDivElement>;

/** An addon region for an InputGroup. */
export const InputGroupAddon = forwardRef<HTMLDivElement, InputGroupAddonProps>(
  function InputGroupAddon({ className, ...props }, ref) {
    return (
      <div
        {...props}
        className={cn(
          "join-item flex items-center border border-base-300 bg-base-200 px-md text-sm text-base-content",
          className,
        )}
        ref={ref}
      />
    );
  },
);
