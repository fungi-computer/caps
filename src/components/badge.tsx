import { forwardRef, type HTMLAttributes } from "react";

import { cn, cva } from "../lib/cn.js";

/** Supported BadgeTone values. */
export type BadgeTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "error";
/** Supported BadgeSize values. */
export type BadgeSize = "sm" | "default" | "lg";
/** `quiet` is a soft tint with no outline, for labels that sit beside keys. */
export type BadgeVariant = "solid" | "quiet";

const badgeVariants = cva("badge caps-badge", {
  variants: {
    tone: {
      neutral: "badge-neutral",
      primary: "badge-primary",
      secondary: "badge-secondary",
      accent: "badge-accent",
      success: "badge-success",
      info: "badge-info",
      warning: "badge-warning",
      error: "badge-error",
    },
    size: { sm: "badge-sm", default: "badge-md", lg: "badge-lg" },
    variant: { solid: "", quiet: "caps-badge-quiet" },
  },
  defaultVariants: { tone: "neutral", size: "default" },
});

/** Props accepted by Badge. */
export type BadgeProps = {
  size?: BadgeSize;
  variant?: BadgeVariant;
  tone?: BadgeTone;
} & HTMLAttributes<HTMLSpanElement>;

/** A compact status or category label. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, size, tone, variant, ...props },
  ref,
) {
  return (
    <span
      {...props}
      className={cn(badgeVariants({ size, tone, variant }), className)}
      ref={ref}
    />
  );
});
