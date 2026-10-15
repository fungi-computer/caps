import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
} from "react";

import { cn } from "../lib/cn.js";
import { drawRough, type RoughMark, type RoughTone } from "./rough-drawing.js";

export type { RoughMark, RoughTone } from "./rough-drawing.js";

/** Props accepted by Rough. */
export type RoughProps = {
  /** The mark: a box, underline, circle, highlight, speech bubble or line. */
  mark: RoughMark;
  /** Theme ink (the default) or the primary accent. */
  tone?: RoughTone;
  /** Fixes the wobble, so the mark looks the same on every render. */
  seed?: number;
  /** Stroke width in CSS pixels. */
  weight?: number;
  /** 0 is a ruler, 3 is a scribble. */
  roughness?: number;
  /** Fill inside a box, circle or bubble. */
  fill?: "none" | "solid" | "hachure";
  /** For `bubble`: the lower corner its tail leaves from. */
  tail?: "left" | "right" | "none";
  /** For `line`: percent points in the box, e.g. `0,100 100,0`. */
  points?: string;
  /**
   * Draw the mark in once, stroke by stroke, after `delay`. Skipped for
   * reduced motion.
   */
  animate?: boolean;
  /** Seconds to wait before an `animate` mark draws in (default 0.2). */
  delay?: number;
  /** Render as a block (`div`) instead of inline (`span`). */
  block?: boolean;
} & HTMLAttributes<HTMLElement>;

/**
 * A hand-drawn Rough.js mark (box, underline, circle, highlight, speech bubble
 * or leader line) around its children, in theme ink or primary. Rough.js loads
 * lazily after hydration; until then, and without JavaScript, a plain CSS
 * border, underline or tint stands in. The mark is `aria-hidden` and never
 * takes pointer events, so the children keep their focus rings and clicks.
 *
 * Static pages can write the same attributes (see {@link drawRough}) instead
 * of hydrating this component.
 */
export const Rough = forwardRef<HTMLElement, RoughProps>(
  (
    {
      mark,
      tone = "ink",
      seed = 7,
      weight,
      roughness,
      fill,
      tail,
      points,
      animate = false,
      delay,
      block = false,
      className,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    const ref = useRef<HTMLElement | null>(null);
    useImperativeHandle(forwardedRef, () => {
      if (!ref.current) throw new Error("Rough is not mounted");
      return ref.current;
    }, []);
    useEffect(() => {
      const element = ref.current;
      if (!element) return;
      return drawRough(element);
    }, [mark, seed, weight, roughness, fill, tail, points]);
    const Element = block ? "div" : "span";
    return (
      <Element
        {...props}
        ref={(element: HTMLElement | null) => {
          ref.current = element;
        }}
        className={cn(
          "caps-rough",
          `caps-rough-${mark}`,
          tone === "primary" && "caps-rough-primary",
          className,
        )}
        data-caps-rough={mark}
        data-rough-seed={seed}
        data-rough-weight={weight}
        data-rough-roughness={roughness}
        data-rough-fill={fill}
        data-rough-tail={tail}
        data-rough-points={points}
        data-rough-animate={animate ? "" : undefined}
        data-rough-delay={delay}
      >
        {children}
      </Element>
    );
  },
);
Rough.displayName = "Rough";
