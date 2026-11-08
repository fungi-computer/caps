import type { HTMLAttributes, ReactNode } from "react";

import { Alert } from "../components/alert.js";
import { Button } from "../components/button.js";
import { Status } from "../components/status.js";
import { cn } from "../lib/cn.js";
import { EmptyState } from "./empty-state.js";

/** A step the person takes to finish setup. */
export type SetupNoticeAction = Readonly<{
  label: string;
  /** Called when the step is chosen. */
  onSelect: () => void;
}>;

/** The required fix; `pending` means it opened Settings and is waiting. */
export type SetupNoticeFix = SetupNoticeAction &
  Readonly<{ pending?: boolean }>;

/** Props accepted by SetupNotice. */
export type SetupNoticeProps = Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children"
> & {
  /** The title, such as "Connect a model to start chatting". */
  need: ReactNode;
  /** One sentence naming the real cause. */
  cause: ReactNode;
  /** The one primary fix; never a dead CTA. */
  fix: SetupNoticeFix;
  secondary?: SetupNoticeAction;
  /** What still works meanwhile, such as "Uploads work now". */
  available?: ReactNode;
  /** Names what is awaited while pending, after "Waiting for". */
  waitingFor?: string;
  /** `panel` replaces an empty state; `banner` and `inline` sit above or in content. */
  variant: "panel" | "inline" | "banner";
};

/**
 * Missing setup, named with its fix. Render it only while the setup fact is
 * missing; when the fact turns ready the host unmounts it (and may toast).
 */
export function SetupNotice({
  available,
  cause,
  className,
  fix,
  need,
  secondary,
  variant,
  waitingFor = "setup",
  ...props
}: SetupNoticeProps) {
  const pending = fix.pending === true;
  const label = pending ? `Waiting for ${waitingFor}…` : fix.label;
  const detail = available ? (
    <>
      {cause} <span className="caps-setup-notice-available">{available}</span>
    </>
  ) : (
    cause
  );
  if (variant === "panel") {
    return (
      <EmptyState
        {...props}
        actions={
          secondary ? (
            <Button size="sm" variant="ghost" onClick={secondary.onSelect}>
              {secondary.label}
            </Button>
          ) : undefined
        }
        className={cn("caps-setup-notice", className)}
        data-variant="panel"
        description={detail}
        primaryAction={{
          label,
          onSelect: fix.onSelect,
          pending,
        }}
        title={need}
        variant="panel"
        visual={
          <Status
            className="caps-setup-notice-dot"
            glyph="dot"
            tone="warning"
          />
        }
      />
    );
  }
  return (
    <div className="caps-setup-notice-frame">
      <Alert
        {...props}
        action={
          <span className="caps-setup-notice-actions">
            {secondary ? (
              <Button size="sm" variant="ghost" onClick={secondary.onSelect}>
                {secondary.label}
              </Button>
            ) : null}
            <Button
              loading={pending}
              size="sm"
              variant="outline"
              onClick={fix.onSelect}
            >
              {label}
            </Button>
          </span>
        }
        className={cn("caps-setup-notice", className)}
        data-variant={variant}
        description={detail}
        role="status"
        title={
          <span className="caps-setup-notice-title">
            <Status glyph="dot" tone="warning" />
            {need}
          </span>
        }
        tone="warning"
      />
    </div>
  );
}
