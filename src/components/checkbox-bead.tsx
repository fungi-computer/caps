import { animate } from "animejs";
import { motionTime, readMotion, useReducedMotion } from "../lib/motion.js";
import {
  immediateTiming,
  themedEase,
  themedSpring,
} from "../lib/motion-spring.js";
import { useId, useLayoutEffect, useRef } from "react";
import {
  GooeyFilterDefinition,
  GooeyInsetDefinition,
  GooeyShadowDefinition,
  GooeySurfaceDefinition,
} from "./gooey.js";

/** Visual state of a checkbox's mark: unchecked, checked, or indeterminate ("mixed"). */
export type CheckboxState = "unchecked" | "checked" | "mixed";
const contours = {
  unchecked: "M3.25 5.9 L5.1 7.9 L8.8 3.8",
  checked: "M3.25 5.9 L5.1 7.9 L8.8 3.8",
  mixed: "M3.4 6 L6 6 L8.6 6",
};
const goo = { blurStdDeviation: 0.22, alphaSlope: 18, alphaIntercept: -8 };

/** @internal Draw one sculpted stroke from its first tip through to its last. */
export function CheckboxBead({ state }: { state: CheckboxState }) {
  const id = `caps-checkbox-${useId().replaceAll(":", "")}`;
  const mark = useRef<SVGPathElement>(null);
  const initial = useRef(state).current;
  const previous = useRef(state);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!mark.current) return;
    const filled = state !== "unchecked";
    const wasFilled = previous.current !== "unchecked";
    const immediate = reduced || previous.current === state;
    previous.current = state;
    const motion = readMotion(mark.current);
    const emptying = themedEase(motion, { ease: "inCubic", duration: 160 });
    const morph = animate(mark.current, {
      d: {
        to: contours[state],
        ...(immediate
          ? immediateTiming
          : themedEase(motion, { ease: "outCubic", duration: 200 })),
      },
      "stroke-dashoffset": {
        to: filled ? 0 : 1,
        ...(immediate
          ? immediateTiming
          : filled
            ? themedEase(motion, { ease: "inOutSine", duration: 260 })
            : emptying),
      },
      "stroke-width": immediate
        ? { to: filled ? 2.4 : 0, duration: 0 }
        : filled && !wasFilled
          ? [
              {
                to: 2.2,
                ...themedEase(motion, { ease: "outCubic", duration: 65 }),
              },
              {
                to: 2.4,
                delay: motionTime(motion, 120),
                ...themedSpring(motion, { bounce: 0.35, duration: 220 }),
              },
            ]
          : { to: filled ? 2.4 : 0, ...emptying },
    });
    return () => {
      morph.cancel();
    };
  }, [state, reduced]);

  return (
    <svg
      className="caps-checkbox-visual"
      width="24"
      height="24"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <GooeySurfaceDefinition
          id={`${id}-surface`}
          transform="matrix(1 0 0 1 6 6)"
        />
        <GooeyShadowDefinition id={`${id}-shadow`} />
        <GooeyInsetDefinition id={`${id}-inset`} />
        <GooeyFilterDefinition id={`${id}-goo`} values={goo} />
        <filter
          id={`${id}-relief`}
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceAlpha"
            stdDeviation="0.28"
            result="relief"
          />
          <feSpecularLighting
            in="relief"
            surfaceScale="1.2"
            specularConstant="0.55"
            specularExponent="18"
            lightingColor="color-mix(in srgb, var(--color-white) calc(var(--depth) * 100%), var(--color-black))"
            result="light"
          >
            <feDistantLight azimuth="225" elevation="55" />
          </feSpecularLighting>
          <feComposite
            in="light"
            in2="SourceAlpha"
            operator="in"
            result="clipped-light"
          />
          <feBlend in="SourceGraphic" in2="clipped-light" mode="screen" />
        </filter>
        <mask
          id={`${id}-contour`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="12"
          height="12"
          style={{ maskType: "alpha" }}
        >
          <path
            ref={mark}
            d={contours[initial]}
            fill="none"
            stroke="var(--color-white)"
            strokeWidth={initial === "unchecked" ? 0 : 2.4}
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={initial === "unchecked" ? 1 : 0}
            strokeLinecap="round"
            strokeLinejoin="round"
            // A horizontal mixed mark has no height for an object-bounding-box filter.
            filter={state === "mixed" ? undefined : `url(#${id}-goo)`}
          />
        </mask>
        <clipPath id={`${id}-well`}>
          <rect x="1" y="1" width="10" height="10" rx="2.5" />
        </clipPath>
      </defs>
      <rect
        className="caps-checkbox-track"
        x="0.5"
        y="0.5"
        width="11"
        height="11"
        rx="3"
        filter={`url(#${id}-inset)`}
      />
      <g clipPath={`url(#${id}-well)`}>
        <g filter={`url(#${id}-shadow)`}>
          <g filter={`url(#${id}-relief)`}>
            <g mask={`url(#${id}-contour)`}>
              <rect
                x="0"
                y="0"
                width="12"
                height="12"
                fill={`url(#${id}-surface)`}
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
