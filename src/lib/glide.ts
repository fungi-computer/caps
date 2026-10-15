import { useCallback, useRef, type RefCallback } from "react";

import { canAnimate, motionEasing, readMotion } from "./motion.js";

type Box = Readonly<{ x: number; y: number; width: number; height: number }>;

/**
 * The attribute a row carries while the glide stands in for its highlight:
 * empty while the stand-in travels, `measure` while its resting colour is read.
 */
const glideStandInAttribute = "data-glide-stand-in";

function boxIn(host: HTMLElement, element: Element): Box {
  const outer = host.getBoundingClientRect();
  const inner = element.getBoundingClientRect();
  // Host-relative and scroll-aware, so a scrolled list glides true.
  return {
    x: inner.left - outer.left + host.scrollLeft - host.clientLeft,
    y: inner.top - outer.top + host.scrollTop - host.clientTop,
    width: inner.width,
    height: inner.height,
  };
}

function place(box: Box) {
  return {
    transform: `translate(${String(box.x)}px, ${String(box.y)}px)`,
    width: `${String(box.width)}px`,
    height: `${String(box.height)}px`,
  };
}

/**
 * One highlight that glides between a list's rows instead of blinking from
 * row to row. `lit` selects the highlighted row (keyboard or pointer). While
 * the highlight moves, a single stand-in carrying that row's own resting
 * background and radius travels from the previous row and the rows' own
 * highlights are held back, so at rest every row looks exactly as it always
 * has. Within one open list the glide remembers its last row, so leaving and
 * re-entering glides from where it was. Timing and easing are the theme's;
 * reduced motion moves the highlight at once.
 */
export function useGlide(lit: string): RefCallback<HTMLElement> {
  const detach = useRef<(() => void) | null>(null);
  // A callback ref, so a list that mounts later (a popover's) still glides.
  return useCallback(
    (element: HTMLElement | null) => {
      detach.current?.();
      detach.current = element ? attachGlide(element, lit) : null;
    },
    [lit],
  );
}

function attachGlide(element: HTMLElement, lit: string): () => void {
  if (!canAnimate(element)) return () => undefined;
  const document = element.ownerDocument;
  let current: Element | null = element.querySelector(lit);
  let last: Box | null = current ? boxIn(element, current) : null;
  let ghost: HTMLSpanElement | null = null;
  let flight: Animation | null = null;
  const standIns = new Set<Element>();

  const release = () => {
    for (const row of standIns) row.removeAttribute(glideStandInAttribute);
    standIns.clear();
    if (ghost) ghost.hidden = true;
    flight = null;
  };

  const stage = () => {
    if (ghost) return ghost;
    const created = document.createElement("span");
    created.className = "caps-glide";
    created.setAttribute("aria-hidden", "true");
    element.prepend(created);
    // The stand-in paints above the list's background, below its rows.
    element.classList.add("caps-glide-host");
    if (getComputedStyle(element).position === "static")
      element.classList.add("caps-glide-anchor");
    ghost = created;
    return created;
  };

  const glide = (to: Element, away: Element | null) => {
    const motion = readMotion(element);
    const target = boxIn(element, to);
    const from = flight && ghost ? boxIn(element, ghost) : last;
    last = target;
    flight?.cancel();
    release();
    if (motion.reduced || from === null) return;
    if (Math.abs(from.y - target.y) < 1 && Math.abs(from.x - target.x) < 1)
      return;
    // Read the row's resting highlight, not a frame of its colour transition.
    to.setAttribute(glideStandInAttribute, "measure");
    const style = getComputedStyle(to);
    const background = style.backgroundColor;
    const radius = style.borderRadius;
    for (const row of [to, away]) {
      if (!row) continue;
      row.setAttribute(glideStandInAttribute, "");
      standIns.add(row);
    }
    const stand = stage();
    stand.hidden = false;
    stand.style.backgroundColor = background;
    stand.style.borderRadius = radius;
    const animation = stand.animate([place(from), place(target)], {
      duration: motion.normal,
      easing: motionEasing(motion, motion.ease),
      fill: "forwards",
    });
    flight = animation;
    animation.addEventListener("finish", () => {
      if (flight === animation) release();
    });
  };

  const update = () => {
    const next = element.querySelector(lit);
    if (next === current) return;
    const away = current;
    current = next;
    // A row that lights from nothing glides from the remembered row.
    if (next) glide(next, away);
  };

  const observer = new MutationObserver(update);
  observer.observe(element, {
    subtree: true,
    attributes: true,
    attributeFilter: [
      "data-highlighted",
      "data-active",
      "data-navigation",
      "aria-selected",
    ],
  });
  element.addEventListener("pointerover", update);
  element.addEventListener("pointerout", update);
  return () => {
    observer.disconnect();
    element.removeEventListener("pointerover", update);
    element.removeEventListener("pointerout", update);
    flight?.cancel();
    release();
    ghost?.remove();
  };
}
