import { useMotion, motionTime } from "../lib/motion.js";
import { animate } from "animejs";
import { useId, useLayoutEffect, useRef } from "react";

import {
  GooeyFilterDefinition,
  GooeyShadowDefinition,
  GooeySurfaceDefinition,
  STATUS_GOOEY_FILTER,
} from "./gooey.js";
import type { LoaderVariant } from "./loader.js";
import { observeMotionVisibility } from "./motion-visibility.js";

type BlobPose = { cx: number; cy: number; rx: number; ry: number };

function smoothPhase(value: number) {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
}

function excursion(blob: number, progress: number) {
  const phase = Math.max(
    0,
    Math.min(1, (progress - (blob - 1) * 0.085) / 0.68),
  );
  return Math.sin(phase * Math.PI) ** 2;
}

// Closed harmonic paths feel irregular without picking new random targets on
// render. Opposing radii give the blobs a breathing, roughly constant area.
function pose(
  variant: LoaderVariant,
  blob: number,
  progress: number,
): BlobPose {
  const turn = progress * Math.PI * 2;
  const phase = blob * 2.1;
  const breath = Math.sin(turn * 2 + phase) * 0.15;
  const radii = { rx: 4 * (1 + breath), ry: 4 / (1 + breath) };
  if (variant === "line") {
    const distance = 7.5 + 4 * Math.cos(turn + (blob === 2 ? -0.45 : 0));
    return {
      cx: (blob - 1) * distance,
      cy: Math.sin(turn + phase) * 0.7,
      ...radii,
    };
  }
  if (variant === "square") {
    const distance = 4.7 + 2.7 * Math.cos(turn);
    return {
      cx: (blob % 2 ? 1 : -1) * distance,
      cy: (blob < 2 ? -1 : 1) * distance,
      ...radii,
    };
  }
  if (variant === "donut") {
    // Trace clockwise from one origin. Unreleased blobs travel with the head;
    // after the full ring closes, everything returns to that same origin.
    const sweep = smoothPhase(progress / 0.66) * Math.PI * 2;
    const angle = Math.min(sweep, (blob * Math.PI) / 8) - Math.PI / 2;
    const collapse = smoothPhase((progress - 0.79) / 0.21);
    const distance =
      8 + Math.sin(turn * 2 + phase) * 0.35 * Math.sin(progress * Math.PI);
    return {
      cx: Math.cos(angle) * distance * (1 - collapse),
      cy: Math.sin(angle) * distance * (1 - collapse) - 8 * collapse,
      rx: 3.6 * (1 + breath * Math.sin(progress * Math.PI)),
      ry: 3.6 / (1 + breath * Math.sin(progress * Math.PI)),
    };
  }
  if (variant === "bloom") {
    if (blob === 0) {
      const released = [1, 2, 3, 4].reduce(
        (sum, index) => sum + excursion(index, progress),
        0,
      );
      const radius = Math.sqrt(49 - released * 4);
      return {
        cx: Math.sin(turn) * 0.4,
        cy: Math.sin(turn * 2) * 0.4,
        rx: radius * (1 + breath),
        ry: radius / (1 + breath),
      };
    }
    const reach = excursion(blob, progress);
    const angle =
      ((blob - 1) * Math.PI) / 2 - Math.PI / 4 + Math.sin(turn) * 0.22;
    return {
      cx: Math.cos(angle) * 14 * reach,
      cy: Math.sin(angle) * 14 * reach,
      rx: 3.2 * (1 + breath),
      ry: 3.2 / (1 + breath),
    };
  }
  return {
    cx: Math.sin(turn + phase) * 6 + Math.sin(turn * 3 + phase) * 2.5,
    cy: Math.cos(turn * 2 + phase) * 6,
    ...radii,
  };
}

// Relative lengths preserve each choreography; the theme owns its tempo.
const durations = {
  line: 1700,
  square: 1900,
  donut: 3000,
  wander: 4600,
  bloom: 2800,
};

/** @internal Animate only the silhouette; lighting never overlaps at joins. */
export function LoaderBlobs({ variant }: { variant: LoaderVariant }) {
  const id = `caps-loader-${useId().replaceAll(":", "")}`;
  const geometry = useRef<SVGGElement>(null);
  const visual = useRef<SVGSVGElement>(null);
  const timing = useMotion(visual);
  const { reduced } = timing;
  const count =
    variant === "donut"
      ? 16
      : variant === "bloom"
        ? 5
        : variant === "square"
          ? 4
          : 3;

  useLayoutEffect(() => {
    if (reduced || !geometry.current || !visual.current) return;
    const loops = [...geometry.current.querySelectorAll("ellipse")].map(
      (blob, index) =>
        animate(blob, {
          keyframes: Array.from({ length: 48 }, (_, step) => ({
            ...pose(variant, index, (step + 1) / 48),
            duration: motionTime(timing, durations[variant]) / 48,
          })),
          ease: "linear",
          loop: true,
        }),
    );
    const stopObserving = observeMotionVisibility(visual.current, (visible) => {
      for (const loop of loops) {
        if (visible) loop.resume();
        else loop.pause();
      }
    });
    return () => {
      stopObserving();
      for (const loop of loops) loop.revert();
    };
  }, [variant, reduced, timing]);

  return (
    <svg
      ref={visual}
      aria-hidden="true"
      focusable="false"
      viewBox={variant === "line" ? "-20 -10 40 20" : "-20 -20 40 40"}
    >
      <defs>
        <GooeyFilterDefinition id={id} values={STATUS_GOOEY_FILTER} />
        <GooeySurfaceDefinition
          id={`${id}-surface`}
          transform={
            variant === "line"
              ? "matrix(3.4 0 0 1.4 0 0)"
              : "matrix(3 0 0 3 0 0)"
          }
        />
        <GooeyShadowDefinition id={`${id}-shadow`} />
        <mask
          id={`${id}-mask`}
          maskUnits="userSpaceOnUse"
          x="-20"
          y="-20"
          width="40"
          height="40"
          style={{ maskType: "alpha" }}
        >
          <g ref={geometry} fill="currentColor" filter={`url(#${id})`}>
            {Array.from({ length: count }, (_, index) => (
              <ellipse key={index} {...pose(variant, index, 0)} />
            ))}
          </g>
        </mask>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <rect
          x="-20"
          y="-20"
          width="40"
          height="40"
          fill={`url(#${id}-surface)`}
          mask={`url(#${id}-mask)`}
        />
      </g>
    </svg>
  );
}
