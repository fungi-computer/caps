import { Slot } from "@radix-ui/react-slot";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ElementRef,
  type ReactNode,
  type RefObject,
} from "react";

import { cn, cva } from "../lib/cn.js";
import {
  canAnimate,
  motionEasing,
  readMotion,
  useReducedMotion,
  type Motion,
} from "../lib/motion.js";
import { Loader } from "./loader.js";

/** Supported Button visual variants. */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "destructive"
  | "outline"
  | "ghost"
  /** Quiet text that turns to the error colour on hover or focus, e.g. Stop. */
  | "ghost-destructive"
  | "link";
/** Supported ButtonSize values. */
export type ButtonSize = "xs" | "sm" | "default" | "lg" | "icon" | "menubar";

/** Outline and link controls keep a neutral disabled plate behind a hairline. */
const disabledPlate =
  "disabled:bg-base-200 disabled:text-base-content disabled:outline-1 disabled:outline-solid disabled:outline-base-content/25 aria-disabled:bg-base-200 aria-disabled:text-base-content aria-disabled:outline-1 aria-disabled:outline-solid aria-disabled:outline-base-content/25";

const buttonVariants = cva("btn caps-button disabled:pointer-events-none", {
  variants: {
    variant: {
      primary: "btn-primary caps-button-filled",
      secondary: "btn-secondary caps-button-filled",
      accent: "btn-accent caps-button-filled",
      destructive: "btn-error caps-button-filled",
      outline: `btn-outline ${disabledPlate}`,
      // A faceless ghost stays faceless when disabled: Caps dims its ink.
      ghost: "btn-ghost",
      "ghost-destructive": "btn-ghost caps-button-ghost-destructive",
      link: `btn-link ${disabledPlate}`,
    },
    size: {
      xs: "btn-xs",
      sm: "btn-sm",
      default: "btn-md",
      lg: "btn-lg",
      icon: "btn-square btn-md",
      menubar: "caps-button-menubar",
    },
  },
  defaultVariants: { variant: "primary", size: "default" },
});

/** The outcome of a Button's last action. */
export type ButtonResult = "done" | "failed";

/** Props accepted by Button. */
export type ButtonProps = {
  asChild?: boolean;
  loading?: boolean;
  /**
   * The outcome of the last action. Becoming `done` plays a short beat: a
   * check (and `resultLabel`) springs in, holds, then settles back to the
   * label. Becoming `failed` shakes the label by the theme's
   * `--stipe-motion-shake`. Say what failed elsewhere, next to the action.
   */
  result?: ButtonResult | undefined;
  /** What the done beat says, such as "Installed". The button keeps the wider of its two labels, so nothing shifts. */
  resultLabel?: ReactNode;
  /**
   * Called when the done beat has held long enough to read, just before it
   * would settle back to the label. Replace the button here to hand off to
   * what comes next (an "Installed" mark, an "Open" action).
   */
  onResultEnd?: (() => void) | undefined;
  size?: ButtonSize;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/** A reusable button with caller-controlled native behavior and intrinsic loading presentation. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      asChild = false,
      children,
      className,
      disabled,
      loading = false,
      result,
      resultLabel,
      onResultEnd,
      size = "default",
      variant = "primary",
      ...props
    },
    ref,
  ) {
    const classes = cn(buttonVariants({ size, variant }), className);
    // A result present when the button first mounts is history, not news.
    const mountedResult = useRef(result).current;
    const node = useRef<HTMLButtonElement>(null);
    useImperativeHandle<HTMLButtonElement | null, HTMLButtonElement | null>(
      ref,
      () => node.current,
    );
    // Text labels compare by value; element labels re-measure each render.
    useWidthTween(node, [loading, result, children]);
    if (asChild) {
      return (
        <Slot
          {...props}
          aria-busy={loading ? true : props["aria-busy"]}
          aria-disabled={disabled === true || loading ? true : undefined}
          className={classes}
          ref={node}
        >
          {children}
        </Slot>
      );
    }
    return (
      <button
        {...props}
        aria-busy={loading ? true : props["aria-busy"]}
        className={classes}
        disabled={disabled === true || loading}
        ref={node}
        type={props.type ?? "button"}
      >
        {result === undefined && resultLabel === undefined ? (
          <>
            {loading ? (
              <Loader className="size-3" decorative size="sm" />
            ) : null}
            {children}
          </>
        ) : (
          <ResultFaces
            label={resultLabel}
            loading={loading}
            onResultEnd={onResultEnd}
            result={result}
            settled={mountedResult}
          >
            {children}
          </ResultFaces>
        )}
      </button>
    );
  },
);

/**
 * When a button's label changes (loading, a result, new text) its width eases
 * to the new size instead of jumping, so neighbours never lurch.
 */
function useWidthTween(
  node: RefObject<HTMLButtonElement | null>,
  label: readonly unknown[],
) {
  const width = useRef<number | null>(null);
  const tween = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    const running = tween.current;
    const from = running
      ? element.getBoundingClientRect().width
      : width.current;
    running?.cancel();
    tween.current = null;
    const to = element.getBoundingClientRect().width;
    width.current = to;
    if (from === null || Math.abs(from - to) < 1 || !canAnimate(element))
      return;
    const motion = readMotion(element);
    if (motion.reduced) return;
    const animation = element.animate(
      [{ width: `${String(from)}px` }, { width: `${String(to)}px` }],
      { duration: motion.normal, easing: motionEasing(motion, motion.ease) },
    );
    tween.current = animation;
    // Content wider than the moving edge is clipped, never spilled or wrapped.
    element.style.overflow = "clip";
    element.style.whiteSpace = "nowrap";
    const done = () => {
      if (tween.current !== animation) return;
      tween.current = null;
      element.style.removeProperty("overflow");
      element.style.removeProperty("white-space");
    };
    animation.onfinish = done;
    animation.oncancel = done;
  }, [node, ...label]);
}

/** How long the done beat holds before settling: long enough to read. */
const resultHoldMs = 1100;

function pop(faces: HTMLElement, motion: Motion) {
  // One overshoot sized by the theme's bounce; a calm theme just nods.
  const liveliness = motion.bounce / 0.3;
  const lift = 1 + 0.05 * Math.min(1.4, 0.4 + liveliness);
  const dip = 1 - 0.02 * Math.min(1.4, liveliness);
  return faces.animate(
    [
      { transform: "scale(1)" },
      { transform: `scale(${String(lift)})`, offset: 0.35 },
      { transform: `scale(${String(dip)})`, offset: 0.7 },
      { transform: "scale(1)" },
    ],
    {
      duration: motion.springDuration,
      easing: motionEasing(motion, "ease-out"),
    },
  );
}

function shake(faces: HTMLElement, motion: Motion) {
  const x = motion.shake;
  return faces.animate(
    [
      { transform: "none" },
      { transform: `translateX(${String(-x)}px)` },
      { transform: `translateX(${String(x)}px)` },
      { transform: `translateX(${String(-x * 0.6)}px)` },
      { transform: `translateX(${String(x * 0.3)}px)` },
      { transform: "none" },
    ],
    { duration: motion.slow * 1.3, easing: motionEasing(motion, "linear") },
  );
}

function swapFaces(
  leaving: HTMLElement,
  arriving: HTMLElement,
  motion: Motion,
) {
  const travel = motion.distance + 2;
  const blur = `blur(${String(motion.blur)}px)`;
  return [
    leaving.animate(
      [
        { opacity: 1, transform: "none", filter: "blur(0px)" },
        {
          opacity: 0,
          transform: `translateY(${String(-travel)}px)`,
          filter: blur,
        },
      ],
      {
        duration: motion.fast,
        // A label rolls away at once; an ease-in would linger on stale text.
        easing: motionEasing(motion, motion.ease),
      },
    ),
    arriving.animate(
      [
        {
          opacity: 0,
          transform: `translateY(${String(travel)}px)`,
          filter: blur,
        },
        { opacity: 1, transform: "none", filter: "blur(0px)" },
      ],
      {
        duration: motion.normal,
        easing: motionEasing(motion, motion.ease),
        fill: "backwards",
      },
    ),
  ];
}

/** @internal The label and result faces of a Button with a result beat. */
function ResultFaces({
  children,
  label,
  loading,
  onResultEnd,
  result,
  settled,
}: {
  children: ReactNode;
  label: ReactNode;
  loading: boolean;
  onResultEnd: (() => void) | undefined;
  result: ButtonResult | undefined;
  settled: ButtonResult | undefined;
}) {
  const faces = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [showing, setShowing] = useState(false);
  // The result face exists only for its beat, so it never lingers as hidden
  // text in the button.
  const [resultMounted, setResultMounted] = useState(false);
  if (showing && !resultMounted) setResultMounted(true);
  const previous = useRef(settled);
  const ended = useRef(onResultEnd);
  useEffect(() => {
    ended.current = onResultEnd;
  }, [onResultEnd]);

  // Before paint, so the label never flashes ahead of the beat.
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = result;
    if (result === before) return;
    if (result === "done") {
      setShowing(true);
      const settle = setTimeout(() => {
        // A caller that hands off keeps the result face until it replaces
        // the button; otherwise the beat settles back to the label.
        if (ended.current) ended.current();
        else setShowing(false);
      }, resultHoldMs);
      return () => {
        clearTimeout(settle);
      };
    }
    setShowing(false);
    const element = faces.current;
    if (result !== "failed" || !element || !canAnimate(element)) return;
    const motion = readMotion(element);
    if (motion.shake <= 0) return;
    const refusal = shake(element, motion);
    return () => {
      refusal.cancel();
    };
  }, [result, reduced]);

  const shown = useRef(showing);
  useLayoutEffect(() => {
    const element = faces.current;
    if (!element || shown.current === showing) return;
    shown.current = showing;
    const labelFace = element.querySelector<HTMLElement>('[data-face="label"]');
    const resultFace = element.querySelector<HTMLElement>(
      '[data-face="result"]',
    );
    if (!labelFace || !resultFace || !canAnimate(element)) {
      if (!showing) setResultMounted(false);
      return;
    }
    const motion = readMotion(element);
    const animations = showing
      ? swapFaces(labelFace, resultFace, motion)
      : swapFaces(resultFace, labelFace, motion);
    if (!showing)
      animations[0]?.addEventListener("finish", () => {
        setResultMounted(false);
      });
    if (showing && !motion.reduced) {
      animations.push(pop(element.closest("button") ?? element, motion));
      const tick = resultFace.querySelector<SVGPathElement>("path");
      if (tick)
        animations.push(
          tick.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
            duration: motion.normal * 1.4,
            delay: motion.fast / 2,
            easing: motionEasing(motion, motion.ease),
            fill: "backwards",
          }),
        );
    }
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [showing, reduced]);

  return (
    <span
      ref={faces}
      className="caps-button-faces"
      data-showing={showing ? "result" : "label"}
    >
      <span
        className="caps-button-face"
        data-face="label"
        aria-hidden={showing ? true : undefined}
      >
        {loading || showing ? (
          <Loader className="size-3" decorative size="sm" />
        ) : null}
        {children}
      </span>
      {resultMounted ? (
        <span
          className="caps-button-face"
          data-face="result"
          aria-hidden={showing ? undefined : true}
        >
          <svg
            className="caps-button-check"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M4.5 12.5 9.5 17.5 19.5 6.5" pathLength={1} />
          </svg>
          {label === undefined ? children : label}
        </span>
      ) : null}
    </span>
  );
}

/** The native element type used by Button. */
export type ButtonElement = ElementRef<"button">;
