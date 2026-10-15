import roughImport from "roughjs";
import type { RoughSVG } from "roughjs/bin/svg.js";

type RoughSvg = RoughSVG;
type RoughOptions = NonNullable<Parameters<RoughSvg["line"]>[4]>;
type RoughApi = { svg(svg: SVGSVGElement): RoughSvg };

// roughjs ships CommonJS types beside an ESM `module` build: NodeNext sees the
// API under `default`, bundlers hand over the API itself. Accept either.
type RoughEntry = RoughApi | { readonly default: RoughApi };

function resolveRough(entry: RoughEntry): RoughApi {
  return "svg" in entry ? entry : entry.default;
}

const rough = resolveRough(roughImport);

const SVG = "http://www.w3.org/2000/svg";

/**
 * The opt-in pencil layer for server-rendered field-guide pages.
 *
 * Markup contract, all plain attributes so any host can use it without React:
 * - `data-sketch-root` marks a positioned host; its overlay is drawn inside it.
 * - `data-sketch="circle" | "underline"` marks inline text to annotate.
 * - `data-sketch-leader-x` / `data-sketch-leader-y` (fractions of the target
 *   box) on a note draw a leader from the note to the `data-sketch-target`
 *   inside the same `data-sketch-item`. The layout decides whether leaders
 *   apply by setting `--caps-sketch-leader: on` on the note.
 *
 * Strokes use `currentColor`, so a theme switch recolors them without a
 * redraw. The host receives `data-sketch-drawn` once annotations exist, which
 * lets Caps hide the static CSS fallbacks they replace.
 */
export function sketch(root: ParentNode = document): () => void {
  const hosts = Array.from(
    root.querySelectorAll<HTMLElement>("[data-sketch-root]"),
  );
  const draw = () => {
    for (const [index, host] of hosts.entries()) drawHost(host, index);
  };
  draw();
  // Older engines and jsdom lack ResizeObserver; they draw once.
  const observer =
    "ResizeObserver" in globalThis ? new ResizeObserver(draw) : undefined;
  for (const host of hosts) observer?.observe(host);
  // Web fonts move annotated text once they load; jsdom has no font set.
  if ("fonts" in document) void document.fonts.ready.then(draw);
  return () => {
    observer?.disconnect();
    for (const host of hosts) {
      host.querySelector(":scope > .caps-sketch-overlay")?.remove();
      delete host.dataset.sketchDrawn;
    }
  };
}

function drawHost(host: HTMLElement, index: number): void {
  host.querySelector(":scope > .caps-sketch-overlay")?.remove();
  const bounds = host.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  const overlay = document.createElementNS(SVG, "svg");
  overlay.setAttribute(
    "viewBox",
    `0 0 ${String(bounds.width)} ${String(bounds.height)}`,
  );
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("focusable", "false");
  overlay.classList.add("caps-sketch-overlay");
  const generator = rough.svg(overlay);

  for (const [markIndex, mark] of host
    .querySelectorAll<HTMLElement>("[data-sketch]")
    .entries()) {
    const annotation = drawMark(generator, bounds, mark, {
      roughness: 1.1,
      stroke: "currentColor",
      strokeWidth: 1.3,
      seed: 2601 + index * 10 + markIndex,
    });
    if (annotation) overlay.append(annotation);
  }
  for (const [noteIndex, note] of host
    .querySelectorAll<HTMLElement>("[data-sketch-leader-x]")
    .entries()) {
    const leader = drawLeader(generator, bounds, note, {
      roughness: 1.2,
      stroke: "currentColor",
      strokeWidth: 1.2,
      seed: 3101 + index * 10 + noteIndex,
    });
    if (leader) overlay.append(leader);
  }
  host.append(overlay);
  host.dataset.sketchDrawn = "";
}

function drawMark(
  generator: RoughSvg,
  host: DOMRect,
  mark: HTMLElement,
  options: RoughOptions,
): SVGGElement | undefined {
  const box = mark.getBoundingClientRect();
  if (!box.width || !box.height) return undefined;
  const x = box.left - host.left;
  const y = box.top - host.top;
  switch (mark.dataset.sketch) {
    case "circle":
      return generator.ellipse(
        x + box.width / 2,
        y + box.height / 2,
        box.width + 9,
        box.height + 7,
        options,
      );
    case "underline":
      return generator.line(
        x,
        y + box.height + 3,
        x + box.width,
        y + box.height + 3,
        options,
      );
    default:
      return undefined;
  }
}

function drawLeader(
  generator: RoughSvg,
  host: DOMRect,
  note: HTMLElement,
  options: RoughOptions,
): SVGGElement | undefined {
  if (
    getComputedStyle(note).getPropertyValue("--caps-sketch-leader").trim() !==
    "on"
  )
    return undefined;
  const target = note
    .closest("[data-sketch-item]")
    ?.querySelector<HTMLElement>("[data-sketch-target]");
  const fx = Number(note.dataset.sketchLeaderX);
  const fy = Number(note.dataset.sketchLeaderY);
  if (!target || !Number.isFinite(fx) || !Number.isFinite(fy)) return undefined;

  const targetBox = target.getBoundingClientRect();
  const noteBox = note.getBoundingClientRect();
  const endX = targetBox.left - host.left + targetBox.width * fx;
  const endY = targetBox.top - host.top + targetBox.height * fy;
  const startX = Math.min(
    Math.max(endX, noteBox.left - host.left + 18),
    noteBox.right - host.left - 18,
  );
  const startY = noteBox.top - host.top - 8;
  const length = Math.hypot(endX - startX, endY - startY);
  if (length < 12) return undefined;

  const group = document.createElementNS(SVG, "g");
  const bend = Math.min(16, length / 10);
  group.append(
    generator.curve(
      [
        [startX, startY],
        [(startX + endX) / 2 + bend, (startY + endY) / 2],
        [endX, endY],
      ],
      options,
    ),
  );
  const angle = Math.atan2(endY - startY, endX - startX);
  for (const side of [-1, 1]) {
    const wing = angle + Math.PI + side * 0.45;
    group.append(
      generator.line(
        endX,
        endY,
        endX + Math.cos(wing) * 11,
        endY + Math.sin(wing) * 11,
        options,
      ),
    );
  }
  return group;
}
