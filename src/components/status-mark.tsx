import { animate, type JSAnimation } from "animejs";
import { useId, useLayoutEffect, useRef } from "react";

import { readMotion, useReducedMotion } from "../lib/motion.js";
import {
  immediateTiming,
  themedEase,
  themedSpring,
} from "../lib/motion-spring.js";
import { GooeySurfaceDefinition } from "./gooey.js";
import { observeMotionVisibility } from "./motion-visibility.js";

/** The task glyphs: waiting, working, finished, refused. */
export type StatusMarkGlyph = "ring" | "arc" | "check" | "cross";

/** An indeterminate arc covers this much of the ring while it spins. */
const spinnerSweep = 0.28;

type Pose = Readonly<{
  dashes: number;
  track: number;
  arc: number;
  sweep: number;
  disc: number;
  tick: number;
  cross: number;
}>;

function poseFor(glyph: StatusMarkGlyph, progress: number | undefined): Pose {
  switch (glyph) {
    case "ring":
      return {
        dashes: 1,
        track: 0,
        arc: 0,
        sweep: 0,
        disc: 0,
        tick: 0,
        cross: 0,
      };
    case "arc":
      return {
        dashes: 0,
        track: 1,
        arc: 1,
        sweep:
          progress === undefined
            ? spinnerSweep
            : Math.min(1, Math.max(0, progress)),
        disc: 0,
        tick: 0,
        cross: 0,
      };
    case "check":
      return {
        dashes: 0,
        track: 0,
        arc: 1,
        sweep: 1,
        disc: 1,
        tick: 1,
        cross: 0,
      };
    case "cross":
      return {
        dashes: 0,
        track: 0,
        arc: 1,
        sweep: 1,
        disc: 1,
        tick: 0,
        cross: 1,
      };
  }
}

/** The disc's radius when full, just covering the ring. */
const discRadius = 7.25;

/**
 * @internal A 16-unit task mark. A dashed ring waits; an arc works (spinning,
 * or filling to `progress`); when done the arc closes, the bead's material
 * springs out to a disc and a check (or cross) is drawn out of it.
 */
export function StatusMark({
  className,
  glyph,
  progress,
}: {
  className?: string;
  glyph: StatusMarkGlyph;
  progress?: number | undefined;
}) {
  const id = `caps-status-mark-${useId().replaceAll(":", "")}`;
  const visual = useRef<SVGSVGElement>(null);
  const dashes = useRef<SVGCircleElement>(null);
  const track = useRef<SVGCircleElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const spin = useRef<SVGGElement>(null);
  const disc = useRef<SVGCircleElement>(null);
  const tick = useRef<SVGPathElement>(null);
  const cross = useRef<SVGPathElement>(null);
  const initial = useRef(poseFor(glyph, progress)).current;
  const previous = useRef<StatusMarkGlyph>(glyph);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const svg = visual.current;
    const dashRing = dashes.current;
    const trackRing = track.current;
    const arcRing = arc.current;
    const bead = disc.current;
    const tickPath = tick.current;
    const crossPath = cross.current;
    if (
      !svg ||
      !dashRing ||
      !trackRing ||
      !arcRing ||
      !bead ||
      !tickPath ||
      !crossPath
    )
      return;
    const pose = poseFor(glyph, progress);
    const from = previous.current;
    previous.current = glyph;
    const motion = readMotion(svg);
    const still = reduced || (from === glyph && glyph !== "arc");
    const fade = still
      ? reduced
        ? { ease: motion.ease, duration: motion.fast }
        : immediateTiming
      : themedEase(motion, { ease: "outQuad", duration: 160 });
    const finishing = (glyph === "check" || glyph === "cross") && !still;
    // The arc closes first, then the disc springs out, then the mark draws.
    const close = themedEase(motion, { ease: "inOutSine", duration: 220 });
    const animations: JSAnimation[] = [
      animate(dashRing, { opacity: pose.dashes, ...fade }),
      animate(trackRing, { opacity: pose.track * 0.28, ...fade }),
      animate(arcRing, {
        opacity: pose.arc,
        "stroke-dasharray": `${String(pose.sweep)} 1`,
        ...(still ? (reduced ? immediateTiming : fade) : close),
      }),
      animate(bead, {
        r: pose.disc * discRadius,
        ...(finishing
          ? {
              delay: close.duration * 0.7,
              ...themedSpring(motion, { bounce: 0.35, duration: 360 }),
            }
          : reduced
            ? immediateTiming
            : themedEase(motion, { ease: "inCubic", duration: 140 })),
      }),
      animate(tickPath, {
        "stroke-dashoffset": 1 - pose.tick,
        ...(finishing && pose.tick > 0
          ? {
              delay: close.duration * 0.7 + motion.fast,
              ...themedEase(motion, { ease: "outCubic", duration: 240 }),
            }
          : immediateTiming),
      }),
      animate(crossPath, {
        "stroke-dashoffset": 1 - pose.cross,
        ...(finishing && pose.cross > 0
          ? {
              delay: close.duration * 0.7 + motion.fast,
              ...themedEase(motion, { ease: "outCubic", duration: 240 }),
            }
          : immediateTiming),
      }),
    ];
    if (glyph === "cross" && finishing && motion.shake > 0)
      animations.push(
        animate(svg, {
          translateX: [0, -motion.shake, motion.shake, -motion.shake / 2, 0],
          delay: close.duration + motion.fast,
          ...themedEase(motion, { ease: "linear", duration: 300 }),
        }),
      );
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [glyph, progress, reduced]);

  // An indeterminate arc turns while it is on screen; reduced motion holds it.
  const spinning = glyph === "arc" && progress === undefined && !reduced;
  useLayoutEffect(() => {
    if (!spinning || !spin.current || !visual.current) return;
    const motion = readMotion(visual.current);
    const loop = animate(spin.current, {
      rotate: [0, 360],
      ...themedEase(motion, { ease: "linear", duration: 900 }),
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
  }, [spinning]);

  return (
    <svg
      ref={visual}
      aria-hidden="true"
      className={`caps-status-mark ${className ?? ""}`}
      viewBox="0 0 16 16"
      focusable="false"
    >
      <defs>
        <GooeySurfaceDefinition
          id={`${id}-surface`}
          transform="matrix(1.6 0 0 1.6 8 8)"
        />
        <mask
          id={`${id}-knock`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="16"
          height="16"
        >
          <rect width="16" height="16" fill="var(--color-white)" />
          <path
            ref={tick}
            d="M4.9 8.3 7.1 10.5 11.2 5.9"
            fill="none"
            stroke="var(--color-black)"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - initial.tick}
          />
          <path
            ref={cross}
            d="M5.4 5.4 10.6 10.6 M10.6 5.4 5.4 10.6"
            fill="none"
            stroke="var(--color-black)"
            strokeWidth="1.9"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - initial.cross}
          />
        </mask>
      </defs>
      <circle
        ref={dashes}
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="1.7 2.2"
        opacity={initial.dashes}
      />
      <circle
        ref={track}
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity={initial.track * 0.28}
      />
      <g ref={spin} className="caps-status-mark-spin">
        <circle
          ref={arc}
          cx="8"
          cy="8"
          r="6.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${String(initial.sweep)} 1`}
          transform="rotate(-90 8 8)"
          opacity={initial.arc}
        />
      </g>
      <circle
        ref={disc}
        cx="8"
        cy="8"
        r={initial.disc * discRadius}
        fill={`url(#${id}-surface)`}
        mask={`url(#${id}-knock)`}
      />
    </svg>
  );
}
