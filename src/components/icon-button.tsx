import { forwardRef, type ReactNode } from "react";

import { cn } from "../lib/cn.js";
import { Button, type ButtonProps } from "./button.js";

/** Supported IconButton glyph sizes. */
export type IconButtonIconSize = "xs" | "sm" | "md" | "lg";

const iconSizeClasses = {
  xs: "size-3",
  sm: "size-[var(--stipe-icon-size-sm)]",
  md: "size-[var(--stipe-icon-size-md)]",
  lg: "size-[var(--stipe-icon-size-lg)]",
} satisfies Record<IconButtonIconSize, string>;

/** Props accepted by IconButton. */
export type IconButtonProps = {
  "aria-label": string;
  active?: boolean;
  icon: ReactNode;
  iconSize?: IconButtonIconSize;
  reveal?: boolean;
  size?: ButtonProps["size"] | "responsive";
  tone?: "default" | "destructive";
} & Omit<ButtonProps, "children" | "size">;

/** A compact button for an icon control with an accessible name supplied by the caller. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      active = false,
      icon,
      iconSize = "xs",
      className,
      reveal = false,
      size = "xs",
      tone = "default",
      variant = "ghost",
      ...props
    },
    ref,
  ) {
    const responsive = size === "responsive";

    return (
      <Button
        {...props}
        // A result beat on an icon shows the check alone.
        resultLabel={props.result === undefined ? undefined : null}
        ref={ref}
        size={responsive ? "sm" : size}
        variant={variant}
        className={cn(
          "caps-icon-button btn-circle",
          responsive && "caps-icon-button-responsive md:btn-xs",
          active && "text-accent",
          reveal &&
            "scale-0 transition-transform group-hover:scale-100 focus-visible:scale-100",
          tone === "destructive" && "hover:text-error",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex shrink-0 [&>svg]:size-full [&>svg]:[stroke-width:var(--stipe-icon-stroke)]",
            iconSizeClasses[iconSize],
          )}
        >
          {icon}
        </span>
      </Button>
    );
  },
);
