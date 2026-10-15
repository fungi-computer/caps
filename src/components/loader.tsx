import { forwardRef, type HTMLAttributes, type ReactNode, useId } from "react";

import { cn } from "../lib/cn.js";
import { VisuallyHidden } from "./visually-hidden.js";
import { LoaderBlobs } from "./loader-blobs.js";

const sizeClasses = {
  sm: "caps-loader-sm",
  md: "caps-loader-md",
  lg: "caps-loader-lg",
  fill: "caps-loader-fill",
} as const;

const toneClasses = {
  neutral: "text-base-content",
  accent: "text-accent",
  primary: "text-primary",
  success: "text-success",
} as const;

/** Fluid motion formations, sharing one material. */
export type LoaderVariant = "line" | "wander" | "square" | "donut" | "bloom";

/** Props accepted by Loader. */
export type LoaderProps = {
  decorative?: boolean;
  label?: ReactNode;
  /** `fill` grows the formation to its container, as a full-tile placeholder. */
  size?: "sm" | "md" | "lg" | "fill";
  variant?: LoaderVariant;
  tone?: "neutral" | "accent" | "primary" | "success";
} & HTMLAttributes<HTMLSpanElement>;

/** Connecting gooey beads, with a static silhouette for reduced motion. */
export const Loader = forwardRef<HTMLSpanElement, LoaderProps>(function Loader(
  {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    className,
    decorative = false,
    label = "Loading",
    size = "md",
    variant = "line",
    tone = "neutral",
    ...props
  },
  ref,
) {
  const labelId = `${useId()}-label`;
  const ownsLabel =
    !decorative && ariaLabel === undefined && ariaLabelledby === undefined;
  return (
    <span
      {...props}
      aria-label={decorative ? undefined : ariaLabel}
      aria-hidden={decorative || undefined}
      aria-labelledby={
        decorative
          ? undefined
          : (ariaLabelledby ?? (ariaLabel === undefined ? labelId : undefined))
      }
      className={cn(
        "caps-loader",
        sizeClasses[size],
        toneClasses[tone],
        className,
      )}
      data-variant={variant}
      role={decorative ? undefined : "status"}
      ref={ref}
    >
      <LoaderBlobs variant={variant} />
      {ownsLabel ? <VisuallyHidden id={labelId}>{label}</VisuallyHidden> : null}
    </span>
  );
});
