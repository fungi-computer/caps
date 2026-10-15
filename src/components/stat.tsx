import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by Stat. */
export type StatProps = {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  /** Reduce internal padding when a statistic sits inside a compact card. */
  density?: "regular" | "compact";
} & Omit<HTMLAttributes<HTMLDListElement>, "children">;

/** A compact statistic presentation for caller-provided values. */
export const Stat = forwardRef<HTMLDListElement, StatProps>(function Stat(
  { className, density = "regular", label, value, description, ...props },
  ref,
) {
  return (
    <dl
      {...props}
      className={cn(
        "stats",
        density === "compact" && "caps-stat-compact",
        className,
      )}
      ref={ref}
    >
      <div className="stat">
        <dt className="stat-title text-base-content">{label}</dt>
        <dd className="stat-value caps-numeric">{value}</dd>
        {description !== undefined ? (
          <dd className="stat-desc text-base-content">{description}</dd>
        ) : null}
      </div>
    </dl>
  );
});
