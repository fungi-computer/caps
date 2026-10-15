import {
  forwardRef,
  type HTMLAttributes,
  type ProgressHTMLAttributes,
} from "react";

import { cn } from "../lib/cn.js";

/** Supported ProgressTone values. */
export type ProgressTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "error";

const progressToneClasses = {
  neutral: "progress-neutral",
  primary: "progress-primary",
  secondary: "progress-secondary",
  accent: "progress-accent",
  success: "progress-success",
  info: "progress-info",
  warning: "progress-warning",
  error: "progress-error",
} satisfies Record<ProgressTone, string>;

/** Props accepted by Progress. */
export type ProgressProps = {
  tone?: ProgressTone;
} & ProgressHTMLAttributes<HTMLProgressElement>;

/** A progress indicator for caller-provided progress values. */
export const Progress = forwardRef<HTMLProgressElement, ProgressProps>(
  function Progress({ className, tone = "primary", ...props }, ref) {
    return (
      <progress
        {...props}
        data-complete={
          props.value !== undefined &&
          Number(props.value) >= Number(props.max ?? 1)
            ? "true"
            : undefined
        }
        className={cn(
          "progress caps-gooey-motion caps-gooey-progress w-full",
          progressToneClasses[tone],
          className,
        )}
        ref={ref}
      />
    );
  },
);

/** A compact labelled resource meter for game windows. Values come from the game. */
export type GameMeterProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  label: string;
  value: number;
  max: number;
  tone?: ProgressTone;
};

/** Pair a game's bounded resource value with its visible and accessible meter. */
export const GameMeter = forwardRef<HTMLDivElement, GameMeterProps>(
  function GameMeter(
    { label, value, max, tone = "info", className, ...props },
    ref,
  ) {
    return (
      <div {...props} ref={ref} className={cn("caps-game-meter", className)}>
        <div className="caps-game-meter-readout">
          <span>{label}</span>
          <span className="caps-game-meter-value">
            {value} / {max}
          </span>
        </div>
        <Progress aria-label={label} value={value} max={max} tone={tone} />
      </div>
    );
  },
);
