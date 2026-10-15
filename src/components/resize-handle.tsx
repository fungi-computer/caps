import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

/** Accessible grip presentation with caller-owned resize state and pointer gesture. */
export type ResizeHandleProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  "aria-label": string;
  orientation: "horizontal" | "vertical";
  variant?: "grip" | "notch";
  value: number;
  min: number;
  max: number;
  /** Receives a clamped pixel position from keyboard controls. */
  onValueChange: (value: number) => void;
};

/** Visual and keyboard surface for a caller-owned resize gesture. */
export const ResizeHandle = forwardRef<HTMLDivElement, ResizeHandleProps>(
  function ResizeHandle(
    {
      className,
      orientation,
      variant = "grip",
      value,
      min,
      max,
      onValueChange,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        className={cn("caps-resize-handle", className)}
        data-resize-variant={variant}
        role="separator"
        aria-orientation={orientation}
        aria-valuemin={Math.round(min)}
        aria-valuemax={Math.round(max)}
        aria-valuenow={Math.round(value)}
        tabIndex={props.tabIndex ?? 0}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            onValueChange(event.key === "Home" ? min : max);
            return;
          }
          const step =
            orientation === "horizontal"
              ? event.key === "ArrowUp"
                ? -32
                : event.key === "ArrowDown"
                  ? 32
                  : null
              : event.key === "ArrowLeft"
                ? -32
                : event.key === "ArrowRight"
                  ? 32
                  : null;
          if (step === null) return;
          event.preventDefault();
          onValueChange(Math.min(max, Math.max(min, value + step)));
        }}
      >
        <span className="caps-resize-grip" aria-hidden="true" />
      </div>
    );
  },
);
