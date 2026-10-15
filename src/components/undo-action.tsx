import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { canAnimate, motionEasing, readMotion } from "../lib/motion.js";
import { Button, type ButtonProps } from "./button.js";
import { VisuallyHidden } from "./visually-hidden.js";

/** Props accepted by Fuse. */
export type FuseProps = {
  /** How long the fuse burns, in milliseconds: a decision window, not motion. */
  duration: number;
  /** Hold the burn, for example while the pointer rests on the action. */
  paused?: boolean;
  /** Called once when the fuse has burnt down. */
  onBurnt: () => void;
  className?: string;
};

/**
 * A hairline that burns down over its duration, then calls `onBurnt`. Its
 * thickness is the theme's `--stipe-motion-fuse` (0 hides it but the window
 * still runs). Under reduced motion it ticks down once a second instead of
 * burning smoothly.
 */
export function Fuse({
  duration,
  paused = false,
  onBurnt,
  className,
}: FuseProps) {
  const node = useRef<HTMLSpanElement>(null);
  const burn = useRef<Animation | null>(null);
  const burnt = useRef(onBurnt);
  useEffect(() => {
    burnt.current = onBurnt;
  }, [onBurnt]);

  useLayoutEffect(() => {
    const element = node.current;
    if (!element) return;
    if (!canAnimate(element)) {
      const timer = setTimeout(() => {
        burnt.current();
      }, duration);
      return () => {
        clearTimeout(timer);
      };
    }
    const motion = readMotion(element);
    const seconds = Math.max(1, Math.round(duration / 1000));
    const animation = element.animate(
      [{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }],
      {
        duration,
        easing: motion.reduced
          ? `steps(${String(seconds)}, end)`
          : motionEasing(motion, "linear"),
        fill: "forwards",
      },
    );
    animation.addEventListener("finish", () => {
      burnt.current();
    });
    burn.current = animation;
    return () => {
      animation.cancel();
      burn.current = null;
    };
  }, [duration]);

  useEffect(() => {
    const animation = burn.current;
    if (!animation) return;
    if (paused) animation.pause();
    else if (animation.playState === "paused") animation.play();
  }, [paused]);

  return (
    <span
      ref={node}
      aria-hidden="true"
      className={cn("caps-fuse", className)}
    />
  );
}

/** Props accepted by UndoAction. */
export type UndoActionProps = {
  /** The action's label, such as "Stop". */
  children: ReactNode;
  /** Runs when the undo window closes without an undo: the action happens then. */
  onCommit: () => void;
  /** Spoken when the action is armed, such as "Port 5173 stops in 5 seconds". */
  armedAnnouncement: string;
  /** Spoken after an undo, such as "Port 5173 kept open". */
  undoneAnnouncement: string;
  undoLabel?: ReactNode;
  /** The undo window in milliseconds. */
  undoMs?: number;
} & Omit<ButtonProps, "children" | "onClick" | "result" | "resultLabel">;

/**
 * A destructive action that waits for its undo window instead of asking
 * first. Pressing it turns the same button into Undo with a fuse burning along
 * its edge; Undo or Escape cancels, and the action commits when the fuse runs
 * out. Resting the pointer on it holds the fuse.
 */
export const UndoAction = forwardRef<HTMLButtonElement, UndoActionProps>(
  function UndoAction(
    {
      children,
      onCommit,
      armedAnnouncement,
      undoneAnnouncement,
      undoLabel = "Undo",
      undoMs = 5000,
      className,
      onKeyDown,
      onPointerEnter,
      onPointerLeave,
      ...props
    },
    ref,
  ) {
    const [armed, setArmed] = useState(false);
    const [held, setHeld] = useState(false);
    const [spoken, setSpoken] = useState("");
    const hint = useId();
    const undo = () => {
      setArmed(false);
      setSpoken(undoneAnnouncement);
    };
    return (
      <>
        <Button
          {...props}
          ref={ref}
          aria-label={armed ? undefined : props["aria-label"]}
          aria-labelledby={armed ? undefined : props["aria-labelledby"]}
          aria-describedby={armed ? hint : props["aria-describedby"]}
          className={cn("caps-undo-action", className)}
          data-armed={armed ? "" : undefined}
          onClick={() => {
            if (armed) {
              undo();
              return;
            }
            setArmed(true);
            setSpoken(armedAnnouncement);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (armed && event.key === "Escape") {
              event.preventDefault();
              undo();
            }
          }}
          onPointerEnter={(event) => {
            onPointerEnter?.(event);
            setHeld(true);
          }}
          onPointerLeave={(event) => {
            onPointerLeave?.(event);
            setHeld(false);
          }}
        >
          {armed ? undoLabel : children}
          {armed ? (
            <Fuse
              duration={undoMs}
              paused={held}
              onBurnt={() => {
                setArmed(false);
                setSpoken("");
                onCommit();
              }}
            />
          ) : null}
        </Button>
        <VisuallyHidden id={hint}>Press Escape to undo.</VisuallyHidden>
        <VisuallyHidden role="status">{spoken}</VisuallyHidden>
      </>
    );
  },
);
