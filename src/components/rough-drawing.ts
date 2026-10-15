/**
 * Hand-drawn Rough.js chrome for any element marked `data-caps-rough`: boxes,
 * underlines, circles, highlights, speech bubbles and leader lines drawn in the
 * theme's ink or primary. The {@link Rough} component writes that markup; pages
 * without React call {@link drawRough} once. Until Rough.js has drawn an
 * element (or without JavaScript), plain CSS in `styles.css` stands in for it.
 *
 * Each element keeps its seed, so a redraw after a resize bends the same way.
 */

/** A hand-drawn mark around, under or behind an element. */
export type RoughMark =
  "box" | "underline" | "circle" | "highlight" | "bubble" | "line";

/** Theme ink (`currentColor` by default) or the theme's primary accent. */
export type RoughTone = "ink" | "primary";

/** Parsed `data-rough-*` settings for one element. */
export type RoughSpec = Readonly<{
  mark: RoughMark;
  seed: number;
  /** Stroke width in CSS pixels. */
  weight: number;
  /** Rough.js roughness; 0 is a ruler, 3 is a scribble. */
  roughness: number;
  /** Fill inside a box, circle or bubble: flat, or screentone-like hachure. */
  fill: "none" | "solid" | "hachure";
  /** For `bubble`: which lower corner the tail leaves from. */
  tail: "left" | "right" | "none";
  /**
   * For `line`: points in percent of the element's box, such as
   * `0,100 40,20 100,0`. Two points draw a straight stroke; more draw a curve.
   */
  points: readonly (readonly [number, number])[];
}>;

const MARKS: readonly RoughMark[] = [
  "box",
  "underline",
  "circle",
  "highlight",
  "bubble",
  "line",
];

const SVG_NS = "http://www.w3.org/2000/svg";
/** How far a mark may spill past its element, in CSS pixels. */
const BLEED = 12;

function finite(value: string | undefined, fallback: number): number {
  const number = Number(value);
  return value !== undefined && Number.isFinite(number) ? number : fallback;
}

/** Read `0,100 40,20 100,0` as percent points, dropping malformed pairs. */
export function parseRoughPoints(
  value: string | undefined,
): readonly (readonly [number, number])[] {
  const points: [number, number][] = [];
  for (const pair of (value ?? "").trim().split(/\s+/)) {
    const [x, y] = pair.split(",").map(Number);
    if (x === undefined || y === undefined) continue;
    if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
  }
  return points;
}

/** Parse an element's `data-caps-rough` and `data-rough-*` attributes. */
export function readRoughSpec(element: HTMLElement): RoughSpec | null {
  const data = element.dataset;
  const mark = MARKS.find((name) => name === data.capsRough);
  if (!mark) return null;
  const fill =
    data.roughFill === "solid" || data.roughFill === "hachure"
      ? data.roughFill
      : "none";
  const tail =
    data.roughTail === "right" || data.roughTail === "none"
      ? data.roughTail
      : "left";
  return {
    mark,
    seed: Math.max(1, Math.round(finite(data.roughSeed, 7))),
    weight: finite(data.roughWeight, mark === "highlight" ? 1 : 2.2),
    roughness: finite(data.roughRoughness, 1.4),
    fill,
    tail,
    points: parseRoughPoints(data.roughPoints),
  };
}

type Generator = import("roughjs/bin/generator.js").RoughGenerator;
type Drawable = import("roughjs/bin/core.js").Drawable;
type Options = import("roughjs/bin/core.js").Options;
type Point = [number, number];

/** The drawables for one mark in a `width` × `height` box offset by BLEED. */
function sketch(
  generator: Generator,
  spec: RoughSpec,
  width: number,
  height: number,
): Drawable[] {
  const x = BLEED;
  const y = BLEED;
  const options: Options = {
    seed: spec.seed,
    roughness: spec.roughness,
    bowing: 1.2,
    stroke: "currentColor",
    strokeWidth: spec.weight,
  };
  if (spec.fill !== "none") {
    options.fill = "currentColor";
    options.fillStyle = spec.fill;
    options.fillWeight = spec.weight * 0.6;
    options.hachureGap = spec.weight * 3;
  }
  switch (spec.mark) {
    case "box":
      return [generator.rectangle(x, y, width, height, options)];
    case "underline": {
      const base = y + height + 2;
      return [
        generator.curve(
          [
            [x - 2, base],
            [x + width * 0.5, base + 3],
            [x + width + 2, base - 1],
          ],
          options,
        ),
      ];
    }
    case "circle":
      return [
        generator.ellipse(
          x + width / 2,
          y + height / 2,
          width + BLEED * 1.4,
          height + BLEED * 1.2,
          { ...options, disableMultiStroke: false },
        ),
      ];
    case "highlight":
      return [
        generator.rectangle(x - 3, y + height * 0.45, width + 6, height * 0.5, {
          ...options,
          stroke: "none",
          fill: "currentColor",
          fillStyle: spec.fill === "hachure" ? "hachure" : "solid",
        }),
      ];
    case "bubble": {
      const tailX = spec.tail === "right" ? x + width * 0.78 : x + width * 0.22;
      const flip = spec.tail === "right" ? 1 : -1;
      const tail =
        spec.tail === "none"
          ? []
          : [
              generator.linearPath(
                [
                  [tailX - 10 * flip, y + height - 4],
                  [tailX + 18 * flip, y + height + BLEED - 1],
                  [tailX + 6 * flip, y + height - 6],
                ],
                options,
              ),
            ];
      return [
        generator.ellipse(
          x + width / 2,
          y + height / 2,
          width,
          height,
          options,
        ),
        ...tail,
      ];
    }
    case "line": {
      const points = spec.points.map(([px, py]): Point => [
        x + (px / 100) * width,
        y + (py / 100) * height,
      ]);
      if (points.length < 2) return [];
      return [
        points.length === 2
          ? generator.linearPath(points, options)
          : generator.curve(points, options),
      ];
    }
  }
}

/** Draw (or redraw) one element's mark into its own overlay SVG. */
function paint(generator: Generator, element: HTMLElement, spec: RoughSpec) {
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (width < 1 || height < 1) return;
  let svg = element.querySelector<SVGSVGElement>(":scope > .caps-rough-svg");
  if (!svg) {
    svg = element.ownerDocument.createElementNS(SVG_NS, "svg");
    svg.classList.add("caps-rough-svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    element.append(svg);
  }
  svg.setAttribute("width", String(width + BLEED * 2));
  svg.setAttribute("height", String(height + BLEED * 2));
  svg.setAttribute(
    "viewBox",
    `0 0 ${String(width + BLEED * 2)} ${String(height + BLEED * 2)}`,
  );
  const paths: SVGPathElement[] = [];
  for (const drawable of sketch(generator, spec, width, height)) {
    for (const info of generator.toPaths(drawable)) {
      const path = element.ownerDocument.createElementNS(SVG_NS, "path");
      path.setAttribute("d", info.d);
      path.setAttribute("stroke", info.stroke);
      path.setAttribute("stroke-width", String(info.strokeWidth));
      path.setAttribute("fill", info.fill ?? "none");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("pathLength", "1");
      paths.push(path);
    }
  }
  svg.replaceChildren(...paths);
  const delay = Number(element.dataset.roughDelay);
  if (element.dataset.roughDelay && Number.isFinite(delay))
    element.style.setProperty("--caps-rough-delay", `${String(delay)}s`);
  element.dataset.roughDrawn = "";
}

let generatorPromise: Promise<Generator> | undefined;

function loadGenerator(): Promise<Generator> {
  generatorPromise ??= import("roughjs/bin/generator.js").then(
    ({ RoughGenerator }) => new RoughGenerator(),
  );
  return generatorPromise;
}

/**
 * Draw every `[data-caps-rough]` element inside `root` (and `root` itself),
 * loading Rough.js on first use, and redraw each one when its size changes.
 * Returns a function that stops watching sizes. If Rough.js cannot load, the
 * CSS fallback stays.
 */
export function drawRough(root: ParentNode = document): () => void {
  const elements = Array.from(
    root.querySelectorAll<HTMLElement>("[data-caps-rough]"),
  );
  if (root instanceof HTMLElement && root.dataset.capsRough !== undefined)
    elements.unshift(root);
  const marks = elements.flatMap((element) => {
    const spec = readRoughSpec(element);
    return spec ? [{ element, spec }] : [];
  });
  if (marks.length === 0) return () => undefined;
  let stopped = false;
  let observer: ResizeObserver | undefined;
  void loadGenerator()
    .then((generator) => {
      if (stopped) return;
      const sizes = new Map<HTMLElement, string>();
      const redraw = (element: HTMLElement, spec: RoughSpec) => {
        const size = `${String(element.offsetWidth)}x${String(element.offsetHeight)}`;
        if (sizes.get(element) === size) return;
        sizes.set(element, size);
        paint(generator, element, spec);
      };
      for (const { element, spec } of marks) redraw(element, spec);

      const browser: Partial<Pick<typeof globalThis, "ResizeObserver">> =
        globalThis;
      if (!("ResizeObserver" in globalThis) || !browser.ResizeObserver) return;
      const specs = new Map(marks.map(({ element, spec }) => [element, spec]));
      observer = new browser.ResizeObserver((entries) => {
        for (const entry of entries) {
          const element = entry.target;
          if (!(element instanceof HTMLElement)) continue;
          const spec = specs.get(element);
          if (spec) redraw(element, spec);
        }
      });
      for (const { element } of marks) observer.observe(element);
    })
    .catch((cause: unknown) => {
      console.error("Caps rough drawing failed; CSS fallback remains.", cause);
    });
  return () => {
    stopped = true;
    observer?.disconnect();
  };
}
