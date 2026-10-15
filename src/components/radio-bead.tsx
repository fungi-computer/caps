import { useMotion } from "../lib/motion.js";
import { animate } from "animejs";
import { themedEase, themedSpring } from "../lib/motion-spring.js";
import { useId, useLayoutEffect, useRef } from "react";
import {
  GooeyInsetDefinition,
  GooeyShadowDefinition,
  GooeySurfaceDefinition,
} from "./gooey.js";

/** @internal A selected bead emerging from a recessed radio well. */
export function RadioBead({ checked }: { checked: boolean }) {
  const id = `caps-radio-${useId().replaceAll(":", "")}`;
  const body = useRef<SVGEllipseElement>(null);
  const initial = useRef(checked).current;
  const previous = useRef(checked);
  const root = useRef<SVGSVGElement>(null);
  const motion = useMotion(root);
  const { reduced } = motion;

  useLayoutEffect(() => {
    if (!body.current) return;
    const immediate = reduced || previous.current === checked;
    previous.current = checked;
    const radius = checked ? 4 : 0;
    // The radio's own lively settle, in the theme's feel.
    const press = themedEase(motion, { ease: "outCubic", duration: 75 });
    const settle = checked
      ? themedSpring(motion, { bounce: 0.65, duration: 300 })
      : themedEase(motion, { ease: "inCubic", duration: 100 });
    const bead = animate(
      body.current,
      immediate
        ? {
            rx: radius,
            ry: radius,
            cy: 6,
            duration: 0,
          }
        : {
            rx: [
              { to: checked ? 3.5 : 4.15, ...press },
              { to: radius, ...settle },
            ],
            ry: [
              { to: checked ? 4.5 : 3.85, ...press },
              { to: radius, ...settle },
            ],
            cy: [
              { to: checked ? 5.85 : 6.1, ...press },
              { to: 6, ...settle },
            ],
          },
    );
    return () => {
      bead.cancel();
    };
  }, [checked, reduced, motion]);

  return (
    <svg
      ref={root}
      className="caps-radio-visual"
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
        <clipPath id={`${id}-well`}>
          <circle cx="6" cy="6" r="5" />
        </clipPath>
      </defs>
      <circle
        className="caps-radio-track"
        cx="6"
        cy="6"
        r="5.5"
        filter={`url(#${id}-inset)`}
      />
      <g clipPath={`url(#${id}-well)`}>
        <ellipse
          ref={body}
          cx="6"
          cy="6"
          rx={initial ? 4 : 0}
          ry={initial ? 4 : 0}
          fill={`url(#${id}-surface)`}
          filter={`url(#${id}-shadow)`}
        />
      </g>
    </svg>
  );
}
