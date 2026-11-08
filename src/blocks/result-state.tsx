import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";

import { Status } from "../components/status.js";
import { cn } from "../lib/cn.js";

/** The document heading level of a ResultState title. */
export type ResultStateHeadingLevel = 2 | 3 | 4;

const headingTags = { 2: "h2", 3: "h3", 4: "h4" } as const;

/** What happened: `failed` is the failure card, `done` a finished result. */
export type ResultStateTone = "failed" | "done" | "neutral";

/** Props accepted by ResultState. */
export type ResultStateProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  /** One primary action, then secondary ones. */
  actions?: ReactNode;
  description: ReactNode;
  headingLevel?: ResultStateHeadingLevel;
  icon?: ReactNode;
  /** Up to three numbered next steps; extra steps are not shown. */
  steps?: readonly ReactNode[];
  title: ReactNode;
  tone?: ResultStateTone;
  /** Larger decorative art above the title, such as an illustration. */
  visual?: ReactNode;
};

const MAX_STEPS = 3;

/** A labelled result presentation; hosts own its meaning and next actions. */
export const ResultState = forwardRef<HTMLElement, ResultStateProps>(
  function ResultState(
    {
      actions,
      className,
      description,
      headingLevel = 2,
      icon,
      steps,
      title,
      tone = "neutral",
      visual,
      ...props
    },
    ref,
  ) {
    const titleId = useId();
    const Heading = headingTags[headingLevel];
    const shown = steps?.slice(0, MAX_STEPS) ?? [];
    return (
      <section
        {...props}
        aria-labelledby={props["aria-labelledby"] ?? titleId}
        className={cn("result-state", className)}
        data-tone={tone === "neutral" ? undefined : tone}
        ref={ref}
      >
        {visual ? (
          <div aria-hidden="true" className="result-state-visual">
            {visual}
          </div>
        ) : null}
        {icon ? <div aria-hidden="true">{icon}</div> : null}
        <Heading id={props["aria-labelledby"] ? undefined : titleId}>
          {tone === "neutral" ? null : (
            <Status
              glyph="dot"
              tone={tone === "failed" ? "error" : "success"}
            />
          )}
          <span>{title}</span>
        </Heading>
        <p>{description}</p>
        {shown.length > 0 ? (
          <ol className="result-state-steps">
            {shown.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        ) : null}
        {actions ? <div className="result-state-actions">{actions}</div> : null}
      </section>
    );
  },
);
