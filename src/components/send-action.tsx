import { ArrowUp, Square } from "lucide-react";
import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

import {
  canAnimate,
  motionEasing,
  readMotion,
  type Motion,
} from "../lib/motion.js";
import { KeycapButton, type KeycapButtonProps } from "./keycap.js";
import { Loader } from "./loader.js";
import { cn } from "../lib/cn.js";

/** Where a composer's send action is: nothing to send, ready, or working. */
export type SendActionState = "empty" | "ready" | "busy";

/** Props accepted by SendAction. */
export type SendActionProps = {
  state: SendActionState;
  /** The accessible name while it sends, such as "Generate image". */
  "aria-label": string;
  /** Offered while busy: the arrow becomes a stop square that calls this. */
  onStop?: (() => void) | undefined;
  /** The accessible name of the stop action. */
  stopLabel?: string;
  /** Glyph size in pixels. */
  iconSize?: number;
} & Omit<
  KeycapButtonProps,
  | "label"
  | "icon"
  | "readout"
  | "shortcut"
  | "pressed"
  | "expanded"
  | "aria-label"
>;

function lift(face: HTMLElement, motion: Motion) {
  // The arrow launches upward and away: the prompt has gone.
  return face.animate(
    motion.reduced
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "translateY(-120%)" },
        ],
    {
      duration: motion.reduced ? motion.fast : motion.normal,
      easing: motionEasing(motion, motion.easeExit),
      fill: "backwards",
    },
  );
}

function land(face: HTMLElement, motion: Motion) {
  // The arrow drops back in from below and settles, by the theme's bounce.
  const overshoot = -12 * Math.min(1.5, motion.bounce / 0.3);
  return face.animate(
    motion.reduced
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          { opacity: 0, transform: "translateY(70%)" },
          {
            opacity: 1,
            transform: `translateY(${String(overshoot)}%)`,
            offset: 0.6,
          },
          { opacity: 1, transform: "none" },
        ],
    {
      duration: motion.reduced ? motion.fast : motion.springDuration,
      easing: motionEasing(motion, motion.ease),
      fill: "backwards",
    },
  );
}

function fade(face: HTMLElement, motion: Motion, to: 0 | 1) {
  return face.animate([{ opacity: 1 - to }, { opacity: to }], {
    duration: motion.reduced ? motion.fast : motion.normal,
    delay: to === 1 && !motion.reduced ? motion.fast / 2 : 0,
    easing: motionEasing(motion, motion.ease),
    fill: "backwards",
  });
}

function charge(button: HTMLElement, motion: Motion) {
  // Once there is something to send, the key wakes with a small pop.
  const pop = 1 + 0.05 * Math.min(1.5, 0.4 + motion.bounce / 0.3);
  return button.animate(
    [
      { transform: "scale(1)" },
      { transform: `scale(${String(pop)})`, offset: 0.4 },
      { transform: "scale(1)" },
    ],
    {
      duration: motion.springDuration,
      easing: motionEasing(motion, "ease-out"),
    },
  );
}

/**
 * A composer's one send key, on the Caps keycap. Empty, it rests disabled;
 * given something to send it wakes with a small pop; sending, its arrow
 * launches away and a working indicator (or, with `onStop`, a stop square)
 * takes its place in the same key; when the work ends the arrow drops back
 * in. It never grows a second button. All timing comes from the theme's
 * motion tokens, and reduced motion keeps short fades only.
 */
export const SendAction = forwardRef<HTMLButtonElement, SendActionProps>(
  function SendAction(
    {
      state,
      onStop,
      stopLabel = "Stop",
      iconSize = 20,
      onClick,
      disabled,
      className,
      tone = "primary",
      "aria-label": label,
      ...props
    },
    ref,
  ) {
    const node = useRef<HTMLButtonElement>(null);
    useImperativeHandle<HTMLButtonElement | null, HTMLButtonElement | null>(
      ref,
      () => node.current,
    );
    const previous = useRef(state);
    useLayoutEffect(() => {
      const button = node.current;
      const before = previous.current;
      previous.current = state;
      if (!button || before === state || !canAnimate(button)) return;
      const arrow = button.querySelector<HTMLElement>('[data-glyph="arrow"]');
      const work = button.querySelector<HTMLElement>('[data-glyph="busy"]');
      if (!arrow || !work) return;
      const motion = readMotion(button);
      const animations: Animation[] = [];
      if (state === "busy")
        animations.push(lift(arrow, motion), fade(work, motion, 1));
      else if (before === "busy")
        animations.push(fade(work, motion, 0), land(arrow, motion));
      if (before === "empty" && state === "ready" && !motion.reduced)
        animations.push(charge(button, motion));
      return () => {
        for (const animation of animations) animation.cancel();
      };
    }, [state]);

    const busy = state === "busy";
    const stoppable = busy && onStop !== undefined;
    return (
      <KeycapButton
        {...props}
        ref={node}
        className={cn("caps-send-action", className)}
        tone={tone}
        aria-busy={busy ? true : undefined}
        aria-label={stoppable ? stopLabel : label}
        data-send-state={state}
        disabled={
          disabled === true || state === "empty" || (busy && !stoppable)
        }
        onClick={stoppable ? onStop : onClick}
        label={null}
        icon={
          <span className="caps-send-glyph" data-state={state}>
            <span data-glyph="arrow">
              <ArrowUp aria-hidden="true" size={iconSize} />
            </span>
            <span data-glyph="busy">
              {onStop === undefined ? (
                <Loader decorative size="sm" />
              ) : (
                <Square
                  aria-hidden="true"
                  fill="currentColor"
                  size={Math.round(iconSize * 0.7)}
                />
              )}
            </span>
          </span>
        }
      />
    );
  },
);
