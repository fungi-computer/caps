import {
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

/** Resolved, element-scoped motion. Times are milliseconds and distances pixels. */
export type Motion = Readonly<{
  reduced: boolean;
  squish: number;
  fast: number;
  normal: number;
  slow: number;
  springDuration: number;
  bounce: number;
  stretch: number;
  distance: number;
  stagger: number;
  blur: number;
  shake: number;
  steps: number;
  fuse: number;
  pressDepth: number;
  pressScale: number;
  ease: string;
  easeExit: string;
}>;

const defaults: Motion = Object.freeze({
  reduced: false,
  squish: 90,
  fast: 120,
  normal: 180,
  slow: 280,
  springDuration: 320,
  bounce: 0.3,
  stretch: 0.28,
  distance: 4,
  stagger: 24,
  blur: 0,
  shake: 3,
  steps: 0,
  fuse: 1,
  pressDepth: 0.5,
  pressScale: 1,
  ease: "cubic-bezier(0.2, 0, 0, 1)",
  easeExit: "cubic-bezier(0.4, 0, 1, 1)",
});

const preference = "(prefers-reduced-motion: reduce)";

/** Read at an event boundary; no root-theme lookup, so nested tokens win. */
export function readMotion(element: Element): Motion {
  const view = element.ownerDocument.defaultView;
  if (!view) return defaults;
  const style = view.getComputedStyle(element);
  const number = (name: string, fallback: number) => {
    const value = style.getPropertyValue(name).trim();
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  };
  const time = (name: string, fallback: number) => {
    const value = style.getPropertyValue(name).trim();
    return (
      number(name, fallback) *
      (value.endsWith("s") && !value.endsWith("ms") ? 1000 : 1)
    );
  };
  const browser: Partial<Pick<Window, "matchMedia">> = view;
  const reduced = browser.matchMedia?.(preference).matches ?? false;
  const duration = (name: string, fallback: number) =>
    reduced ? 120 : time(`--stipe-motion-${name}`, fallback);
  const amount = (name: string, fallback: number) =>
    reduced ? 0 : number(`--stipe-motion-${name}`, fallback);
  return {
    reduced,
    squish: duration("squish", defaults.squish),
    fast: duration("fast", defaults.fast),
    normal: duration("normal", defaults.normal),
    slow: duration("slow", defaults.slow),
    springDuration: duration("spring-duration", defaults.springDuration),
    bounce: Math.min(1, amount("bounce", defaults.bounce)),
    stretch: amount("stretch", defaults.stretch),
    distance: amount("distance", defaults.distance),
    stagger: reduced ? 0 : time("--stipe-motion-stagger", defaults.stagger),
    blur: amount("blur", defaults.blur),
    shake: amount("shake", defaults.shake),
    steps: Math.floor(amount("steps", defaults.steps)),
    fuse: number("--stipe-motion-fuse", defaults.fuse),
    pressDepth: reduced
      ? 0
      : number("--stipe-press-depth", defaults.pressDepth),
    pressScale: reduced
      ? 1
      : number("--stipe-press-scale", defaults.pressScale),
    ease: style.getPropertyValue("--stipe-motion-ease").trim() || defaults.ease,
    easeExit:
      style.getPropertyValue("--stipe-motion-ease-exit").trim() ||
      defaults.easeExit,
  };
}

/** Live motion tokens for a mounted ref, including nested theme and OS changes. */
export function useMotion(ref: RefObject<Element | null>): Motion {
  const [motion, setMotion] = useState<Motion>(() => ({
    ...defaults,
    reduced: true,
  }));
  useLayoutEffect(() => {
    const element = ref.current;
    const view = element?.ownerDocument.defaultView;
    if (!element || !view) return;
    const update = () => {
      const next = readMotion(element);
      setMotion((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    update();
    const observer = new view.MutationObserver(update);
    // Observe ancestors only: animation writes to descendants must not trigger reads.
    for (
      let parent: Element | null = element;
      parent;
      parent = parent.parentElement
    ) {
      observer.observe(parent, {
        attributes: true,
        attributeFilter: ["data-theme", "class", "style"],
      });
    }
    const browser: Partial<Pick<Window, "matchMedia">> = view;
    const media = browser.matchMedia?.(preference);
    media?.addEventListener("change", update);
    return () => {
      observer.disconnect();
      media?.removeEventListener("change", update);
    };
  }, [ref]);
  return motion;
}

/** Today's feel: the defaults that components' authored timings are written against. */
export const motionDefaults: Motion = defaults;

/**
 * Scale one of a component's authored durations by the theme's tempo
 * (`--stipe-motion-normal` against its 180ms default). Today's themes return
 * the authored value unchanged; reduced motion returns 0 (nothing travels).
 */
export function motionTime(motion: Motion, authored: number): number {
  if (motion.reduced) return 0;
  return Math.round((authored * motion.normal) / defaults.normal);
}

/**
 * Scale one of a component's authored spring bounces by the theme's bounce
 * (`--stipe-motion-bounce` against its 0.3 default), so a lively control stays
 * livelier than a calm one inside every theme. A 0 theme is critically damped.
 */
export function motionBounce(motion: Motion, authored: number): number {
  if (motion.reduced) return 0;
  const scaled = (authored * motion.bounce) / defaults.bounce;
  return Math.min(0.9, Math.max(0, scaled));
}

/** Scale an authored spring settle time by `--stipe-motion-spring-duration`. */
export function motionSpringTime(motion: Motion, authored: number): number {
  if (motion.reduced) return 0;
  return Math.round(
    (authored * motion.springDuration) / defaults.springDuration,
  );
}

/** A CSS easing for a Web Animation, stepped when the theme asks for it. */
export function motionEasing(motion: Motion, ease: string): string {
  return motion.steps > 0 ? `steps(${String(motion.steps)}, end)` : ease;
}

/** Whether the element can run Web Animations (not in jsdom or old engines). */
export function canAnimate(element: Element): boolean {
  return "animate" in element;
}

const globalWindow: Partial<Pick<Window, "matchMedia">> = globalThis;

function prefersReducedMotion(): boolean {
  return globalWindow.matchMedia?.(preference).matches ?? false;
}

function subscribeReducedMotion(update: () => void) {
  const media = globalWindow.matchMedia?.(preference);
  media?.addEventListener("change", update);
  return () => {
    media?.removeEventListener("change", update);
  };
}

/** Server renders assume reduced motion, so hydration never starts mid-move. */
function serverReducedMotion() {
  return true;
}

/**
 * The live reduced-motion preference alone, for controls that only need to
 * know whether to move (their timing comes from `readMotion` when they do).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    serverReducedMotion,
  );
}
