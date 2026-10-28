import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by Composer. */
export type ComposerProps = HTMLAttributes<HTMLDivElement> & {
  /** The caller-owned field, typed into directly: the surface is the field. */
  input: ReactNode;
  /** The caller-owned key at the end of the bottom row, such as a SendAction. */
  action?: ReactNode;
  /** Caller-owned controls and readouts along the bottom edge, before the action. */
  toolbar?: ReactNode;
  /** Caller-owned items riding with the draft, shown above the text. */
  attachments?: ReactNode;
};

/**
 * One composer surface: attachments, then the text, then a slim row along the
 * bottom edge holding the toolbar and, at its end, the action. It draws no box
 * of its own: the host region is the field. Layout and slots only; it never
 * assigns action-control semantics.
 */
export const Composer = forwardRef<HTMLDivElement, ComposerProps>(
  function Composer(
    { action, attachments, className, input, toolbar, ...rootProps },
    ref,
  ) {
    return (
      <div {...rootProps} ref={ref} className={cn("caps-composer", className)}>
        {attachments === undefined ? null : (
          <div className="caps-composer-attachments">{attachments}</div>
        )}
        <div className="caps-composer-input">{input}</div>
        {toolbar === undefined && action === undefined ? null : (
          <div className="caps-composer-bar">
            <div className="caps-composer-toolbar">{toolbar}</div>
            {action}
          </div>
        )}
      </div>
    );
  },
);
