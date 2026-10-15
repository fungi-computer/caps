import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";
import { seedHash } from "../lib/seed-hash.js";

/** Theme tones a Monogram may take; the current Stipe theme supplies each color. */
export type MonogramTone =
  "primary" | "secondary" | "accent" | "info" | "success" | "warning";

const tones: readonly MonogramTone[] = [
  "primary",
  "secondary",
  "accent",
  "info",
  "success",
  "warning",
];

/** A stable tone for an identity: the same seed always gets the same tone. */
export function monogramTone(seed: string): MonogramTone {
  return tones[seedHash(seed) % tones.length] ?? "primary";
}

/** Monogram scales: `default` sits inline with text; larger sizes stand alone as an identity mark. */
export type MonogramSize = "default" | "lg" | "xl";

/** Who the Monogram marks: people and Agents get a disc, Apps a rounded tile. */
export type MonogramSubject = "actor" | "app";

/** Props accepted by Monogram. */
export type MonogramProps = {
  /** The name whose first letter is shown. */
  name: string;
  /** Stable identity that picks the tone; defaults to the name. */
  seed?: string;
  size?: MonogramSize;
  subject?: MonogramSubject;
  variant?: "initial" | "specimen";
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/**
 * A small decorative identity mark: the name's first letter on a quiet tinted
 * disc. The enclosing control owns the accessible name.
 */
export const Monogram = forwardRef<HTMLSpanElement, MonogramProps>(
  function Monogram(
    {
      className,
      name,
      seed,
      size = "default",
      subject = "actor",
      variant = "initial",
      ...props
    },
    ref,
  ) {
    const letter = Array.from(name.trim())[0]?.toLocaleUpperCase() ?? "?";
    return (
      <span
        aria-hidden="true"
        {...props}
        className={cn("caps-monogram", className)}
        data-subject={subject === "actor" ? undefined : subject}
        data-size={size === "default" ? undefined : size}
        data-tone={monogramTone(seed ?? name)}
        ref={ref}
      >
        {variant === "specimen" ? (
          <svg
            viewBox="0 0 48 48"
            width="80%"
            height="80%"
            fill="none"
            aria-hidden="true"
          >
            <g
              transform={`rotate(${String((seed ?? name).split("").reduce((sum, unit) => sum + (unit.codePointAt(0) ?? 0), 0) % 360)} 24 24)`}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {Array.from({ length: 20 }, (_, index) => (
                <path
                  key={index}
                  d="M24 19 Q19 12 24 5"
                  transform={`rotate(${String(index * 18)} 24 24)`}
                />
              ))}
              <circle cx="24" cy="24" r="5" />
            </g>
          </svg>
        ) : (
          letter
        )}
      </span>
    );
  },
);
