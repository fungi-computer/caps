import {
  forwardRef,
  useId,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

import { SectionHeading } from "./section-heading.js";
import { cn } from "../lib/cn.js";

/** Minimum width for a card column before the grid adds another column. */
export type CardGridMinWidth = "narrow" | "regular" | "wide";

type CardGridStyle = CSSProperties & {
  "--caps-card-grid-min-column": string;
};

const minWidthTokens = {
  narrow: "16rem",
  regular: "20rem",
  wide: "24rem",
} satisfies Record<CardGridMinWidth, string>;

/** A responsive grid that fits complete cards to the available content width. */
export const CardGrid = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    minColumnWidth?: CardGridMinWidth;
    shelf?: Readonly<{ title: string; description?: string }>;
  }
>(function CardGrid(
  { children, className, minColumnWidth = "regular", style, shelf, ...props },
  ref,
) {
  const titleId = useId();
  const gridStyle: CardGridStyle = {
    ...style,
    "--caps-card-grid-min-column": minWidthTokens[minColumnWidth],
  };
  const grid = (
    <div
      {...props}
      className={cn("caps-card-grid", className)}
      ref={ref}
      style={gridStyle}
    >
      {children}
    </div>
  );
  if (!shelf) return grid;
  return (
    <section className="flex flex-col gap-md" aria-labelledby={titleId}>
      <div className="flex flex-col gap-xs">
        <SectionHeading id={titleId}>{shelf.title}</SectionHeading>
        {shelf.description ? (
          <p className="text-sm text-base-content/70">{shelf.description}</p>
        ) : null}
      </div>
      {grid}
    </section>
  );
});
