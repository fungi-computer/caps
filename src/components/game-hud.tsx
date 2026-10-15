import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { layoutMinimapLabels } from "./minimap-labels.js";
import { Monogram } from "./monogram.js";

/**
 * Game HUD molecules: the paper plates, bars, chips, clock, portraits,
 * minimap, cards and rows a game shell composes into its screens. Values and
 * geometry come from the game; the look comes from the Stipe theme on the
 * enclosing element (field-guide paper, optionally tinted by ember or tide).
 */

/** Custom properties the stylesheet reads; numbers stay unitless. */
type StyleVariables = CSSProperties & Record<`--caps-${string}`, number>;

function withVariables(
  style: CSSProperties | undefined,
  variables: Record<`--caps-${string}`, number>,
): StyleVariables {
  return { ...style, ...variables };
}

/** A region of the game layer, laid over a full-bleed world. */
export type GameRegionName =
  "top-left" | "top-right" | "right" | "bottom" | "bottom-left" | "center";

/** Positions HUD regions over the world; the world stays interactive between them. */
export const GameLayer = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    /** The shell's container-based layout choice. */
    compact?: boolean;
  }
>(function GameLayer({ className, compact = false, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      data-compact={compact || undefined}
      className={cn("caps-game-layer", className)}
    />
  );
});

/** One named HUD region; only its children take pointer input. */
export const GameRegion = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { region: GameRegionName }
>(function GameRegion({ region, className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("caps-game-region", className)}
      data-region={region}
    />
  );
});

/** A dimmed stage for title, pause and end screens; it centres one card. */
export const GameScrim = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function GameScrim({ className, ...props }, ref) {
  return (
    <div {...props} ref={ref} className={cn("caps-game-scrim", className)} />
  );
});

/** A floating paper plate drawn in the sprites' ink line. */
export const HudPlate = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { density?: "compact" | "roomy" }
>(function HudPlate({ density = "compact", className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("caps-hud-plate", className)}
      data-density={density}
    />
  );
});

/** Semantic bar tones; the theme supplies each colour. */
export type HudTone = "success" | "warning" | "error" | "info";

/** A single short glyph (an emoji or a letter) shown before a label. */
function Glyph({ glyph }: { glyph?: ReactNode }) {
  return glyph ? (
    <span className="caps-hud-glyph" aria-hidden="true">
      {glyph}
    </span>
  ) : null;
}

/** A readable number in the theme's numeric font. */
export function HudNumber({
  value,
  size = "sm",
}: {
  value: string | number;
  size?: "sm" | "md";
}) {
  return (
    <span className="caps-hud-text-value caps-numeric" data-size={size}>
      {String(value)}
    </span>
  );
}

/** Props accepted by HudBar. */
export type HudBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  label: string;
  value: number;
  max: number;
  tone?: HudTone;
  glyph?: ReactNode;
};

/** A segmented resource bar: health, hunger, noise, hull. */
export const HudBar = forwardRef<HTMLDivElement, HudBarProps>(function HudBar(
  { label, value, max, tone = "info", glyph, className, style, ...props },
  ref,
) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div
      {...props}
      ref={ref}
      className={cn("caps-hud-bar", className)}
      data-tone={tone}
      data-low={share <= 0.25 ? "" : undefined}
      style={withVariables(style, { "--caps-hud-share": share })}
    >
      <Glyph glyph={glyph} />
      <span className="caps-hud-bar-label">{label}</span>
      <span className="caps-hud-bar-value">
        <HudNumber value={`${String(value)} / ${String(max)}`} />
      </span>
      <span
        className="caps-hud-bar-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <span className="caps-hud-bar-fill" />
      </span>
    </div>
  );
});

/** A counted thing on the HUD: bandages, crowns, round shot. */
export const HudChip = forwardRef<
  HTMLSpanElement,
  Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    label: string;
    value: string | number;
    glyph?: ReactNode;
  }
>(function HudChip({ label, value, glyph, className, ...props }, ref) {
  return (
    <span {...props} ref={ref} className={cn("caps-hud-chip", className)}>
      <Glyph glyph={glyph} />
      <span className="caps-hud-chip-label">{label}</span>{" "}
      <span className="caps-hud-chip-value">
        <HudNumber value={value} />
      </span>
    </span>
  );
});

/** The light of the day a clock shows. */
export type HudPhase = "day" | "dusk" | "night" | "dawn";

const PHASE_ICON = { day: Sun, dusk: Sunset, night: Moon, dawn: Sunrise };

/** The game clock: a phase mark, a label, an optional countdown and time. */
export const HudClock = forwardRef<
  HTMLDivElement,
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    label: string;
    detail?: string;
    time?: string;
    phase?: HudPhase;
  }
>(function HudClock(
  { label, detail, time, phase = "day", className, ...props },
  ref,
) {
  const Icon = PHASE_ICON[phase];
  return (
    <div
      {...props}
      ref={ref}
      className={cn("caps-hud-clock", className)}
      data-phase={phase}
    >
      <span className="caps-hud-clock-mark" aria-hidden="true">
        <Icon />
      </span>
      <span className="caps-hud-clock-text">
        <span className="caps-hud-clock-label">{label}</span>
        {detail ? (
          <span className="caps-hud-clock-detail">{detail}</span>
        ) : null}
      </span>
      {time ? (
        <span className="caps-hud-clock-time">
          <HudNumber value={time} size="md" />
        </span>
      ) : null}
    </div>
  );
});

/** How a portrait's subject is doing. */
export type PortraitMood = "ok" | "warn" | "bad";

/** A person in the portrait strip: their mark, name and what they are doing. */
export const Portrait = forwardRef<
  HTMLDivElement,
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    name: string;
    status: string;
    mood?: PortraitMood;
  }
>(function Portrait({ name, status, mood = "ok", className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("caps-portrait", className)}
      data-mood={mood}
    >
      <Monogram name={name} size="lg" className="caps-portrait-avatar" />
      <span className="caps-portrait-text">
        <span className="caps-portrait-name">{name}</span>
        <span className="caps-portrait-status">{status}</span>
      </span>
    </div>
  );
});

/** What a minimap mark stands for; the theme colours each kind. */
export type MinimapMarkKind = "self" | "ally" | "foe" | "place" | "goal";

/** One mark on the minimap, in whole grid cells. */
export type MinimapMark = Readonly<{
  x: number;
  y: number;
  kind: MinimapMarkKind;
  label: string;
}>;

/** Label metrics at the chart's name size (0.625rem, weight 800). */
const MINIMAP_LABEL = {
  charWidth: 6.2,
  lineHeight: 13,
  padding: 2,
  dot: 10,
  gap: 2,
} as const;
/** The chart's width before it is measured (15rem). */
const MINIMAP_WIDTH = 240;

/**
 * A small chart of the world: a paper grid with named marks. Names are laid
 * out so none overlap (layoutMinimapLabels); one with no room hides and
 * shows on hover or focus.
 */
export const MinimapPlate = forwardRef<
  HTMLElement,
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    label: string;
    columns: number;
    rows: number;
    marks: readonly MinimapMark[];
  }
>(function MinimapPlate(
  { label, columns, rows, marks, className, style, ...props },
  ref,
) {
  const field = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(MINIMAP_WIDTH);
  useLayoutEffect(() => {
    const element = field.current;
    if (!element) return;
    const measure = () => {
      if (element.clientWidth > 0) setWidth(element.clientWidth);
    };
    measure();
    // Test DOMs (jsdom) have no ResizeObserver; the first measure stands.
    if (!("ResizeObserver" in globalThis)) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  const sides = layoutMinimapLabels(
    marks.map((mark) => ({
      x: (mark.x + 0.5) / columns,
      y: (mark.y + 0.5) / rows,
      named: mark.kind === "place" || mark.kind === "goal",
      solid: mark.kind !== "foe" && mark.kind !== "ally",
      goal: mark.kind === "goal",
      label: mark.label,
    })),
    { ...MINIMAP_LABEL, width, height: (width * rows) / columns },
  );
  return (
    <figure
      {...props}
      ref={ref}
      className={cn("caps-minimap", className)}
      style={withVariables(style, {
        "--caps-minimap-columns": columns,
        "--caps-minimap-rows": rows,
      })}
    >
      <div
        ref={field}
        className="caps-minimap-field"
        role="img"
        aria-label={`${label}: ${marks.map((mark) => mark.label).join(", ")}`}
      >
        {marks.map((mark, index) => (
          <span
            key={`${mark.kind}:${mark.label}`}
            className="caps-minimap-mark"
            data-kind={mark.kind}
            data-label={
              mark.kind === "place" || mark.kind === "goal"
                ? sides[index]
                : undefined
            }
            title={mark.label}
            style={withVariables(undefined, {
              "--caps-minimap-x": (mark.x + 0.5) / columns,
              "--caps-minimap-y": (mark.y + 0.5) / rows,
            })}
          >
            {mark.kind === "place" || mark.kind === "goal" ? (
              <span className="caps-minimap-name" aria-hidden="true">
                {mark.label}
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <figcaption className="caps-minimap-caption">{label}</figcaption>
    </figure>
  );
});

/** What a game card is for; each kind sets its size and voice. */
export type GameCardKind = "goal" | "letter" | "dialogue" | "end" | "screen";

/** A paper card: goals, letters, dialogue, pause and end screens. */
export const GameCard = forwardRef<
  HTMLElement,
  Omit<HTMLAttributes<HTMLElement>, "title"> & {
    kind?: GameCardKind;
    kicker?: ReactNode;
    title?: ReactNode;
    footer?: ReactNode;
  }
>(function GameCard(
  { kind = "goal", kicker, title, footer, className, children, ...props },
  ref,
) {
  return (
    <article
      {...props}
      ref={ref}
      className={cn("caps-hud-card", className)}
      data-kind={kind}
    >
      {kicker || title ? (
        <header className="caps-hud-card-header">
          {kicker ? (
            <span className="caps-hud-card-kicker">{kicker}</span>
          ) : null}
          {title ? <h2 className="caps-hud-card-title">{title}</h2> : null}
        </header>
      ) : null}
      <div className="caps-hud-card-body">{children}</div>
      {footer ? (
        <footer className="caps-hud-card-footer">{footer}</footer>
      ) : null}
    </article>
  );
});

/** A ticked or open line on a goal card. */
export function GoalLine({
  done,
  children,
}: {
  done: boolean;
  children: ReactNode;
}) {
  return (
    <p className="caps-goal-line" data-done={done}>
      <span className="caps-goal-box" aria-hidden="true" />
      <span className="caps-goal-text">{children}</span>
      <span className="sr-only">{done ? " (done)" : " (to do)"}</span>
    </p>
  );
}

/** A row of keycaps: a dock across the bottom or a rail down the side. */
export const HudKeys = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical";
  }
>(function HudKeys({ orientation = "horizontal", className, ...props }, ref) {
  return (
    <div
      role="toolbar"
      aria-orientation={orientation}
      {...props}
      ref={ref}
      className={cn("caps-hud-keys", className)}
      data-orientation={orientation}
    />
  );
});

/** A shop or trade line: what, why, how much, and the act of buying it. */
export const OfferRow = forwardRef<
  HTMLDivElement,
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    label: string;
    detail?: string;
    price: string;
    action: ReactNode;
  }
>(function OfferRow(
  { label, detail, price, action, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cn("caps-offer-row", className)}>
      <span className="caps-offer-text">
        <span className="caps-offer-label">{label}</span>
        {detail ? <span className="caps-offer-detail">{detail}</span> : null}
      </span>
      <span className="caps-offer-price">{price}</span>
      <span className="caps-offer-action">{action}</span>
    </div>
  );
});

/** One ingredient or product of a recipe. */
export type RecipePart = Readonly<{
  label: string;
  glyph: string;
  have?: number | undefined;
  need?: number | undefined;
  quantity?: number | undefined;
}>;

function RecipeSlot({ part }: { part: RecipePart }) {
  const short =
    part.need !== undefined && part.have !== undefined && part.have < part.need;
  return (
    <span
      className="caps-recipe-slot"
      data-short={short ? "" : undefined}
      title={part.label}
    >
      <span className="caps-recipe-glyph" aria-hidden="true">
        {part.glyph}
      </span>
      <span className="caps-recipe-count">
        {part.need !== undefined
          ? `${String(part.have ?? 0)}/${String(part.need)}`
          : `×${String(part.quantity ?? 1)}`}
      </span>
      <span className="sr-only">{part.label}</span>
    </span>
  );
}

/** A workbench recipe: inputs (short ones marked) become the output. */
export const RecipeRow = forwardRef<
  HTMLDivElement,
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    label: string;
    inputs: readonly RecipePart[];
    output: RecipePart;
    action: ReactNode;
  }
>(function RecipeRow(
  { label, inputs, output, action, className, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} className={cn("caps-recipe-row", className)}>
      <span className="caps-recipe-label">{label}</span>
      <span className="caps-recipe-parts">
        {inputs.map((part) => (
          <RecipeSlot key={part.label} part={part} />
        ))}
        <span className="caps-recipe-arrow" aria-hidden="true">
          →
        </span>
        <RecipeSlot part={output} />
      </span>
      <span className="caps-recipe-action">{action}</span>
    </div>
  );
});

/** The quiet credit line on an end card. */
export function MadeWith({
  className,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children">) {
  return (
    <a {...props} className={cn("caps-made-with", className)}>
      Made with <strong>Fungi</strong> · make your own
    </a>
  );
}
