import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/**
 * A 3×5 pixel face for game readouts: clocks, counters, damage and pickups.
 * Each glyph is rows of lit columns, top to bottom.
 */
const GLYPHS = new Map([
  ["0", ["###", "#.#", "#.#", "#.#", "###"]],
  ["1", [".#.", "##.", ".#.", ".#.", "###"]],
  ["2", ["###", "..#", "###", "#..", "###"]],
  ["3", ["###", "..#", ".##", "..#", "###"]],
  ["4", ["#.#", "#.#", "###", "..#", "..#"]],
  ["5", ["###", "#..", "###", "..#", "###"]],
  ["6", ["###", "#..", "###", "#.#", "###"]],
  ["7", ["###", "..#", ".#.", ".#.", ".#."]],
  ["8", ["###", "#.#", "###", "#.#", "###"]],
  ["9", ["###", "#.#", "###", "..#", "###"]],
  [":", [".", "#", ".", "#", "."]],
  [".", [".", ".", ".", ".", "#"]],
  ["+", ["...", ".#.", "###", ".#.", "..."]],
  ["-", ["...", "...", "###", "...", "..."]],
  ["/", ["..#", "..#", ".#.", "#..", "#.."]],
  ["×", ["...", "#.#", ".#.", "#.#", "..."]],
  ["%", ["#.#", "..#", ".#.", "#..", "#.#"]],
  [" ", [".", ".", ".", ".", "."]],
]);

const BLANK = [".", ".", ".", ".", "."];

/** Characters the pixel face can draw. */
export const PIXEL_NUMBER_CHARACTERS = Object.freeze([...GLYPHS.keys()]);

/** Supported PixelNumber sizes: one font pixel is 2, 3, 4 or 6 CSS pixels. */
export type PixelNumberSize = "sm" | "md" | "lg" | "xl";
/** Semantic tones supplied by the current theme. */
export type PixelNumberTone =
  "current" | "primary" | "accent" | "success" | "warning" | "error";

/** Props accepted by PixelNumber. Pass a `value`, or readout `text`. */
export type PixelNumberProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> & {
  /** A number to draw. */
  value?: number;
  /** Readout text instead of a number: digits and `: . + - / × %` and spaces. */
  text?: string;
  /** Left-pad the whole part of `value` with zeros to this many digits. */
  pad?: number;
  /** Prefix a positive `value` with `+`, for gains and floating numbers. */
  signed?: boolean;
  size?: PixelNumberSize;
  tone?: PixelNumberTone;
  /**
   * Ring every lit pixel with the ink line, like a sprite outline, so the
   * number reads over any world: damage, pickups and floating gains.
   */
  outline?: boolean;
};

/** Format a number the way PixelNumber draws it. */
export function formatPixelNumber(value: number, pad = 0, signed = false) {
  if (!Number.isFinite(value))
    throw new RangeError("PixelNumber needs a finite number");
  const whole = String(Math.trunc(Math.abs(value))).padStart(pad, "0");
  const fraction = String(Math.abs(value)).split(".")[1];
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";
  return checkPixelText(`${sign}${whole}${fraction ? `.${fraction}` : ""}`);
}

/** Reject characters the pixel face cannot draw, naming the ones it can. */
export function checkPixelText(text: string) {
  for (const character of text)
    if (!GLYPHS.has(character))
      throw new RangeError(
        `PixelNumber cannot draw "${character}"; use digits and ${PIXEL_NUMBER_CHARACTERS.filter((glyph) => !/\d/.test(glyph)).join(" ")}`,
      );
  return text;
}

/** Lit pixels of a string in font pixels, shifted right and down by `margin`. */
function litPixels(text: string, margin: number) {
  const lit = new Set<string>();
  let cursor = margin;
  for (const character of text) {
    const glyph = GLYPHS.get(character) ?? BLANK;
    glyph.forEach((row, y) => {
      for (let x = 0; x < row.length; x++)
        if (row.charAt(x) === "#")
          lit.add(`${String(cursor + x)},${String(y + margin)}`);
    });
    cursor += (glyph.at(0)?.length ?? 1) + 1;
  }
  return { lit, width: Math.max(1, cursor - 1 - margin) + margin * 2 };
}

/** Ink pixels touching a lit pixel on any side or corner, but not lit. */
function outlinePixels(lit: ReadonlySet<string>) {
  const ring = new Set<string>();
  for (const key of lit) {
    const [x = 0, y = 0] = key.split(",").map(Number);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const next = `${String(x + dx)},${String(y + dy)}`;
        if (!lit.has(next)) ring.add(next);
      }
  }
  return ring;
}

/** Horizontal runs `[x, y, width]` covering a pixel set, for fewer rects. */
function pixelRuns(pixels: ReadonlySet<string>, width: number, height: number) {
  const runs: (readonly [number, number, number])[] = [];
  for (let y = 0; y < height; y++) {
    let start = -1;
    for (let x = 0; x <= width; x++) {
      const on = pixels.has(`${String(x)},${String(y)}`);
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        runs.push([start, y, x - start]);
        start = -1;
      }
    }
  }
  return runs;
}

function Runs({
  runs,
  className,
}: {
  runs: readonly (readonly [number, number, number])[];
  className: string;
}) {
  return (
    <g className={className}>
      {runs.map(([x, y, run]) => (
        <rect
          key={`${String(x)}-${String(y)}`}
          x={x}
          y={y}
          width={run}
          height={1}
        />
      ))}
    </g>
  );
}

/**
 * Crisp pixel numerals drawn as SVG, so they stay sharp at every size and
 * never depend on a font file. The readable text is kept for assistive tech.
 */
export const PixelNumber = forwardRef<HTMLSpanElement, PixelNumberProps>(
  function PixelNumber(
    {
      value,
      text,
      pad,
      signed,
      size = "md",
      tone = "current",
      outline = false,
      className,
      ...props
    },
    ref,
  ) {
    if (text === undefined && value === undefined)
      throw new TypeError("PixelNumber needs a value or text");
    const shown =
      text === undefined
        ? formatPixelNumber(value ?? Number.NaN, pad, signed)
        : checkPixelText(text);
    const margin = outline ? 1 : 0;
    const { lit, width } = litPixels(shown, margin);
    const height = 5 + margin * 2;
    const scale = PIXEL_SCALE[size];
    return (
      <span
        {...props}
        ref={ref}
        className={cn("caps-pixel-number", className)}
        data-size={size}
        data-tone={tone}
        data-outline={outline}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${String(width)} ${String(height)}`}
          width={width * scale}
          height={height * scale}
        >
          {outline ? (
            <Runs
              className="caps-pixel-number-outline"
              runs={pixelRuns(outlinePixels(lit), width, height)}
            />
          ) : null}
          <Runs
            className="caps-pixel-number-face"
            runs={pixelRuns(lit, width, height)}
          />
        </svg>
        <span className="sr-only">{shown}</span>
      </span>
    );
  },
);

/** CSS pixels per font pixel. */
const PIXEL_SCALE = { sm: 2, md: 3, lg: 4, xl: 6 } satisfies Record<
  PixelNumberSize,
  number
>;
