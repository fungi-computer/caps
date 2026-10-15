import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import {
  canAnimate,
  motionEasing,
  readMotion,
  useReducedMotion,
} from "../lib/motion.js";

/**
 * The gap a vertical grid or flex container puts before this element, or 0
 * when it is the first child or its container doesn't stack.
 */
function stackGap(element: HTMLElement): number {
  const parent = element.parentElement;
  if (!parent || element.previousElementSibling === null) return 0;
  const style = getComputedStyle(parent);
  const stacks =
    style.display.includes("grid") ||
    (style.display.includes("flex") &&
      style.flexDirection.startsWith("column"));
  if (!stacks) return 0;
  const gap = Number.parseFloat(style.rowGap);
  return Number.isFinite(gap) ? gap : 0;
}

/** Props accepted by Presence. */
export type PresenceProps = {
  /** Whether the content is present. Leaving content stays mounted until it has left. */
  show: boolean;
  /** Animate the first mount too (for content that arrives after the page). */
  appear?: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

/**
 * Content that arrives and leaves instead of popping: it makes room, fades in
 * while travelling the theme's `--stipe-motion-distance`, and on leaving fades
 * out and gives its room back before it unmounts. Reduced motion keeps a short
 * fade only.
 */
export const Presence = forwardRef<HTMLDivElement, PresenceProps>(
  function Presence(
    { show, appear = false, children, className, ...props },
    ref,
  ) {
    const node = useRef<HTMLDivElement>(null);
    useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
      ref,
      () => node.current,
    );
    const reduced = useReducedMotion();
    const [mounted, setMounted] = useState(show);
    const first = useRef(true);
    if (show && !mounted) setMounted(true);

    useLayoutEffect(() => {
      const element = node.current;
      const initial = first.current;
      first.current = false;
      if (!element || (initial && !appear)) return;
      if (!canAnimate(element)) {
        if (!show) setMounted(false);
        return;
      }
      const motion = readMotion(element);
      const travel = `translateY(${String(motion.distance)}px)`;
      const easing = motionEasing(motion, motion.ease);
      // In flow, arriving content makes room and leaving content gives it
      // back, so nothing below jumps. Reduced motion changes the room at once.
      const height = element.getBoundingClientRect().height;
      const gap = stackGap(element);
      const room = (from: number, to: number) => {
        element.style.overflow = "clip";
        const edge = (size: number) => ({
          height: `${String(size)}px`,
          marginBlockStart: `${String(size === 0 ? -gap : 0)}px`,
        });
        const animation = element.animate([edge(from), edge(to)], {
          duration: motion.normal,
          easing,
        });
        const restore = () => {
          element.style.removeProperty("overflow");
        };
        animation.addEventListener("finish", restore);
        animation.addEventListener("cancel", restore);
        return animation;
      };
      if (show) {
        const animations = [
          element.animate(
            [
              { opacity: 0, transform: travel },
              { opacity: 1, transform: "none" },
            ],
            { duration: motion.normal, easing },
          ),
        ];
        if (!reduced && height > 0) animations.push(room(0, height));
        return () => {
          for (const animation of animations) animation.cancel();
        };
      }
      const fade = element.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: travel },
        ],
        {
          duration: motion.fast,
          easing: motionEasing(motion, motion.easeExit),
          fill: "forwards",
        },
      );
      const last = !reduced && height > 0 ? room(height, 0) : fade;
      if (last !== fade) last.effect?.updateTiming({ fill: "forwards" });
      last.addEventListener("finish", () => {
        setMounted(false);
      });
      return () => {
        fade.cancel();
        last.cancel();
      };
    }, [show, appear, reduced]);

    if (!mounted) return null;
    return (
      <div
        {...props}
        ref={node}
        className={cn("caps-presence", className)}
        data-present={show}
        aria-hidden={show ? undefined : true}
      >
        {children}
      </div>
    );
  },
);

/** Props accepted by Collapse. */
export type CollapseProps = {
  /** Open: the content takes its height. Closed: no space, and out of the accessibility tree. */
  open: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

/**
 * Content that opens and closes its own space: an inserted alert, a field
 * error, a disclosure body. Height and opacity follow the theme's tempo; under
 * reduced motion the space changes at once and only the fade remains.
 */
export const Collapse = forwardRef<HTMLDivElement, CollapseProps>(
  function Collapse({ open, children, className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={cn("caps-collapse", className)}
        data-open={open}
        aria-hidden={open ? undefined : true}
      >
        <div className="caps-collapse-clip">{children}</div>
      </div>
    );
  },
);

type Layer = Readonly<{ key: string; content: ReactNode }>;

/** Props accepted by Swap. */
export type SwapProps = {
  /** Names the current content. A new key crossfades from the old content to the new. */
  swapKey: string;
  /** Which edge leaving content holds to while the box resizes; `end` for right-aligned actions. */
  anchor?: "start" | "end";
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

/**
 * One piece of content replaced by another without a hard cut: loading to
 * loaded, "Saving…" to "Saved". The old content fades out (blurred by the
 * theme's `--stipe-motion-blur`) as the new one arrives, and the box eases to
 * the new size. Reduced motion keeps the crossfade and drops the travel.
 */
export const Swap = forwardRef<HTMLDivElement, SwapProps>(function Swap(
  { swapKey, anchor = "start", children, className, ...props },
  ref,
) {
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    ref,
    () => node.current,
  );
  const reduced = useReducedMotion();
  // The latest content rendered under the current key, kept so it can leave.
  const [shown, setShown] = useState<Layer>({
    key: swapKey,
    content: children,
  });
  const [leaving, setLeaving] = useState<readonly Layer[]>([]);
  if (shown.key !== swapKey) {
    setLeaving([
      ...leaving.filter(
        (layer) => layer.key !== swapKey && layer.key !== shown.key,
      ),
      shown,
    ]);
    setShown({ key: swapKey, content: children });
  } else if (shown.content !== children) {
    setShown({ key: swapKey, content: children });
  }
  const size = useRef<DOMRect | null>(null);

  useLayoutEffect(() => {
    const element = node.current;
    if (!element || !("ResizeObserver" in globalThis)) return;
    size.current = element.getBoundingClientRect();
    const observer = new ResizeObserver(() => {
      if (element.getAnimations().length === 0)
        size.current = element.getBoundingClientRect();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const exits = [
      ...element.querySelectorAll<HTMLElement>(":scope > [data-swap-leaving]"),
    ];
    const entering = element.querySelector<HTMLElement>(
      ":scope > [data-swap-current]",
    );
    if (entering === null || exits.length === 0) return;
    if (!canAnimate(element)) {
      setLeaving([]);
      return;
    }
    const before = size.current;
    const after = element.getBoundingClientRect();
    const motion = readMotion(element);
    const animations = [
      entering.animate(
        [
          {
            opacity: 0,
            filter: `blur(${String(motion.blur)}px)`,
            transform: `translateY(${String(motion.distance / 2)}px)`,
          },
          { opacity: 1, filter: "blur(0px)", transform: "none" },
        ],
        {
          duration: motion.normal,
          easing: motionEasing(motion, motion.ease),
        },
      ),
    ];
    for (const layer of exits) {
      const exit = layer.animate(
        [
          { opacity: 1, filter: "blur(0px)", transform: "none" },
          {
            opacity: 0,
            filter: `blur(${String(motion.blur)}px)`,
            transform: `translateY(${String(-motion.distance / 2)}px)`,
          },
        ],
        {
          duration: motion.fast,
          easing: motionEasing(motion, motion.easeExit),
          fill: "forwards",
        },
      );
      const key = layer.dataset.swapLeaving;
      exit.onfinish = () => {
        setLeaving((layers) => layers.filter((layer) => layer.key !== key));
      };
      animations.push(exit);
    }
    const resized =
      before !== null &&
      (Math.abs(before.height - after.height) > 0.5 ||
        Math.abs(before.width - after.width) > 0.5);
    if (!reduced && resized)
      animations.push(
        element.animate(
          [
            {
              width: `${String(before.width)}px`,
              height: `${String(before.height)}px`,
            },
            {
              width: `${String(after.width)}px`,
              height: `${String(after.height)}px`,
            },
          ],
          {
            duration: motion.normal,
            easing: motionEasing(motion, motion.ease),
          },
        ),
      );
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [swapKey, reduced]);

  return (
    <div
      {...props}
      ref={node}
      className={cn("caps-swap", className)}
      data-anchor={anchor}
    >
      {/* One keyed list, so a layer that starts leaving keeps its state. */}
      {[
        ...leaving.map((layer) => (
          <div
            key={layer.key}
            className="caps-swap-layer"
            data-swap-leaving={layer.key}
            aria-hidden="true"
          >
            {layer.content}
          </div>
        )),
        <div key={swapKey} className="caps-swap-layer" data-swap-current="">
          {children}
        </div>,
      ]}
    </div>
  );
});
