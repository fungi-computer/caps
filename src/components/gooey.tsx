import { STIPE_GOOEY_FILTER } from "@fungi.computer/stipe";
import { forwardRef } from "react";

/** @internal The eight-unit bead's material, positioned with an SVG transform. */
export const GooeySurfaceDefinition = forwardRef<
  SVGRadialGradientElement,
  { id: string; transform: string }
>(function GooeySurfaceDefinition({ id, transform }, ref) {
  return (
    <radialGradient
      ref={ref}
      id={id}
      gradientUnits="userSpaceOnUse"
      cx="-1.2"
      cy="-1.6"
      r="5.6"
      gradientTransform={transform}
    >
      <stop
        offset="0"
        stopColor="color-mix(in oklab, var(--color-white) calc(var(--depth) * 50%), currentColor)"
      />
      <stop offset="1" stopColor="currentColor" />
    </radialGradient>
  );
});

/** @internal Cast one themed shadow from the finished silhouette. */
export function GooeyShadowDefinition({ id }: { id: string }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow
        dx="0"
        dy="1.5"
        stdDeviation="1"
        floodColor="currentColor"
        style={{ floodOpacity: "calc(var(--depth) * 0.6)" }}
      />
    </filter>
  );
}

/** @internal Opposing inner shadows shared by recessed control wells. */
export function GooeyInsetDefinition({ id }: { id: string }) {
  return (
    <filter
      id={id}
      x="-10%"
      y="-10%"
      width="120%"
      height="120%"
      colorInterpolationFilters="sRGB"
    >
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.3" result="soft-edge" />
      <feOffset in="soft-edge" dx="0.25" dy="0.45" result="lower-edge" />
      <feComposite
        in="SourceAlpha"
        in2="lower-edge"
        operator="out"
        result="inner-shadow"
      />
      <feFlood
        floodColor="var(--color-black)"
        floodOpacity="calc(var(--depth) * 0.28)"
      />
      <feComposite in2="inner-shadow" operator="in" result="shade" />
      <feOffset in="soft-edge" dx="-0.2" dy="-0.35" result="upper-edge" />
      <feComposite
        in="SourceAlpha"
        in2="upper-edge"
        operator="out"
        result="inner-highlight"
      />
      <feFlood
        floodColor="var(--color-white)"
        floodOpacity="calc(var(--depth) * 0.7)"
      />
      <feComposite in2="inner-highlight" operator="in" result="highlight" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="shade" />
        <feMergeNode in="highlight" />
      </feMerge>
    </filter>
  );
}

/** @internal Props shared by Caps' private gooey filter definitions. */
export type GooeyFilterDefinitionProps = {
  values?: GooeyFilterValues;
  id: string;
};

/** @internal Numeric values for one SVG gooey filter profile. */
export type GooeyFilterValues = Readonly<{
  alphaIntercept: number;
  alphaSlope: number;
  blurStdDeviation: number;
}>;

/** @internal Filter calibrated for Status's eight-unit bead. */
export const STATUS_GOOEY_FILTER = Object.freeze({
  alphaIntercept: -8,
  alphaSlope: 18,
  blurStdDeviation: 2,
});

/** @internal The single SVG filter definition shared by Caps' gooey family. */
export function GooeyFilterDefinition({
  id,
  values = STIPE_GOOEY_FILTER,
}: GooeyFilterDefinitionProps) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur
        in="SourceGraphic"
        stdDeviation={values.blurStdDeviation}
        result="blur"
      />
      <feColorMatrix
        in="blur"
        values={`1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${String(values.alphaSlope)} ${String(values.alphaIntercept)}`}
        result="gooey"
      />
      <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
    </filter>
  );
}
