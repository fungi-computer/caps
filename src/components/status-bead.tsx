import { animate, type AnimationParams } from "animejs";
import { motionTime, readMotion, useMotion } from "../lib/motion.js";
import {
  immediateTiming,
  themedEase,
  themedSpring,
} from "../lib/motion-spring.js";
import { useId, useLayoutEffect, useRef } from "react";

import {
  GooeyFilterDefinition,
  STATUS_GOOEY_FILTER,
  GooeySurfaceDefinition,
  GooeyShadowDefinition,
} from "./gooey.js";
import type { StatusMotion } from "./status.js";

/** The bead's own silhouettes. */
export type BeadGlyph = "dot" | "pill" | "bang";
import { observeMotionVisibility } from "./motion-visibility.js";

const silhouettes = {
  dot: { y: -4, height: 8, cy: 0 },
  pill: { y: -16, height: 32, cy: 0 },
  bang: { y: -16, height: 20, cy: 12 },
} satisfies Record<BeadGlyph, { y: number; height: number; cy: number }>;

/** @internal Persistent SVG geometry; Anime owns the moving attributes. */
export function StatusBead({
  className,
  glyph,
  motion,
}: {
  className?: string;
  glyph: BeadGlyph;
  motion: StatusMotion;
}) {
  const id = `caps-status-${useId().replaceAll(":", "")}`;
  const body = useRef<SVGRectElement>(null);
  const drop = useRef<SVGCircleElement>(null);
  const activity = useRef<SVGGElement>(null);
  const visual = useRef<SVGSVGElement>(null);
  const surface = useRef<SVGRadialGradientElement>(null);
  const dropLight = useRef<SVGRectElement>(null);
  const initial = useRef(silhouettes[glyph]).current;
  const initialSurface = useRef(glyph === "dot" ? 1 : 4).current;
  const initialDropLight = useRef(glyph === "bang" ? 1 : 0).current;
  const previous = useRef(glyph);
  const feel = useMotion(visual);
  const { reduced } = feel;

  useLayoutEffect(() => {
    if (
      !body.current ||
      !drop.current ||
      !surface.current ||
      !dropLight.current
    )
      return;
    const target = silhouettes[glyph];
    const immediate = reduced || previous.current === glyph;
    previous.current = glyph;
    const motion = readMotion(body.current);
    const timing: AnimationParams = immediate
      ? { duration: 0 }
      : themedSpring(motion, { bounce: 0.3, duration: 360 });
    const morph = animate(body.current, {
      y: target.y,
      height: target.height,
      ...timing,
    });
    const separation = animate(drop.current, {
      cy: target.cy,
      ...(immediate
        ? { duration: 0 }
        : {
            delay: motionTime(motion, 35),
            ...themedSpring(motion, { bounce: 0.3, duration: 420 }),
          }),
    });
    const material = animate(surface.current, {
      gradientTransform: `matrix(1 0 0 ${glyph === "dot" ? "1" : "4"} 0 0)`,
      ...timing,
    });
    const highlight = animate(dropLight.current, {
      opacity: glyph === "bang" ? 1 : 0,
      ...(immediate
        ? immediateTiming
        : themedEase(motion, { ease: "inOutSine", duration: 220 })),
    });
    // Cancellation preserves the current geometry for the next target.
    return () => {
      morph.cancel();
      separation.cancel();
      material.cancel();
      highlight.cancel();
    };
  }, [glyph, reduced]);

  useLayoutEffect(() => {
    if (!activity.current || !visual.current || reduced || motion === "none")
      return;
    const loop =
      motion === "pulse"
        ? animate(activity.current, {
            opacity: [1, 0.45],
            ...themedEase(feel, { ease: "inOutSine", duration: 750 }),
            alternate: true,
            loop: true,
          })
        : animate(activity.current, {
            keyframes: {
              "0%": { translateY: 0, scaleX: 1, scaleY: 1 },
              "18%": { translateY: 0.25, scaleX: 1.1, scaleY: 0.91 },
              "42%": { translateY: -1.3, scaleX: 0.94, scaleY: 1.06 },
              "62%": { translateY: -1.65, scaleX: 1, scaleY: 1 },
              "82%": { translateY: 0.15, scaleX: 1.06, scaleY: 0.95 },
              "100%": { translateY: 0, scaleX: 1, scaleY: 1 },
            },
            ...themedEase(feel, { ease: "inOutSine", duration: 1000 }),
            loop: true,
          });
    const stopObserving = observeMotionVisibility(visual.current, (visible) => {
      if (visible) loop.resume();
      else loop.pause();
    });
    return () => {
      stopObserving();
      loop.revert();
    };
  }, [motion, reduced, feel]);

  return (
    <svg
      ref={visual}
      aria-hidden="true"
      className={`caps-status-bead ${className ?? ""}`}
      width="8"
      height="8"
      viewBox="-4 -4 8 8"
      focusable="false"
    >
      <defs>
        <GooeyFilterDefinition id={id} values={STATUS_GOOEY_FILTER} />
        <GooeySurfaceDefinition
          ref={surface}
          id={`${id}-surface`}
          transform={`matrix(1 0 0 ${String(initialSurface)} 0 0)`}
        />
        <radialGradient
          id={`${id}-drop-light`}
          gradientUnits="userSpaceOnUse"
          cx="-1.2"
          cy="10.4"
          r="5.6"
        >
          <stop
            offset="0"
            stopColor="var(--color-white)"
            style={{ stopOpacity: "calc(var(--depth) * 0.5)" }}
          />
          <stop offset="1" stopColor="var(--color-white)" stopOpacity="0" />
        </radialGradient>
        <GooeyShadowDefinition id={`${id}-shadow`} />
        <mask
          id={`${id}-silhouette`}
          maskUnits="userSpaceOnUse"
          x="-12"
          y="-24"
          width="24"
          height="48"
          style={{ maskType: "alpha" }}
        >
          <g fill="var(--color-white)" filter={`url(#${id})`}>
            <rect
              ref={body}
              x="-4"
              y={initial.y}
              width="8"
              height={initial.height}
              rx="4"
            />
            <circle ref={drop} cx="0" cy={initial.cy} r="4" />
          </g>
        </mask>
      </defs>
      <g ref={activity} filter={`url(#${id}-shadow)`}>
        <g mask={`url(#${id}-silhouette)`}>
          <rect
            x="-12"
            y="-24"
            width="24"
            height="48"
            fill={`url(#${id}-surface)`}
          />
          <rect
            ref={dropLight}
            x="-12"
            y="-24"
            width="24"
            height="48"
            fill={`url(#${id}-drop-light)`}
            opacity={initialDropLight}
          />
        </g>
      </g>
    </svg>
  );
}
