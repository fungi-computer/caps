import { forwardRef, type SVGAttributes } from "react";

import { cn } from "../lib/cn.js";
import { seedHash } from "../lib/seed-hash.js";

/** Theme tones a mushroom cap may take; the current Stipe theme supplies each color. */
const capTones = [
  "primary",
  "secondary",
  "accent",
  "info",
  "warning",
  "error",
] as const;

/** A small seeded generator, so one seed always draws one garden. */
function sequence(seed: string): () => number {
  let state = seedHash(seed) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const number = (value: number) => value.toFixed(1);

/** Props accepted by CoverPattern. */
export type CoverPatternProps = {
  /** Stable identity that picks the garden; the same seed draws the same one. */
  seed: string;
  /** Names the pattern for assistive technology; without it the pattern is decorative. */
  label?: string;
} & Omit<SVGAttributes<SVGSVGElement>, "children" | "role" | "aria-label">;

/**
 * A garden of mushrooms over a thread of mycelium: the stand-in for a cover
 * that has no picture yet. It fills its box, holds no text, and takes every
 * color from the theme.
 */
export const CoverPattern = forwardRef<SVGSVGElement, CoverPatternProps>(
  function CoverPattern({ seed, label, className, ...props }, ref) {
    const next = sequence(seed);
    const count = 5 + Math.floor(next() * 2);
    const mushrooms = Array.from({ length: count }, (_, index) => {
      const size = 11 + next() * 11;
      return {
        x: 14 + (index * 132) / (count - 1) + (next() - 0.5) * 12,
        base: 74 + next() * 20,
        size,
        tone: capTones[Math.floor(next() * capTones.length)] ?? "primary",
        spots: 2 + Math.floor(next() * 2),
        lean: (next() - 0.5) * 0.5,
      };
    }).sort((a, b) => a.base - b.base);
    const threads = Array.from({ length: 4 }, () => {
      const y = 80 + next() * 16;
      return `M-4 ${number(y)} C40 ${number(y - 8 + next() * 16)} 100 ${number(y - 8 + next() * 16)} 164 ${number(y - 6 + next() * 12)}`;
    });
    const spores = Array.from({ length: 9 }, () => ({
      x: next() * 160,
      y: 6 + next() * 50,
      r: 0.7 + next() * 1.3,
    }));
    return (
      <svg
        {...props}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        className={cn("caps-cover-pattern", className)}
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        ref={ref}
        role={label ? "img" : undefined}
        viewBox="0 0 160 100"
      >
        <rect
          width="160"
          height="100"
          style={{
            fill: "color-mix(in oklab, var(--color-base-300) 88%, var(--color-secondary))",
          }}
        />
        <circle
          cx={number(110 + next() * 34)}
          cy={number(20 + next() * 8)}
          r="9"
          style={{
            fill: "color-mix(in oklab, var(--color-warning) 45%, var(--color-base-300))",
          }}
        />
        <path
          d="M0 74 Q36 62 76 70 T160 66 V100 H0 Z"
          style={{
            fill: "color-mix(in oklab, var(--color-success) 30%, var(--color-base-300))",
          }}
        />
        {threads.map((path) => (
          <path
            key={path}
            d={path}
            fill="none"
            strokeLinecap="round"
            strokeWidth="0.6"
            style={{
              stroke:
                "color-mix(in oklab, var(--color-base-content) 22%, transparent)",
            }}
          />
        ))}
        {spores.map((spore) => (
          <circle
            key={`${number(spore.x)}-${number(spore.y)}`}
            cx={number(spore.x)}
            cy={number(spore.y)}
            r={number(spore.r)}
            style={{
              fill: "color-mix(in oklab, var(--color-base-content) 28%, transparent)",
            }}
          />
        ))}
        {mushrooms.map((mushroom) => {
          const stemWidth = mushroom.size * 0.55;
          const stemHeight = mushroom.size * 0.95;
          const capBase = mushroom.base - stemHeight;
          return (
            <g
              key={`${number(mushroom.x)}-${number(mushroom.base)}`}
              transform={`rotate(${number(mushroom.lean * 20)} ${number(mushroom.x)} ${number(mushroom.base)})`}
            >
              <rect
                x={number(mushroom.x - stemWidth / 2)}
                y={number(capBase - 1)}
                width={number(stemWidth)}
                height={number(stemHeight + 1)}
                rx={number(stemWidth / 2)}
                style={{
                  fill: "color-mix(in oklab, var(--color-base-100) 92%, var(--color-warning))",
                }}
              />
              <path
                d={`M${number(mushroom.x - mushroom.size)} ${number(capBase)} A${number(mushroom.size)} ${number(mushroom.size * 0.85)} 0 0 1 ${number(mushroom.x + mushroom.size)} ${number(capBase)} Z`}
                style={{ fill: `var(--color-${mushroom.tone})` }}
              />
              {Array.from({ length: mushroom.spots }, (_, spot) => (
                <circle
                  key={spot}
                  cx={number(
                    mushroom.x +
                      (spot - (mushroom.spots - 1) / 2) * mushroom.size * 0.62,
                  )}
                  cy={number(
                    capBase - mushroom.size * (spot % 2 === 0 ? 0.42 : 0.22),
                  )}
                  r={number(mushroom.size * 0.16)}
                  style={{
                    fill: "color-mix(in oklab, var(--color-base-100) 90%, transparent)",
                  }}
                />
              ))}
            </g>
          );
        })}
      </svg>
    );
  },
);
