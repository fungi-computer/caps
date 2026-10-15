import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/*
 * Spec sheet: the printed-manual parts of a 1-bit page. Two tones, hard
 * edges, labels in mono, and a hatched band where a figure meets the paper.
 * Every part reads only theme tokens, so a host picks the ink and paper with
 * its theme and never restyles these parts.
 */

/** Props accepted by SpecRuler. */
export type SpecRulerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** A short section label, such as `01 · Plans`. */
  label: ReactNode;
};

/**
 * A tick-marked rule that separates sections, with crosshairs at both ends.
 * It is decorative: the section heading carries the accessible name.
 */
export const SpecRuler = forwardRef<HTMLDivElement, SpecRulerProps>(
  function SpecRuler({ className, label, ...props }, ref) {
    return (
      <div
        aria-hidden="true"
        {...props}
        className={cn("caps-spec-ruler", className)}
        ref={ref}
      >
        <span className="caps-spec-ruler-label">{label}</span>
      </div>
    );
  },
);

/** Props accepted by SpecFrame. */
export type SpecFrameProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** Caller-owned media, such as an `img` with its own alt text. */
  children: ReactNode;
  /** A short printed caption under the frame. */
  caption?: ReactNode;
  /** `inverse` seats dark media, such as a terminal readout, in the frame. */
  surface?: "default" | "inverse";
};

/** A figure seated in a hatched band, like a plate in a printed manual. */
export const SpecFrame = forwardRef<HTMLElement, SpecFrameProps>(
  function SpecFrame(
    { caption, children, className, surface = "default", ...props },
    ref,
  ) {
    return (
      <figure
        {...props}
        className={cn("caps-spec-frame", className)}
        data-surface={surface}
        ref={ref}
      >
        <div className="caps-spec-frame-window">{children}</div>
        {caption !== undefined ? (
          <figcaption className="caps-spec-frame-caption">{caption}</figcaption>
        ) : null}
      </figure>
    );
  },
);

/** One fact in a SpecFacts strip. */
export type SpecFact = {
  id: string;
  value: ReactNode;
  label: ReactNode;
};

/** Props accepted by SpecFacts. */
export type SpecFactsProps = Omit<
  HTMLAttributes<HTMLDListElement>,
  "children"
> & {
  facts: readonly SpecFact[];
};

/** A ruled strip of short facts: a big value over a small label. */
export const SpecFacts = forwardRef<HTMLDListElement, SpecFactsProps>(
  function SpecFacts({ className, facts, ...props }, ref) {
    return (
      <dl {...props} className={cn("caps-spec-facts", className)} ref={ref}>
        {facts.map((fact) => (
          <div className="caps-spec-fact" key={fact.id}>
            <dt className="caps-spec-fact-label">{fact.label}</dt>
            <dd className="caps-spec-fact-value">{fact.value}</dd>
          </div>
        ))}
      </dl>
    );
  },
);

/** One step in a SpecSteps list. */
export type SpecStep = {
  id: string;
  title: ReactNode;
  body: ReactNode;
};

/** Props accepted by SpecSteps. */
export type SpecStepsProps = Omit<
  HTMLAttributes<HTMLOListElement>,
  "children"
> & {
  steps: readonly SpecStep[];
};

/** A numbered row of steps in ruled cells, numbered 01, 02 and on. */
export const SpecSteps = forwardRef<HTMLOListElement, SpecStepsProps>(
  function SpecSteps({ className, steps, ...props }, ref) {
    return (
      <ol {...props} className={cn("caps-spec-steps", className)} ref={ref}>
        {steps.map((step, index) => (
          <li className="caps-spec-step" key={step.id}>
            <span aria-hidden="true" className="caps-spec-step-number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="caps-spec-step-title">{step.title}</h3>
            <div className="caps-spec-step-body">{step.body}</div>
          </li>
        ))}
      </ol>
    );
  },
);

/** One question in a SpecFaq list. */
export type SpecFaqItem = {
  id: string;
  question: ReactNode;
  /** Caller-reviewed answer content. */
  answer: ReactNode;
};

/** Props accepted by SpecFaq. */
export type SpecFaqProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  items: readonly SpecFaqItem[];
  /** Ids of the items that start open. */
  defaultOpen?: readonly string[];
};

/**
 * Questions and answers as native disclosures. It works without JavaScript,
 * and every answer stays in the document for search and find-in-page.
 */
export const SpecFaq = forwardRef<HTMLDivElement, SpecFaqProps>(
  function SpecFaq({ className, defaultOpen = [], items, ...props }, ref) {
    return (
      <div {...props} className={cn("caps-spec-faq", className)} ref={ref}>
        {items.map((item, index) => (
          <details
            className="caps-spec-faq-item"
            key={item.id}
            open={defaultOpen.includes(item.id) || undefined}
          >
            <summary className="caps-spec-faq-question">
              <span aria-hidden="true" className="caps-spec-faq-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="caps-spec-faq-text">{item.question}</span>
              <span aria-hidden="true" className="caps-spec-faq-mark" />
            </summary>
            <div className="caps-spec-faq-answer">{item.answer}</div>
          </details>
        ))}
      </div>
    );
  },
);

/** One labelled part of a SpecDiagram, placed in percent of the art. */
export type SpecDiagramMarker = {
  id: string;
  /** A short tag drawn on the art, such as `A`. */
  tag: string;
  /** Distance from the art's left edge, 0 to 100. */
  x: number;
  /** Distance from the art's top edge, 0 to 100. */
  y: number;
  label: ReactNode;
  note?: ReactNode;
};

/** Props accepted by SpecDiagram. */
export type SpecDiagramProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** Caller-owned art, such as an `img` with its own alt text. */
  art: ReactNode;
  markers: readonly SpecDiagramMarker[];
};

const percent = (value: number) =>
  `${String(Math.min(100, Math.max(0, value)))}%`;

/**
 * A manual-style parts diagram: tags drawn on the art and a legend that
 * names each part. The legend is the accessible text; tags are decorative.
 */
export const SpecDiagram = forwardRef<HTMLElement, SpecDiagramProps>(
  function SpecDiagram({ art, className, markers, ...props }, ref) {
    return (
      <figure
        {...props}
        className={cn("caps-spec-diagram", className)}
        ref={ref}
      >
        <div className="caps-spec-diagram-art">
          {art}
          {markers.map((marker) => (
            <span
              aria-hidden="true"
              className="caps-spec-diagram-tag"
              key={marker.id}
              style={{ left: percent(marker.x), top: percent(marker.y) }}
            >
              {marker.tag}
            </span>
          ))}
        </div>
        <figcaption className="caps-spec-diagram-legend">
          <ul>
            {markers.map((marker) => (
              <li key={marker.id}>
                <span aria-hidden="true" className="caps-spec-diagram-key">
                  {marker.tag}
                </span>
                <span className="caps-spec-diagram-label">{marker.label}</span>
                {marker.note !== undefined ? (
                  <span className="caps-spec-diagram-note">{marker.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </figcaption>
      </figure>
    );
  },
);

/** Props accepted by SpecPrintFilter. */
export type SpecPrintFilterProps = {
  /** Misregistration of the second ink, in CSS pixels. Defaults to 2, 1. */
  offset?: { x: number; y: number };
};

/**
 * The `#caps-print` SVG filter, rendered once per page. It turns 1-bit art
 * (dark ink on light paper) into the theme's ink on a transparent ground,
 * with a second ink printed slightly off register underneath, like a two-drum
 * risograph. Art opts in through the theme's `--caps-print-filter`; the inks
 * come from `--caps-print-ink` and `--caps-print-offset`.
 */
export function SpecPrintFilter({
  offset = { x: 2, y: 1 },
}: SpecPrintFilterProps) {
  return (
    <svg aria-hidden="true" className="caps-print-filter" focusable="false">
      <filter
        colorInterpolationFilters="sRGB"
        height="100%"
        id="caps-print"
        width="100%"
        x="0"
        y="0"
      >
        {/* Ink coverage: dark pixels opaque, paper transparent. */}
        <feColorMatrix
          in="SourceGraphic"
          result="darkness"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.2976 -1.0013 -0.1011 0 1.3"
        />
        {/* Only where the art itself is painted, never its empty edges. */}
        <feComposite
          in="darkness"
          in2="SourceAlpha"
          operator="in"
          result="coverage"
        />
        <feFlood className="caps-print-filter-offset" result="offsetInk" />
        <feComposite
          in="offsetInk"
          in2="coverage"
          operator="in"
          result="offsetPrint"
        />
        <feOffset
          dx={offset.x}
          dy={offset.y}
          in="offsetPrint"
          result="offsetShifted"
        />
        <feFlood className="caps-print-filter-ink" result="ink" />
        <feComposite in="ink" in2="coverage" operator="in" result="inkPrint" />
        <feMerge>
          <feMergeNode in="offsetShifted" />
          <feMergeNode in="inkPrint" />
        </feMerge>
      </filter>
    </svg>
  );
}
