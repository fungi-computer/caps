import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";
import { StatusBead } from "./status-bead.js";
import { StatusMark, type StatusMarkGlyph } from "./status-mark.js";

/**
 * The target silhouette. Bead glyphs (`dot`, `pill`, `bang`) morph between
 * each other; task glyphs (`ring` waiting, `arc` working, `check` finished,
 * `cross` refused) morph between each other.
 */
export type StatusGlyph = "dot" | "pill" | "bang" | StatusMarkGlyph;

const markGlyphs: ReadonlySet<StatusGlyph> = new Set<StatusMarkGlyph>([
  "ring",
  "arc",
  "check",
  "cross",
]);

function isMarkGlyph(glyph: StatusGlyph): glyph is StatusMarkGlyph {
  return markGlyphs.has(glyph);
}
/** Continuous activity, independent of the target silhouette. */
export type StatusMotion = "none" | "pulse" | "bounce";
/** Semantic colors supplied by the current Stipe theme. */
export type StatusTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "error";
/** Status size keeps secondary state compact in dense rows. */
export type StatusSize = "default" | "compact";
/** `chip` seats the bead and label in a tone-tinted pill. */
export type StatusAppearance = "plain" | "chip";

const toneClasses = {
  neutral: "text-base-content",
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  error: "text-error",
} satisfies Record<StatusTone, string>;

/** Presentation only: the caller maps its state to glyph, tone, and motion. */
export type StatusProps = {
  label?: ReactNode;
  glyph?: StatusGlyph;
  motion?: StatusMotion;
  tone?: StatusTone;
  size?: StatusSize;
  appearance?: StatusAppearance;
  /** For `arc`: how much is done, 0 to 1. Absent, the arc spins. */
  progress?: number | undefined;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/** A gooey SVG status bead with automatic, interruptible glyph transitions. */
export const Status = forwardRef<HTMLSpanElement, StatusProps>(function Status(
  {
    className,
    label,
    glyph = "dot",
    motion = "none",
    tone = "neutral",
    size = "default",
    appearance = "plain",
    progress,
    ...props
  },
  ref,
) {
  return (
    <span
      {...props}
      className={cn(
        "caps-status",
        size === "compact" && "caps-status-compact",
        appearance === "chip" && "caps-status-chip",
        className,
      )}
      data-tone={appearance === "chip" ? tone : undefined}
      data-glyph={glyph}
      data-motion={motion}
      ref={ref}
    >
      {isMarkGlyph(glyph) ? (
        <StatusMark
          className={toneClasses[tone]}
          glyph={glyph}
          progress={progress}
        />
      ) : (
        <StatusBead
          className={toneClasses[tone]}
          glyph={glyph}
          motion={motion}
        />
      )}
      {label !== undefined ? <span>{label}</span> : null}
    </span>
  );
});
