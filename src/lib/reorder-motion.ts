import { useLayoutEffect, useRef, type RefObject } from "react";

import { canAnimate, motionEasing, readMotion, type Motion } from "./motion.js";

/** The attribute that names one keyed child of a list with list motion. */
export const reorderKeyAttribute = "data-reorder-key";

type Row = Readonly<{
  element: HTMLElement;
  top: number;
  left: number;
  width: number;
  height: number;
}>;

function rowIn(container: HTMLElement, element: HTMLElement): Row {
  const outer = container.getBoundingClientRect();
  const inner = element.getBoundingClientRect();
  // Container-relative, so scrolling between renders never reads as a move.
  return {
    element,
    top: inner.top - outer.top + container.scrollTop,
    left: inner.left - outer.left + container.scrollLeft,
    width: inner.width,
    height: inner.height,
  };
}

/** Rows that arrive fade in over the theme's travel, a sibling at a time. */
function enter(rows: readonly HTMLElement[], motion: Motion, after: number) {
  rows.forEach((element, index) => {
    element.animate(
      motion.reduced
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            {
              opacity: 0,
              transform: `translateY(${String(motion.distance)}px)`,
            },
            { opacity: 1, transform: "none" },
          ],
      {
        duration: motion.normal,
        delay: after + index * motion.stagger,
        easing: motionEasing(motion, motion.ease),
        fill: "backwards",
      },
    );
  });
}

/**
 * A row that leaves is gone from the DOM already; a quiet copy of its last
 * look fades where it stood while the rows below glide up into its room.
 */
function leave(container: HTMLElement, row: Row, motion: Motion) {
  const ghost = row.element.cloneNode(true);
  if (!(ghost instanceof HTMLElement)) return;
  ghost.removeAttribute(reorderKeyAttribute);
  ghost.removeAttribute("id");
  ghost.setAttribute("aria-hidden", "true");
  ghost.setAttribute("inert", "");
  Object.assign(ghost.style, {
    position: "absolute",
    top: `${String(row.top - container.clientTop)}px`,
    left: `${String(row.left - container.clientLeft)}px`,
    width: `${String(row.width)}px`,
    height: `${String(row.height)}px`,
    margin: "0",
    pointerEvents: "none",
  });
  const positioned = getComputedStyle(container).position !== "static";
  if (!positioned) container.style.position = "relative";
  container.append(ghost);
  const exit = ghost.animate(
    motion.reduced
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { opacity: 1, transform: "none" },
          {
            opacity: 0,
            transform: `translateY(${String(-motion.distance)}px)`,
          },
        ],
    {
      duration: motion.fast,
      easing: motionEasing(motion, motion.easeExit),
      fill: "forwards",
    },
  );
  const done = () => {
    ghost.remove();
    if (!positioned && container.querySelector(":scope > [inert]") === null)
      container.style.removeProperty("position");
  };
  exit.addEventListener("finish", done);
  exit.addEventListener("cancel", done);
}

/**
 * The list eases to its new height with the rows, so whatever sits below it
 * moves along instead of jumping; rows outside the moving edge are clipped.
 */
function resize(
  container: HTMLElement,
  from: number,
  to: number,
  timing: KeyframeAnimationOptions,
) {
  const clipped = container.style.overflow;
  container.style.overflow = "clip";
  const animation = container.animate(
    [{ height: `${String(from)}px` }, { height: `${String(to)}px` }],
    timing,
  );
  const done = () => {
    container.style.overflow = clipped;
  };
  animation.addEventListener("finish", done);
  animation.addEventListener("cancel", done);
  return animation;
}

/**
 * Motion for a keyed list. Rows that arrive fade in over the theme's travel
 * (staggered by `--stipe-motion-stagger`) once the list has unrolled to make
 * room. A row that leaves fades where it stood first; then the rest close
 * ranks, gliding to their places (FLIP on the Web Animations API) as the list
 * eases to its new height. Everything reads the theme's motion tokens;
 * reduced motion keeps only short fades and nothing travels. Children opt in
 * with `data-reorder-key`, and the first render is still.
 */
export function useListMotion(
  container: RefObject<HTMLElement | null>,
  order: readonly string[],
): void {
  const previous = useRef<{
    order: string;
    keys: ReadonlySet<string>;
    rows: ReadonlyMap<string, Row>;
  } | null>(null);
  const height = useRef(0);
  const resizing = useRef<Animation | null>(null);
  const orderKey = order.join("\u0000");
  useLayoutEffect(() => {
    const root = container.current;
    if (root === null) {
      // A list that unmounts starts still when it comes back.
      previous.current = null;
      return;
    }
    const before = previous.current;
    const changed = before?.order !== orderKey;
    // Measure the list's own height, not a resize still in flight.
    const heightBefore = resizing.current
      ? root.getBoundingClientRect().height
      : height.current;
    if (changed) {
      resizing.current?.cancel();
      resizing.current = null;
    }
    const heightAfter = changed
      ? root.getBoundingClientRect().height
      : height.current;
    height.current = heightAfter;
    const next = new Map<string, Row>();
    for (const element of root.querySelectorAll<HTMLElement>(
      `:scope [${reorderKeyAttribute}]`,
    )) {
      const key = element.getAttribute(reorderKeyAttribute);
      if (key === null) continue;
      const was = before?.rows.get(key);
      // Unchanged rows already have their target positions. Measuring them
      // during our own animation would replace that target with a halfway pose.
      next.set(
        key,
        !changed && was?.element === element ? was : rowIn(root, element),
      );
    }
    const keys = new Set(order);
    previous.current = { order: orderKey, keys, rows: next };
    // Virtual lists mount and unmount rows while scrolling. Refresh their
    // baseline every commit, but animate only a change to the logical list.
    if (before === null || !changed || !canAnimate(root)) return;
    const motion = readMotion(root);
    const leaving = [...before.rows].filter(
      ([key, row]) => !keys.has(key) && !row.element.isConnected,
    );
    // Ranks close once the leaving rows have faded, never through them.
    const settle: KeyframeAnimationOptions = {
      duration: motion.slow,
      delay: leaving.length > 0 ? motion.fast : 0,
      easing: motionEasing(motion, motion.ease),
      fill: "backwards",
    };
    const arriving: HTMLElement[] = [];
    const moved: HTMLElement[] = [];
    for (const [key, row] of next) {
      const was = before.rows.get(key);
      if (was === undefined) {
        if (!before.keys.has(key)) arriving.push(row.element);
        continue;
      }
      const dx = was.left - row.left;
      const dy = was.top - row.top;
      if (dx === 0 && dy === 0) continue;
      moved.push(row.element);
      if (motion.reduced || motion.slow <= 0) continue;
      row.element.animate(
        [
          { transform: `translate(${String(dx)}px, ${String(dy)}px)` },
          { transform: "none" },
        ],
        settle,
      );
    }
    if (motion.reduced) {
      // Nothing travels: rows that changed place settle in with a short fade
      // instead of a fading copy crossing them.
      for (const element of moved)
        element.animate([{ opacity: 0.3 }, { opacity: 1 }], {
          duration: motion.fast,
          easing: motion.ease,
        });
    } else for (const [, row] of leaving) leave(root, row, motion);
    // New rows fade in once the rows around them have made room.
    enter(
      arriving,
      motion,
      moved.length > 0 && !motion.reduced ? motion.fast : 0,
    );
    if (!motion.reduced && Math.abs(heightBefore - heightAfter) > 0.5) {
      const animation = resize(root, heightBefore, heightAfter, settle);
      resizing.current = animation;
      animation.addEventListener("finish", () => {
        if (resizing.current === animation) resizing.current = null;
      });
    }
  });
}
