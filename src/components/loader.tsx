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
  /** The surrounding ink, for a loader inside a button. */
  current: "text-current",
} as const;

/** Fluid motion formations, sharing one material. */
export type LoaderVariant = "line" | "wander" | "square" | "donut" | "bloom";

/** How briskly a formation cycles: `working` for a wait, `idle` for art. */
export type LoaderPace = "working" | "idle";

/** Props accepted by Loader. */
export type LoaderProps = {
  decorative?: boolean;
  label?: ReactNode;
  /** `fill` grows the formation to its container, as a full-tile placeholder. */
  size?: "sm" | "md" | "lg" | "fill";
  variant?: LoaderVariant;
  /** `idle` slows the cycle for decorative art such as an empty state. */
  pace?: LoaderPace;
  tone?: "neutral" | "accent" | "primary" | "success" | "current";
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
    pace = "working",
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
      data-pace={pace}
      role={decorative ? undefined : "status"}
      ref={ref}
    >
      <LoaderBlobs variant={variant} pace={pace} />
      {ownsLabel ? <VisuallyHidden id={labelId}>{label}</VisuallyHidden> : null}
    </span>
  );
});
