import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { canAnimate, motionEasing, readMotion } from "../lib/motion.js";
import { Button, type ButtonProps } from "./button.js";
import { VisuallyHidden } from "./visually-hidden.js";

/** Props accepted by HoldButton. */
export type HoldButtonProps = {
  children: ReactNode;
  /** Runs once the button has been held for `holdMs`. */
  onConfirm: () => void;
  /** How long to hold, in milliseconds: a deliberate pause, not motion. */
  holdMs?: number;
  /** Spoken description of the gesture. */
  holdHint?: string;
} & Omit<ButtonProps, "children" | "onClick">;

const confirmKeys = new Set(["Enter", " "]);

/**
 * For an action nothing can undo: press and hold (pointer, Space or Enter)
 * while a fill rises; let go early and it drops back; hold to the top and the
 * action runs. Under reduced motion the fill rises in three steps.
 */
export const HoldButton = forwardRef<HTMLButtonElement, HoldButtonProps>(
  function HoldButton(
    {
      children,
      onConfirm,
      holdMs = 900,
      holdHint = "Press and hold to confirm.",
      className,
      disabled,
      loading = false,
      result,
      resultLabel,
      onBlur,
      onKeyDown,
      onKeyUp,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      ...props
    },
    ref,
  ) {
    const fill = useRef<HTMLSpanElement>(null);
    const rising = useRef<Animation | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const confirm = useRef(onConfirm);
    const hint = useId();
    useEffect(() => {
      confirm.current = onConfirm;
    }, [onConfirm]);
    useEffect(
      () => () => {
        rising.current?.cancel();
        if (timer.current !== null) clearTimeout(timer.current);
      },
      [],
    );

    const finish = () => {
      rising.current = null;
      timer.current = null;
      confirm.current();
      const element = fill.current;
      if (!element || !canAnimate(element)) return;
      const motion = readMotion(element);
      element.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: motion.normal,
        easing: motionEasing(motion, motion.easeExit),
      });
    };

    const start = () => {
      const element = fill.current;
      if (
        disabled === true ||
        loading ||
        !element ||
        rising.current ||
        timer.current
      )
        return;
      if (!canAnimate(element)) {
        timer.current = setTimeout(finish, holdMs);
        return;
      }
      const motion = readMotion(element);
      const animation = element.animate(
        [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }],
        {
          duration: holdMs,
          easing: motion.reduced
            ? "steps(3, end)"
            : motionEasing(motion, "cubic-bezier(0.3, 0, 0.7, 1)"),
        },
      );
      animation.addEventListener("finish", finish);
      rising.current = animation;
    };

    const release = () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      const animation = rising.current;
      const element = fill.current;
      if (!animation || !element) return;
      rising.current = null;
      // Drop back from wherever the fill had reached.
      const reached = getComputedStyle(element).transform;
      animation.cancel();
      const motion = readMotion(element);
      element.animate(
        [
          { transform: reached === "none" ? "scaleY(0)" : reached },
          { transform: "scaleY(0)" },
        ],
        { duration: motion.fast, easing: motionEasing(motion, motion.ease) },
      );
    };

    return (
      <>
        <Button
          {...props}
          ref={ref}
          disabled={disabled}
          loading={loading}
          result={result}
          // Only the label repeats on the result face; the hold fill owns one ref.
          resultLabel={
            resultLabel ?? (result === undefined ? undefined : children)
          }
          aria-describedby={hint}
          className={cn("caps-hold-button", className)}
          onBlur={(event) => {
            release();
            onBlur?.(event);
          }}
          onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
            onPointerDown?.(event);
            if (event.button === 0) start();
          }}
          onPointerUp={(event: PointerEvent<HTMLButtonElement>) => {
            onPointerUp?.(event);
            release();
          }}
          onPointerLeave={(event: PointerEvent<HTMLButtonElement>) => {
            onPointerLeave?.(event);
            release();
          }}
          onPointerCancel={(event: PointerEvent<HTMLButtonElement>) => {
            onPointerCancel?.(event);
            release();
          }}
          onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
            onKeyDown?.(event);
            if (event.key === "Escape") release();
            if (!confirmKeys.has(event.key)) return;
            event.preventDefault();
            if (!event.repeat) start();
          }}
          onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
            onKeyUp?.(event);
            if (!confirmKeys.has(event.key)) return;
            event.preventDefault();
            release();
          }}
        >
          <span ref={fill} aria-hidden="true" className="caps-hold-fill" />
          {children}
        </Button>
        <VisuallyHidden id={hint}>{holdHint}</VisuallyHidden>
      </>
    );
  },
);
