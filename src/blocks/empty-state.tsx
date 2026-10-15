import {
  forwardRef,
  useEffect,
  useId,
  useState,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { Button } from "../components/button.js";
import { useMotion, motionTime, type Motion } from "../lib/motion.js";
import { cn } from "../lib/cn.js";

/**
 * How an absence presents itself. `plain` leaves layout to the host; `panel`
 * is a recessed, centered invitation; `speech` lets the visual (a mascot) say
 * the copy from a molded speech bubble; `hint` is a quiet centered footnote
 * under content, such as the next thing to try; `quiet` is a left-aligned
 * absence nested under a card or section heading, titled below that heading.
 */
export type EmptyStateVariant = "plain" | "panel" | "speech" | "hint" | "quiet";

/** The document heading level of an EmptyState title. */
export type EmptyStateHeadingLevel = 2 | 3 | 4;

const headingTags = { 2: "h2", 3: "h3", 4: "h4" } as const;

/** What a visual is told while the EmptyState is on screen. */
export type EmptyStateVisualState = Readonly<{
  /** True for a moment after a `speech` state mounts, unless motion is reduced. */
  speaking: boolean;
  /** True while the host says it is working on an answer; it outranks speaking. */
  thinking: boolean;
}>;

/** A suggested next step, shown as a chip the host acts on. */
export type EmptyStateSuggestion = Readonly<{
  /** The chip's text. */
  label: string;
  /** Called when the chip is chosen. */
  onSelect: () => void;
}>;

function useSpeaking(enabled: boolean, timing: Motion): boolean {
  const { reduced } = timing;
  const active = enabled && !reduced;
  const duration = motionTime(timing, 600);
  const [speaking, setSpeaking] = useState(active);
  useEffect(() => {
    setSpeaking(active);
    if (!active) return undefined;
    const timer = globalThis.setTimeout(() => {
      setSpeaking(false);
    }, duration);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [active, duration]);
  return speaking;
}

/** Props accepted by EmptyState. */
export type EmptyStateProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  actions?: ReactNode;
  description: ReactNode;
  /** Chips that offer a starting point, such as a prompt to try. */
  suggestions?: readonly EmptyStateSuggestion[];
  /** The host is working on something, such as creating what this state invites. */
  thinking?: boolean;
  title: ReactNode;
  /** Heading level for the title; use one below the heading it sits under. */
  headingLevel?: EmptyStateHeadingLevel;
  /** Static art. */
  visual?: ReactNode;
  /** Render a visual from the current speaking and thinking state. */
  renderVisual?: (state: EmptyStateVisualState) => ReactNode;
  variant?: EmptyStateVariant;
};

/** Product-neutral absence presentation; hosts supply copy, art, and actions. */
export const EmptyState = forwardRef<HTMLElement, EmptyStateProps>(
  function EmptyState(
    {
      actions,
      className,
      description,
      headingLevel = 2,
      suggestions,
      thinking = false,
      title,
      visual,
      renderVisual,
      variant = "plain",
      ...props
    },
    ref,
  ) {
    const titleId = useId();
    const heading = useRef<HTMLHeadingElement>(null);
    const timing = useMotion(heading);
    const speaking = useSpeaking(variant === "speech", timing) && !thinking;
    const Heading = headingTags[headingLevel];
    const art = renderVisual ? renderVisual({ speaking, thinking }) : visual;
    const copy = (
      <>
        <Heading
          ref={heading}
          className="empty-state-title"
          id={props["aria-labelledby"] ? undefined : titleId}
        >
          {title}
        </Heading>
        <p>{description}</p>
        {suggestions && suggestions.length > 0 ? (
          <ul aria-label="Try one of these" className="empty-state-suggestions">
            {suggestions.map((suggestion) => (
              <li key={suggestion.label}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={suggestion.onSelect}
                >
                  {suggestion.label}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {actions ? <div className="empty-state-actions">{actions}</div> : null}
      </>
    );
    return (
      <section
        {...props}
        aria-labelledby={props["aria-labelledby"] ?? titleId}
        className={cn(
          "empty-state",
          variant !== "plain" && `empty-state-${variant}`,
          className,
        )}
        ref={ref}
      >
        {art ? (
          <div aria-hidden="true" className="empty-state-visual">
            {art}
          </div>
        ) : null}
        {variant === "speech" ? (
          <div className="empty-state-bubble">{copy}</div>
        ) : (
          copy
        )}
      </section>
    );
  },
);
