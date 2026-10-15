import { RotateCcw } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import { cn } from "../lib/cn.js";
import { canAnimate, motionEasing, readMotion } from "../lib/motion.js";
import {
  formatElapsed,
  useElapsed,
  type ActivityState,
} from "./activity-line.js";
import { IconButton } from "./icon-button.js";
import { Presence } from "./presence.js";
import { Status } from "./status.js";

/** A tool call's time: milliseconds under a second, then the activity clock. */
export function formatCallTime(milliseconds: number): string {
  return milliseconds < 1_000
    ? `${String(Math.max(0, Math.round(milliseconds)))}ms`
    : formatElapsed(milliseconds);
}

/** Props accepted by ToolCallChip. */
export type ToolCallChipProps = Readonly<{
  /** The tool's name, such as `read_file`. */
  name: string;
  state: ActivityState;
  /** When the call started (epoch ms). */
  startedAt: number;
  /** When it ended (epoch ms). */
  finishedAt?: number | undefined;
  /** Offered after a failure. */
  onRetry?: (() => void) | undefined;
  className?: string;
}>;

const glyphFor = {
  running: "arc",
  done: "check",
  failed: "cross",
} as const satisfies Record<ActivityState, "arc" | "check" | "cross">;

/** How long a running fill takes to approach (never reach) the far edge. */
const fillPatienceMs = 6_000;

/**
 * One tool call as a chip. While it runs a quiet fill wipes across and a
 * live clock counts; when it lands the fill completes and washes away; when
 * it fails the chip shakes and offers a retry.
 */
export function ToolCallChip({
  name,
  state,
  startedAt,
  finishedAt,
  onRetry,
  className,
}: ToolCallChipProps) {
  const chip = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const previous = useRef<ActivityState | null>(null);
  const elapsed = useElapsed(startedAt, finishedAt, state === "running");

  useLayoutEffect(() => {
    const element = chip.current;
    const bar = fill.current;
    const before = previous.current;
    previous.current = state;
    if (!element || !bar || !canAnimate(bar)) return;
    const motion = readMotion(element);
    const animations: Animation[] = [];
    if (motion.reduced) {
      // No wipe: the finished tint arrives and leaves as a fade.
      if (before === "running" && state !== "running")
        animations.push(
          bar.animate(
            [
              { transform: "none", opacity: 0 },
              { transform: "none", opacity: 1, offset: 0.3 },
              { transform: "none", opacity: 0 },
            ],
            { duration: motion.slow * 4, easing: motion.ease },
          ),
        );
    } else if (state === "running") {
      animations.push(
        bar.animate(
          [{ transform: "scaleX(0)" }, { transform: "scaleX(0.9)" }],
          {
            duration: fillPatienceMs,
            easing: motionEasing(motion, "cubic-bezier(0.1, 0.6, 0.3, 1)"),
            fill: "forwards",
          },
        ),
      );
    } else if (before === "running") {
      // Land from wherever the wipe had reached.
      const reached = getComputedStyle(bar).transform;
      for (const running of bar.getAnimations()) running.cancel();
      const from = reached === "none" ? "scaleX(0)" : reached;
      animations.push(
        bar.animate(
          state === "done"
            ? [
                { transform: from, opacity: 1 },
                { transform: "scaleX(1)", opacity: 1, offset: 0.25 },
                { transform: "scaleX(1)", opacity: 1, offset: 0.55 },
                { transform: "scaleX(1)", opacity: 0 },
              ]
            : [
                { transform: from, opacity: 1 },
                { transform: from, opacity: 1, offset: 0.5 },
                { transform: from, opacity: 0 },
              ],
          {
            duration: motion.slow * 4,
            easing: motionEasing(motion, motion.ease),
            fill: "forwards",
          },
        ),
      );
      if (state === "failed" && motion.shake > 0) {
        const x = motion.shake;
        animations.push(
          element.animate(
            [
              { transform: "none" },
              { transform: `translateX(${String(-x)}px)` },
              { transform: `translateX(${String(x)}px)` },
              { transform: `translateX(${String(-x / 2)}px)` },
              { transform: "none" },
            ],
            {
              duration: motion.slow * 1.2,
              easing: motionEasing(motion, "linear"),
            },
          ),
        );
      }
    }
    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [state]);

  return (
    <span
      ref={chip}
      className={cn("caps-tool-call", className)}
      data-state={state}
    >
      <span ref={fill} className="caps-tool-call-fill" aria-hidden="true" />
      <Status
        glyph={glyphFor[state]}
        size="compact"
        tone={state === "failed" ? "error" : "neutral"}
      />
      <span className="caps-tool-call-name">{name}</span>
      <span className="caps-tool-call-time">{formatCallTime(elapsed)}</span>
      {onRetry === undefined ? null : (
        <Presence show={state === "failed"} appear>
          <IconButton
            aria-label={`Retry ${name}`}
            icon={<RotateCcw />}
            onClick={onRetry}
            size="xs"
            variant="ghost"
          />
        </Presence>
      )}
    </span>
  );
}
