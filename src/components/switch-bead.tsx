import { animate } from "animejs";
import { readMotion, useReducedMotion } from "../lib/motion.js";
import { themedEase, themedSpring } from "../lib/motion-spring.js";
import { useId, useLayoutEffect, useRef } from "react";
import {
  GooeySurfaceDefinition,
  GooeyShadowDefinition,
  GooeyInsetDefinition,
} from "./gooey.js";

/** @internal A bead that compresses before filling or emptying its track. */
export function SwitchBead({ checked }: { checked: boolean }) {
  const id = `caps-switch-${useId().replaceAll(":", "")}`;
  const body = useRef<SVGRectElement>(null);
  const surface = useRef<SVGRadialGradientElement>(null);
  const initial = useRef(checked).current;
  const previous = useRef(checked);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!body.current || !surface.current) return;
    const immediate = reduced || previous.current === checked;
    previous.current = checked;
    const width = checked ? 16 : 8;
    const motion = readMotion(body.current);
    const settle = themedSpring(motion, { bounce: 0.25, duration: 440 });
    const squeeze = themedEase(motion, { ease: "inOutSine", duration: 100 });
    const fill = animate(
      body.current,
      immediate
        ? {
            x: 2,
            y: 2,
            width,
            height: 8,
            duration: 0,
          }
        : {
            x: [
              { to: checked ? 2.5 : 1.5, ...squeeze },
              { to: 2, ...settle },
            ],
            y: [
              { to: 1.5, ...squeeze },
              { to: 2, ...settle },
            ],
            height: [
              { to: 9, ...squeeze },
              { to: 8, ...settle },
            ],
            width: [
              { to: checked ? 7 : 16.5, ...squeeze },
              { to: width, ...settle },
            ],
          },
    );
    const light = animate(surface.current, {
      gradientTransform: checked
        ? "matrix(2 0 0 1 10 6)"
        : "matrix(1 0 0 1 6 6)",
      ...(immediate ? { duration: 0 } : { delay: squeeze.duration, ...settle }),
    });
    return () => {
      fill.cancel();
      light.cancel();
    };
  }, [checked, reduced]);

  return (
    <svg
      className="caps-switch-visual"
      width="40"
      height="24"
      viewBox="0 0 20 12"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <GooeySurfaceDefinition
          ref={surface}
          id={`${id}-surface`}
          transform={initial ? "matrix(2 0 0 1 10 6)" : "matrix(1 0 0 1 6 6)"}
        />
        <GooeyShadowDefinition id={`${id}-shadow`} />
        <GooeyInsetDefinition id={`${id}-inset`} />
        <clipPath id={`${id}-track`}>
          <rect x="1" y="1" width="18" height="10" rx="5" />
        </clipPath>
      </defs>
      <rect
        className="caps-switch-track"
        filter={`url(#${id}-inset)`}
        x="0.5"
        y="0.5"
        width="19"
        height="11"
        rx="5.5"
      />
      <g clipPath={`url(#${id}-track)`}>
        <rect
          ref={body}
          x="2"
          y="2"
          width={initial ? 16 : 8}
          height="8"
          rx="4"
          fill={`url(#${id}-surface)`}
          filter={`url(#${id}-shadow)`}
        />
      </g>
    </svg>
  );
}
