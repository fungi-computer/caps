import {
  forwardRef,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { Button } from "../components/button.js";
import { Loader, type LoaderVariant } from "../components/loader.js";
import { cn } from "../lib/cn.js";

/** How long a wait runs before LoadingState admits it is slow. */
export const LOADING_SLOW_AFTER_MS = 8000;

/** Props accepted by LoadingState. */
export type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  message: ReactNode;
  /** `false` drops the frame (border, plate, padding) for a window-opening state that fills its pane. */
  framed?: boolean;
  /** An App icon shown above the loader, for an App opening state. */
  icon?: ReactNode;
  /** A second, quieter line under the message. */
  detail?: ReactNode;
  /** Blob size; `md` is the default for a window or pane. */
  size?: "sm" | "md" | "lg";
  /** Which formation moves; pick one per moment (see the Caps README). */
  variant?: LoaderVariant;
  /**
   * Milliseconds before the wait is called slow: "Still working…" is added
   * and `onRetry`, if given, offers a Retry. Infinity never says so.
   */
  slowAfterMs?: number;
  /** Called when Retry is chosen; Retry only appears once the wait is slow. */
  onRetry?: () => void;
};

/** A bounded, labelled loading region; the caller owns the message. */
export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  function LoadingState(
    {
      className,
      detail,
      framed = true,
      icon,
      message,
      onRetry,
      size = "md",
      slowAfterMs = LOADING_SLOW_AFTER_MS,
      variant = "line",
      ...props
    },
    ref,
  ) {
    const [slow, setSlow] = useState(false);
    useEffect(() => {
      setSlow(false);
      if (!Number.isFinite(slowAfterMs)) return undefined;
      const timer = globalThis.setTimeout(() => {
        setSlow(true);
      }, slowAfterMs);
      return () => {
        globalThis.clearTimeout(timer);
      };
    }, [slowAfterMs, message]);
    return (
      <div
        {...props}
        className={cn("caps-loading-state", className)}
        data-framed={framed ? undefined : "false"}
        data-icon={icon ? "" : undefined}
        data-size={size}
        data-slow={slow || undefined}
        ref={ref}
        role="status"
      >
        {icon ? (
          <span aria-hidden="true" className="caps-loading-state-icon">
            {icon}
          </span>
        ) : null}
        <Loader decorative size={size} variant={variant} />
        <span className="caps-loading-state-copy">
          <span>{message}</span>
          {detail ? (
            <span className="caps-loading-state-detail">{detail}</span>
          ) : null}
          {slow ? (
            <span className="caps-loading-state-detail">Still working…</span>
          ) : null}
        </span>
        {slow && onRetry ? (
          <Button
            className="caps-loading-state-retry"
            size="sm"
            variant="outline"
            onClick={onRetry}
          >
            Retry
          </Button>
        ) : null}
      </div>
    );
  },
);
