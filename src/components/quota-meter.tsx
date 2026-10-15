import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";
import { Progress, type ProgressTone } from "./progress.js";

/** Props accepted by QuotaMeter. */
export type QuotaMeterProps = {
  label: ReactNode;
  value: number;
  max: number;
  valueLabel?: ReactNode;
  maxLabel?: ReactNode;
  description?: ReactNode;
  indicator?: ReactNode;
  tone?: ProgressTone;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

/** A meter presentation for caller-provided quota values. */
export const QuotaMeter = forwardRef<HTMLDivElement, QuotaMeterProps>(
  function QuotaMeter(
    {
      className,
      label,
      value,
      max,
      valueLabel,
      maxLabel,
      description,
      indicator,
      tone,
      ...props
    },
    ref,
  ) {
    const id = useId();
    const labelId = `${id}-label`;
    const descriptionId = `${id}-description`;

    return (
      <div {...props} className={cn("space-y-sm", className)} ref={ref}>
        <div className="flex items-center justify-between gap-sm">
          <div className="flex items-center gap-sm">
            <div className="font-medium" id={labelId}>
              {label}
            </div>
            {indicator !== undefined ? <div>{indicator}</div> : null}
          </div>
          <div className="caps-numeric">
            {valueLabel ?? value} / {maxLabel ?? max}
          </div>
        </div>
        <Progress
          aria-describedby={
            description !== undefined ? descriptionId : undefined
          }
          aria-labelledby={labelId}
          max={max}
          {...(tone === undefined ? {} : { tone })}
          value={value}
        />
        {description !== undefined ? (
          <p className="text-sm text-base-content" id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
