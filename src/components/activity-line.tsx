import { ChevronRight } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { Loader } from "./loader.js";
import { Collapse, Swap } from "./presence.js";
import { Status } from "./status.js";

/** Where a piece of agent work stands. */
export type ActivityState = "running" | "done" | "failed";

/** Short elapsed time: `0.4s`, `4.2s`, `42s`, `3m 05s`. */
export function formatElapsed(milliseconds: number): string {
  const ms = Math.max(0, milliseconds);
  if (ms < 10_000) return `${(ms / 1_000).toFixed(1)}s`;
  if (ms < 60_000) return `${String(Math.floor(ms / 1_000))}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  return `${String(minutes)}m ${String(seconds).padStart(2, "0")}s`;
}

/**
 * A clock that ticks while `running` and holds still otherwise. Times are
 * epoch milliseconds (`Date.now()`), owned by the caller.
 */
export function useElapsed(
  startedAt: number,
  finishedAt: number | undefined,
  running: boolean,
): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const tick = setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => {
      clearInterval(tick);
    };
  }, [running]);
  return (finishedAt ?? now) - startedAt;
}

/** A finished mark that closes its arc and draws itself once it appears. */
function SettledMark({ outcome }: { outcome: "check" | "cross" }) {
  const [drawn, setDrawn] = useState(false);
  useLayoutEffect(() => {
    setDrawn(true);
  }, []);
  return (
    <Status
      glyph={drawn ? outcome : "arc"}
      progress={1}
      size="compact"
      tone={outcome === "check" ? "neutral" : "error"}
    />
  );
}

/** Props accepted by ActivityLine. */
export type ActivityLineProps = Readonly<{
  state: ActivityState;
  /** When the work started (epoch ms). */
  startedAt: number;
  /** When it ended (epoch ms); otherwise the moment it stopped running. */
  finishedAt?: number | undefined;
  /** What is happening, such as "Thinking". */
  label: string;
  /** How finished work reads before its time, such as "Thought for". */
  doneLabel: string;
  /** How stopped work reads before its time, such as "Stopped after". */
  failedLabel?: string;
  /** The trace: shown while running, folded away once done. */
  children?: ReactNode;
  className?: string;
}>;

/**
 * One line of agent activity. While running it says what is happening with
 * a live clock and shows its trace; when done it settles into "Thought for
 * 4.2s" and folds the trace away, one click from reopening.
 */
export function ActivityLine({
  state,
  startedAt,
  finishedAt,
  label,
  doneLabel,
  failedLabel = "Stopped after",
  children,
  className,
}: ActivityLineProps) {
  const running = state === "running";
  const elapsed = useElapsed(startedAt, finishedAt, running);
  // Open while running; fold when it settles, unless the reader chose.
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [settledState, setSettledState] = useState(state);
  if (settledState !== state) {
    setSettledState(state);
    setChosen(null);
  }
  const open = chosen ?? running;
  const panel = useId();
  const summary = running
    ? `${label}…`
    : `${state === "done" ? doneLabel : failedLabel} ${formatElapsed(elapsed)}`;
  return (
    <div
      className={cn(
        "caps-disclosure caps-disclosure-row caps-activity-line",
        state === "failed" && "caps-disclosure-error",
        className,
      )}
      data-open={open ? "" : undefined}
      data-state={state}
    >
      <button
        type="button"
        className="caps-disclosure-trigger"
        aria-expanded={open}
        aria-controls={children === undefined ? undefined : panel}
        onClick={() => {
          setChosen(!open);
        }}
      >
        <span className="caps-disclosure-leading caps-activity-line-leading">
          <Swap swapKey={state}>
            {running ? (
              <Loader decorative size="sm" variant="line" />
            ) : (
              <SettledMark outcome={state === "done" ? "check" : "cross"} />
            )}
          </Swap>
        </span>
        <span className="caps-disclosure-summary">
          <Swap swapKey={running ? "running" : "settled"}>{summary}</Swap>
        </span>
        {running ? (
          <span className="caps-disclosure-trailing" aria-hidden="true">
            {formatElapsed(elapsed)}
          </span>
        ) : null}
        {children === undefined ? null : (
          <ChevronRight
            aria-hidden="true"
            className="caps-disclosure-chevron"
            size={12}
          />
        )}
      </button>
      {children === undefined ? null : (
        <Collapse open={open} id={panel}>
          <div className="caps-disclosure-panel">{children}</div>
        </Collapse>
      )}
    </div>
  );
}
