/**
 * Minimap label placement: every named mark tries its label below, above,
 * right and left of its dot, then at its four corners, and keeps the first spot that stays inside
 * the chart and clear of every fixed dot and every label already placed. Goals
 * are placed first, then places in the order the game listed them, so a
 * game lists its landmarks first. A label with no clear spot is hidden; its
 * full name still shows on hover and focus, and reads to assistive tech.
 * Pure and deterministic: the same marks and size give the same layout.
 */

/** Where a mark's name sits, or `hidden`. */
export type MinimapLabelSide =
  | "below"
  | "above"
  | "right"
  | "left"
  | "below-right"
  | "below-left"
  | "above-right"
  | "above-left"
  | "hidden";

/** A caller-provided minimap label and its anchor. */
export type MinimapLabelInput = Readonly<{
  /** Mark centre, as a fraction of the chart's width and height. */
  x: number;
  y: number;
  /** Named marks are laid out; unnamed ones (the viewer, foes) are dots. */
  named: boolean;
  /** A dot labels must keep clear of. Moving marks (foes) are left out, so a
   * passing crowd never hides a landmark. */
  solid: boolean;
  goal: boolean;
  label: string;
}>;

/** Measured label dimensions used to place minimap labels. */
export type MinimapLabelMetrics = Readonly<{
  /** The chart's size in CSS pixels. */
  width: number;
  height: number;
  /** An estimate of one character's advance, and a label's line height. */
  charWidth: number;
  lineHeight: number;
  /** Padding either side of a label, the dot's size, the gap to the dot. */
  padding: number;
  dot: number;
  gap: number;
}>;

type Box = { left: number; top: number; right: number; bottom: number };

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const SIDES = [
  "below",
  "above",
  "right",
  "left",
  "below-right",
  "below-left",
  "above-right",
  "above-left",
] as const;

/** The side each mark's label takes, index for index with `marks`. */
export function layoutMinimapLabels(
  marks: readonly MinimapLabelInput[],
  metrics: MinimapLabelMetrics,
): MinimapLabelSide[] {
  const { width, height, charWidth, lineHeight, padding, dot, gap } = metrics;
  const centre = (mark: MinimapLabelInput) => ({
    x: mark.x * width,
    y: mark.y * height,
  });
  const taken: Box[] = marks
    .filter((mark) => mark.solid)
    .map((mark) => {
      const { x, y } = centre(mark);
      return {
        left: x - dot / 2,
        top: y - dot / 2,
        right: x + dot / 2,
        bottom: y + dot / 2,
      };
    });
  const sides: MinimapLabelSide[] = marks.map(() => "hidden");
  const order = marks
    .map((mark, index) => ({ mark, index }))
    .filter(({ mark }) => mark.named)
    .sort(
      (a, b) => Number(b.mark.goal) - Number(a.mark.goal) || a.index - b.index,
    );
  for (const { mark, index } of order) {
    const { x, y } = centre(mark);
    const w = mark.label.length * charWidth + padding * 2;
    const h = lineHeight;
    const reach = dot / 2 + gap;
    const boxes = {
      below: {
        left: x - w / 2,
        top: y + reach,
        right: x + w / 2,
        bottom: y + reach + h,
      },
      above: {
        left: x - w / 2,
        top: y - reach - h,
        right: x + w / 2,
        bottom: y - reach,
      },
      right: {
        left: x + reach,
        top: y - h / 2,
        right: x + reach + w,
        bottom: y + h / 2,
      },
      left: {
        left: x - reach - w,
        top: y - h / 2,
        right: x - reach,
        bottom: y + h / 2,
      },
      "below-right": {
        left: x,
        top: y + reach,
        right: x + w,
        bottom: y + reach + h,
      },
      "below-left": {
        left: x - w,
        top: y + reach,
        right: x,
        bottom: y + reach + h,
      },
      "above-right": {
        left: x,
        top: y - reach - h,
        right: x + w,
        bottom: y - reach,
      },
      "above-left": {
        left: x - w,
        top: y - reach - h,
        right: x,
        bottom: y - reach,
      },
    } satisfies Record<(typeof SIDES)[number], Box>;
    for (const side of SIDES) {
      const box = boxes[side];
      const inside =
        box.left >= 0 &&
        box.top >= 0 &&
        box.right <= width &&
        box.bottom <= height;
      if (!inside || taken.some((other) => overlaps(box, other))) continue;
      taken.push(box);
      sides[index] = side;
      break;
    }
  }
  return sides;
}
