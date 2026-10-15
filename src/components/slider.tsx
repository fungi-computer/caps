import { forwardRef, type InputHTMLAttributes } from "react";

import { cn, cva } from "../lib/cn.js";

/** Supported SliderTone values. */
export type SliderTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "error";

/** Supported SliderSize values. */
export type SliderSize = "xs" | "sm" | "default" | "lg";

const sliderVariants = cva("range caps-slider", {
  variants: {
    tone: {
      neutral: "range-neutral",
      primary: "range-primary",
      secondary: "range-secondary",
      accent: "range-accent",
      success: "range-success",
      info: "range-info",
      warning: "range-warning",
      error: "range-error",
    },
    size: {
      xs: "range-xs",
      sm: "range-sm",
      default: "range-md",
      lg: "range-lg",
    },
  },
  defaultVariants: { tone: "neutral", size: "default" },
});

/** Props accepted by Slider. */
export type SliderProps = {
  size?: SliderSize;
  tone?: SliderTone;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type">;

/**
 * A native range input with product-neutral tone and size variants. On a
 * Screen it reads the screen context and draws as a segmented level.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { className, size, tone, ...props },
  ref,
) {
  return (
    <input
      {...props}
      className={cn(sliderVariants({ size, tone }), className)}
      ref={ref}
      type="range"
    />
  );
});
