import {
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { Badge } from "./badge.js";

/** Props accepted by Plate. */
export type PlateProps = {
  caption: ReactNode;
  image: ReactNode;
  label: string;
} & HTMLAttributes<HTMLElement>;

/** A labelled graphite illustration plate. */
export function Plate({
  caption,
  className,
  image,
  label,
  ...props
}: PlateProps) {
  return (
    <figure {...props} className={cn("caps-plate", className)}>
      <div className="caps-plate-image">{image}</div>
      <figcaption>
        <span>{label}</span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}

/** Props accepted by StagePlate. */
export type StagePlateProps = {
  caption: ReactNode;
  /** The live drawing: an element with the `caps-stage-plate-viewport` class. */
  children: ReactNode;
  /** How to handle the drawing, shown under the caption. */
  hint?: ReactNode;
  /** Id for the hint, so the drawing can name it with aria-describedby. */
  hintId?: string;
  label: string;
  /** A numbered key to what the drawing shows. */
  specimenKey?: ReactNode;
} & HTMLAttributes<HTMLElement>;

/**
 * A plate whose illustration is a live pixel-art stage rather than an image.
 * Its drawing reads `--specimen-ink`, `--specimen-paper` and
 * `--specimen-accent`, which follow the theme.
 */
export function StagePlate({
  caption,
  children,
  className,
  hint,
  hintId,
  label,
  specimenKey,
  ...props
}: StagePlateProps) {
  return (
    <figure {...props} className={cn("caps-stage-plate", className)}>
      {children}
      <figcaption>
        <span>{label}</span>
        <span className="caps-stage-plate-caption">{caption}</span>
      </figcaption>
      {hint ? (
        <p className="caps-stage-plate-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {specimenKey}
    </figure>
  );
}

/** Props accepted by CompactPlate. */
export type CompactPlateProps = Omit<PlateProps, "className">;

/** A compact plate for editorial teasers. */
export function CompactPlate(props: CompactPlateProps) {
  return <Plate {...props} className="caps-compact-plate" />;
}

/** Props accepted by MarginNote. */
export type MarginNoteProps = {
  children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

/** An inline note styled for the page margin. */
export function MarginNote({ children, className, ...props }: MarginNoteProps) {
  return (
    <span {...props} className={cn("caps-margin-note", className)}>
      {children}
    </span>
  );
}

/** Supported editorial callout kinds. */
export type CalloutKind = "lesson" | "status" | "plan" | "warning";
/** Props accepted by Callout. */
export type CalloutProps = {
  kind: CalloutKind;
  title?: ReactNode;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>;

/** A labelled editorial aside. */
export function Callout({
  children,
  className,
  kind,
  title,
  ...props
}: CalloutProps) {
  return (
    <aside
      {...props}
      className={cn("caps-callout", className)}
      data-kind={kind}
    >
      {title ? <h2>{title}</h2> : null}
      {children}
    </aside>
  );
}

/** Supported lifecycle stages. */
export type GrowthStage = "spore" | "mycelium" | "fruiting";
/** Props accepted by GrowthBadge. */
export type GrowthBadgeProps = {
  stage: GrowthStage;
} & HTMLAttributes<HTMLSpanElement>;

/** An outlined Badge in the selected growth-stage color. */
export function GrowthBadge({ className, stage, ...props }: GrowthBadgeProps) {
  const tone =
    stage === "spore"
      ? "secondary"
      : stage === "mycelium"
        ? "primary"
        : "accent";
  return (
    <Badge
      {...props}
      className={cn("caps-growth-badge badge-outline", className)}
      data-stage={stage}
      size="sm"
      tone={tone}
    >
      {stage}
    </Badge>
  );
}

/** Props accepted by IssueMasthead. */
export type IssueMastheadProps = {
  date: string;
  dek: ReactNode;
  number: string;
  /** The publication the Issue belongs to, printed in the kicker. */
  publication: string;
  title: string;
} & HTMLAttributes<HTMLElement>;

/** The title, number, date, and dek for an Issue. */
export function IssueMasthead({
  className,
  date,
  dek,
  number,
  publication,
  title,
  ...props
}: IssueMastheadProps) {
  return (
    <header {...props} className={cn("caps-issue-masthead", className)}>
      <p className="caps-issue-kicker">
        {publication} · Issue {number} · {date}
      </p>
      <h1>{title}</h1>
      <p>{dek}</p>
    </header>
  );
}

/** A newspaper nameplate: the front page's large head or a running head. */
export type MastheadSize = "front" | "running";
/** Props accepted by Masthead. */
export type MastheadProps = {
  /** The publication name, set large in the nameplate face. */
  wordmark: string;
  /** Where the nameplate links, normally the front page. */
  href: string;
  /** A small printed mark beside the wordmark, such as a logo drawing. */
  mark?: ReactNode;
  /** One line under the wordmark in the publication's voice. */
  tagline?: ReactNode;
  /** The ruled edition line: date, issue, editor and similar items. */
  edition?: readonly ReactNode[];
  /** The left ear box beside the nameplate, such as a weather note. */
  startEar?: ReactNode;
  /** The right ear box beside the nameplate, such as the editor's portrait. */
  endEar?: ReactNode;
  /** The section bar under the edition line, normally a SectionBar. */
  sections?: ReactNode;
  size?: MastheadSize;
} & HTMLAttributes<HTMLElement>;

/**
 * A print masthead. Ears flank the nameplate on wide pages and sit under it
 * on phones; the edition line runs between a thin and a heavy rule.
 */
export function Masthead({
  className,
  edition,
  endEar,
  href,
  mark,
  sections,
  size = "front",
  startEar,
  tagline,
  wordmark,
  ...props
}: MastheadProps) {
  return (
    <header
      {...props}
      className={cn("caps-masthead", className)}
      data-size={size}
    >
      <div className="caps-masthead-plate">
        {startEar ? (
          <div className="caps-masthead-ear" data-side="start">
            {startEar}
          </div>
        ) : null}
        <a className="caps-masthead-nameplate" href={href}>
          {mark ? (
            <span aria-hidden="true" className="caps-masthead-mark">
              {mark}
            </span>
          ) : null}
          <span className="caps-masthead-wordmark">{wordmark}</span>
        </a>
        {endEar ? (
          <div className="caps-masthead-ear" data-side="end">
            {endEar}
          </div>
        ) : null}
      </div>
      {tagline ? <p className="caps-masthead-tagline">{tagline}</p> : null}
      {edition && edition.length > 0 ? (
        <ul className="caps-masthead-edition">
          {edition.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : null}
      {sections}
    </header>
  );
}

/** One section of a publication. */
export type SectionLink = {
  href: string;
  label: string;
  /** Printed before the label, such as a section letter. */
  marker?: string;
  current?: boolean;
  /** A keyboard shortcut announced through aria-keyshortcuts. */
  shortcut?: string;
};
/** Props accepted by SectionBar. */
export type SectionBarProps = {
  sections: readonly SectionLink[];
  /** Controls set at the end of the bar, such as theme and help buttons. */
  tools?: ReactNode;
} & HTMLAttributes<HTMLElement>;

/**
 * A newspaper section bar: small capitals between hairline rules, the
 * current section printed in reverse. It scrolls sideways on narrow pages
 * instead of wrapping. Name it with aria-label.
 */
export function SectionBar({
  className,
  sections,
  tools,
  ...props
}: SectionBarProps) {
  return (
    <nav {...props} className={cn("caps-section-bar", className)}>
      <ul>
        {sections.map((section) => (
          <li key={section.href}>
            <a
              aria-current={section.current ? "page" : undefined}
              aria-keyshortcuts={section.shortcut}
              className="caps-section-bar-link"
              href={section.href}
            >
              {section.marker ? (
                <span aria-hidden="true" className="caps-section-bar-marker">
                  {section.marker}
                </span>
              ) : null}
              <span>{section.label}</span>
            </a>
          </li>
        ))}
      </ul>
      {tools ? <div className="caps-section-bar-tools">{tools}</div> : null}
    </nav>
  );
}

/** Props accepted by Folio. */
export type FolioProps = {
  /** Running items, such as the publication, page number and date. */
  items: readonly ReactNode[];
} & HTMLAttributes<HTMLElement>;

/** A running foot: the page's folio line between rules. */
export function Folio({ className, items, ...props }: FolioProps) {
  return (
    <footer {...props} className={cn("caps-folio", className)}>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </footer>
  );
}

/** Supported editorial spread arrangements. */
export type SpreadLayout = "lead" | "columns" | "grid";
/** Props accepted by Spread. */
export type SpreadProps = {
  layout: SpreadLayout;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>;

/** A responsive editorial region with an explicit layout. */
export function Spread({ children, className, layout, ...props }: SpreadProps) {
  return (
    <section
      {...props}
      className={cn("caps-spread", className)}
      data-layout={layout}
    >
      {children}
    </section>
  );
}

/** One supplied card measurement and its provenance. `null` means not measured. */
export type CardStat = {
  key: string;
  label: string;
  value: string | number | null;
  unit?: string;
  source: string;
  asOf: string;
};
/** Print finish: the rarer full-art card lets the drawing run under the text. */
export type CigaretteCardFinish = "standard" | "full-art";
/** Props accepted by CigaretteCard. */
export type CigaretteCardProps = {
  number: number;
  /** The series numeral printed on both faces and in the series mark, such as "I". */
  seriesNumeral: string;
  series: string;
  title: string;
  /** The type line beside the title, such as "Machine of the Burrow". */
  typeLine?: string | undefined;
  image: ReactNode;
  stats: readonly CardStat[];
  note: string;
  finish?: CigaretteCardFinish;
  /** A small set symbol printed in the collector line. */
  setMark?: ReactNode;
  defaultFlipped?: boolean;
  /**
   * Makes the card a preview: a link to the card's own page showing its
   * face, instead of a pressed button that turns over in place.
   */
  href?: string;
  /** "large" prints the card bigger, for its own page. */
  size?: "standard" | "large";
  className?: string;
  /** Inline style on the card, such as a shared view-transition name. */
  style?: CSSProperties;
};

/** Print an observation date as a calendar day when it carries a time. */
function calendarDay(asOf: string): string {
  return /^\d{4}-\d{2}-\d{2}T/.test(asOf) ? asOf.slice(0, 10) : asOf;
}

function groupCardSources(stats: readonly CardStat[]) {
  const grouped = new Map<string, Set<string>>();
  for (const { source, asOf } of stats) {
    const dates = grouped.get(source) ?? new Set<string>();
    dates.add(calendarDay(asOf));
    grouped.set(source, dates);
  }
  return Array.from(grouped, ([source, dates]) => ({
    source,
    asOf: Array.from(dates),
  }));
}

function StatFigure({ stat }: { stat: CardStat }) {
  if (stat.value === null)
    return (
      <span className="caps-cigarette-card-not-measured">not measured</span>
    );
  return (
    <>
      <span className="caps-cigarette-card-numeral">{String(stat.value)}</span>
      {stat.unit ? (
        <span className="caps-cigarette-card-unit">{stat.unit}</span>
      ) : null}
    </>
  );
}

function CardHead({
  seriesNumeral,
  title,
  typeLine,
}: Pick<CigaretteCardProps, "seriesNumeral" | "title" | "typeLine">) {
  return (
    <>
      <span className="caps-cigarette-card-head">
        <span className="caps-cigarette-card-title">{title}</span>
        {typeLine ? (
          <span className="caps-cigarette-card-type">{typeLine}</span>
        ) : null}
      </span>
      <span aria-hidden="true" className="caps-cigarette-card-mark">
        <span>{seriesNumeral}</span>
      </span>
    </>
  );
}

function CollectorLine({
  number,
  series,
  seriesNumeral,
  setMark,
}: Pick<
  CigaretteCardProps,
  "number" | "series" | "seriesNumeral" | "setMark"
>) {
  return (
    <span className="caps-cigarette-card-collector">
      <span>
        No. {number} · Series {seriesNumeral}: {series}
      </span>
      {setMark ? (
        <span aria-hidden="true" className="caps-cigarette-card-set">
          {setMark}
        </span>
      ) : null}
    </span>
  );
}

/**
 * A two-sided collector card: a framed front with an inset drawing, a stat
 * plate and a flavor line, and a ruled measurement ledger on the back. Both
 * faces live inside one native pressed button, so the reverse stays in the
 * DOM; the visible face names the button. Hydrated hosts flip through React
 * state. Static hosts load the Caps `enhance/cigarette-card` module, which
 * ignores clicks this component already handled. With `href` the card is a
 * preview instead: a link to the card's own page that shows only its face.
 */
export function CigaretteCard({
  className,
  defaultFlipped = false,
  finish = "standard",
  href,
  image,
  note,
  number,
  series,
  seriesNumeral,
  setMark,
  size = "standard",
  stats,
  style,
  title,
  typeLine,
}: CigaretteCardProps) {
  const [flipped, setFlipped] = useState(defaultFlipped);
  const sources = groupCardSources(stats);
  const headline = stats.find((stat) => stat.value !== null) ?? stats[0];
  const others = stats.filter((stat) => stat !== headline).slice(0, 2);
  const head = { seriesNumeral, title, typeLine };
  const collector = { number, series, seriesNumeral, setMark };
  const front = (
    <span
      className="caps-cigarette-card-face caps-cigarette-card-front"
      aria-hidden={href ? undefined : flipped}
    >
      <CardHead {...head} />
      <span className="caps-cigarette-card-window">{image}</span>
      {headline ? (
        <span className="caps-cigarette-card-plate">
          <span className="caps-cigarette-card-headline">
            <span className="caps-cigarette-card-label">{headline.label}</span>
            <span className="caps-cigarette-card-figure">
              <StatFigure stat={headline} />
            </span>
          </span>
          {others.length > 0 ? (
            <span className="caps-cigarette-card-plate-list">
              {others.map((stat) => (
                <span key={stat.key}>
                  <span className="caps-cigarette-card-label">
                    {stat.label}
                  </span>
                  <span>
                    <StatFigure stat={stat} />
                  </span>
                </span>
              ))}
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="caps-cigarette-card-flavor">{note}</span>
      <CollectorLine {...collector} />
    </span>
  );
  const back = (
    <span
      className="caps-cigarette-card-face caps-cigarette-card-back"
      aria-hidden={!flipped}
    >
      <CardHead {...head} />
      <span className="caps-cigarette-card-ledger">
        <span className="caps-cigarette-card-ledger-title">
          Field measurements
        </span>
        <span className="caps-cigarette-card-stats">
          {stats.map((stat) => (
            <span className="caps-cigarette-card-stat" key={stat.key}>
              <span className="caps-cigarette-card-stat-label">
                {stat.label}
              </span>
              <span aria-hidden="true" className="caps-cigarette-card-leader" />
              <span className="caps-cigarette-card-stat-value">
                <StatFigure stat={stat} />
              </span>
            </span>
          ))}
        </span>
        <span aria-hidden="true" className="caps-cigarette-card-cameo">
          {image}
        </span>
        <span className="caps-cigarette-card-note">{note}</span>
        <span className="caps-cigarette-card-sources">
          {sources.map(({ source, asOf }) => (
            <span className="caps-cigarette-card-source" key={source}>
              {source} · {asOf.join(", ")}
            </span>
          ))}
        </span>
      </span>
      <CollectorLine {...collector} />
    </span>
  );
  if (href)
    return (
      <a
        className={cn("caps-cigarette-card", className)}
        data-finish={finish}
        data-flipped={false}
        data-size={size}
        href={href}
        style={style}
      >
        <span className="caps-cigarette-card-inner">{front}</span>
      </a>
    );
  return (
    <button
      type="button"
      aria-pressed={flipped}
      className={cn("caps-cigarette-card", className)}
      onClick={(event) => {
        event.preventDefault();
        setFlipped((current) => !current);
      }}
      data-finish={finish}
      data-flipped={flipped}
      data-size={size}
      style={style}
    >
      <span className="caps-cigarette-card-inner">
        {front}
        {back}
      </span>
    </button>
  );
}

/** One numbered album position, optionally occupied by a card. */
export type AlbumSlot = { number: number; card?: CigaretteCardProps };
/** Props accepted by CardAlbum. */
export type CardAlbumProps = {
  title: string;
  slots: readonly AlbumSlot[];
} & HTMLAttributes<HTMLElement>;

/** A numbered checklist of supplied cards and ruled spaces for missing ones. */
export function CardAlbum({
  className,
  slots,
  title,
  ...props
}: CardAlbumProps) {
  const collected = slots.filter((slot) => slot.card !== undefined).length;
  return (
    <section {...props} className={cn("caps-album", className)}>
      <header className="caps-album-head">
        <h2>{title}</h2>
        <p>
          {collected} of {slots.length} collected
        </p>
      </header>
      <ol>
        {slots.map(({ card, number }) => (
          <li key={number} data-collected={card !== undefined}>
            {card ? (
              <CigaretteCard {...card} />
            ) : (
              <span className="caps-album-empty">
                <span>No. {number}</span>
                <span>not yet collected</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
