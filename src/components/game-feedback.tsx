import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { PixelNumber } from "./pixel-number.js";

/** What happened: an order taken, an order refused, a hit, or something gained. */
export type FeedbackKind = "confirm" | "deny" | "hit" | "gain";

/** Props accepted by FeedbackLayer. */
export type FeedbackLayerProps = HTMLAttributes<HTMLDivElement> & {
  /** Freeze every mark where it is, e.g. while the game is paused. */
  paused?: boolean;
};

/**
 * A click-through overlay for game feedback, placed over the world by the
 * host. Marks inside it are positioned in the layer's own pixels.
 */
export const FeedbackLayer = forwardRef<HTMLDivElement, FeedbackLayerProps>(
  function FeedbackLayer({ paused = false, className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={cn("caps-feedback-layer", className)}
        data-paused={paused}
      />
    );
  },
);

/** Props accepted by FeedbackMark. */
export type FeedbackMarkProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  kind: FeedbackKind;
  /** Anchor in layer pixels. */
  x: number;
  y: number;
  /** A short note, such as the host's refusal reason. */
  label?: ReactNode;
  /** A floating number, drawn signed in outlined pixel numerals. */
  amount?: number;
  /** Total life in milliseconds; the host removes the mark when it ends. */
  life?: number;
};

/** Mark geometry and life as custom properties; the stylesheet animates them. */
type MarkPlacement = CSSProperties &
  Record<
    "--caps-feedback-x" | "--caps-feedback-y" | "--caps-feedback-life",
    string
  >;

function placement(
  style: CSSProperties | undefined,
  x: number,
  y: number,
  life: number,
): MarkPlacement {
  return {
    ...style,
    "--caps-feedback-x": `${String(Math.round(x))}px`,
    "--caps-feedback-y": `${String(Math.round(y))}px`,
    "--caps-feedback-life": `${String(life)}ms`,
  };
}

/** Gains read gold against a green world; losses always read red. */
const AMOUNT_TONE = {
  confirm: "success",
  deny: "error",
  hit: "error",
  gain: "warning",
} as const satisfies Record<FeedbackKind, "success" | "error" | "warning">;

/**
 * One piece of game feedback at a point: a stepped flash ring, an optional
 * floating number and an optional note. Reduced motion keeps the ring and
 * note still and only fades them.
 */
export const FeedbackMark = forwardRef<HTMLDivElement, FeedbackMarkProps>(
  function FeedbackMark(
    { kind, x, y, label, amount, life = 900, className, style, ...props },
    ref,
  ) {
    if (![x, y, life].every(Number.isFinite) || life <= 0)
      throw new RangeError("FeedbackMark needs a finite point and life");
    return (
      <div
        {...props}
        ref={ref}
        className={cn("caps-feedback-mark", className)}
        data-kind={kind}
        style={placement(style, x, y, life)}
      >
        <span className="caps-feedback-ring" aria-hidden="true" />
        {amount === undefined ? null : (
          <span className="caps-feedback-amount">
            <PixelNumber
              value={amount}
              signed
              outline
              size="lg"
              tone={amount < 0 ? "error" : AMOUNT_TONE[kind]}
            />
          </span>
        )}
        {label === undefined ? null : (
          <span className="caps-feedback-note">{label}</span>
        )}
      </div>
    );
  },
);

/** A generic feedback tone: game-neutral, so any cartridge can author with
 * it. `bite` is for a creature's bite, not any one game's monster. */
export type FeedbackWordTone =
  "impact" | "gun" | "mech" | "wet" | "quiet" | "bite";
/** Named display sizes for game feedback words. */
export type FeedbackWordSize = "s" | "m" | "l" | "xl";
/** A two-phase accent that plays alongside the word: `jaw` claps two wedges
 * shut once, then eases back open. */
export type FeedbackWordAccent = "jaw";

/** Props accepted by FeedbackWordMark. */
export type FeedbackWordMarkProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** Comic lettering, at most 12 characters (e.g. "CRUNCH", "BLAM"). */
  text: string;
  /** Anchor in layer pixels; the word sits bottom-centre above this point. */
  x: number;
  y: number;
  tone?: FeedbackWordTone;
  size?: FeedbackWordSize;
  accent?: FeedbackWordAccent;
  /** Total life in milliseconds; the host removes the mark when it ends. */
  life?: number;
};

/**
 * One comic sound word at a point: punchy lettering that pops in with a
 * little overshoot, drifts up, and fades. Reduced motion keeps it still at
 * full strength until the host removes it.
 */
export const FeedbackWordMark = forwardRef<
  HTMLDivElement,
  FeedbackWordMarkProps
>(function FeedbackWordMark(
  {
    text,
    x,
    y,
    tone = "impact",
    size = "m",
    accent,
    life = 700,
    className,
    style,
    ...props
  },
  ref,
) {
  if (![x, y, life].every(Number.isFinite) || life <= 0)
    throw new RangeError("FeedbackWordMark needs a finite point and life");
  if (text.length < 1 || text.length > 12)
    throw new RangeError("FeedbackWordMark text must be 1-12 characters");
  return (
    <div
      {...props}
      ref={ref}
      className={cn("caps-feedback-word", className)}
      data-tone={tone}
      data-size={size}
      data-accent={accent}
      style={placement(style, x, y, life)}
    >
      {accent === "jaw" ? (
        <span className="caps-feedback-word-jaw" aria-hidden="true">
          <span className="caps-feedback-word-jaw-top" />
          <span className="caps-feedback-word-jaw-bottom" />
        </span>
      ) : null}
      <span className="caps-feedback-word-text" aria-hidden="true">
        {text}
      </span>
    </div>
  );
});
