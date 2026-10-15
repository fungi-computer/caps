import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by ResultState. */
export type ResultStateProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  description: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
};

/** A labelled result presentation; hosts own its meaning and next actions. */
export const ResultState = forwardRef<HTMLElement, ResultStateProps>(
  function ResultState(
    { actions, className, description, icon, title, ...props },
    ref,
  ) {
    const titleId = useId();
    return (
      <section
        {...props}
        aria-labelledby={props["aria-labelledby"] ?? titleId}
        className={cn("result-state", className)}
        ref={ref}
      >
        {icon ? <div aria-hidden="true">{icon}</div> : null}
        <h2 id={props["aria-labelledby"] ? undefined : titleId}>{title}</h2>
        <p>{description}</p>
        {actions ? <div className="result-state-actions">{actions}</div> : null}
      </section>
    );
  },
);
