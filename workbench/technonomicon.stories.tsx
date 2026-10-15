import { useEffect, useRef, type ReactNode } from "react";
import type { StoryDefault } from "@ladle/react";

import { Prose } from "../src/components/prose.js";
import {
  CartridgeLabel,
  Keycap,
  SpecimenLabel,
  StatusLed,
} from "../src/components/field-guide.js";
import { sketch } from "../src/enhance/sketch.js";
import {
  Callout,
  CardAlbum,
  CigaretteCard,
  Folio,
  GrowthBadge,
  IssueMasthead,
  MarginNote,
  Masthead,
  SectionBar,
  Plate,
  Spread,
} from "../src/components/technonomicon.js";

export default { title: "Editorial / Technonomicon" } satisfies StoryDefault;

const stats = [
  // Example measurements are marked as fixture data; live values come from the host.
  {
    key: "checks",
    label: "Checks passing",
    value: 12,
    unit: "tests",
    source: "fixture data",
    asOf: "2026-09-26",
  },
  {
    key: "first-seen",
    label: "First seen",
    value: null,
    source: "fixture data",
    asOf: "2026-09-26",
  },
  {
    key: "commits",
    label: "Commits",
    value: 4,
    source: "fixture data",
    asOf: "2026-09-26",
  },
];

const eightStats = Array.from({ length: 8 }, (_, index) => ({
  key: `field-${String(index + 1)}`,
  label: `Field measure ${String(index + 1)}`,
  value: index === 3 ? null : (index + 1) * 12,
  unit: "units",
  source: "fixture data",
  asOf: "2026-09-26",
}));

function FieldSketch() {
  return (
    <svg
      aria-label="Ink field sketch of a mushroom apparatus"
      className="h-full max-h-full w-full text-base-content"
      role="img"
      viewBox="0 0 180 180"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <path d="M34 78c4-27 24-43 56-43s52 16 56 43H34Z" />
      <path d="M47 78c8 11 19 17 43 17s35-6 43-17M60 81l9 13m11-13 4 14m13-14-2 14m14-14-8 13" />
      <path d="M73 96h34l8 55H65l8-55Zm-14 55h62M58 160h64" />
      <circle cx="55" cy="149" r="10" />
      <circle cx="125" cy="149" r="10" />
      <path d="M45 32l-8-9m19 2-4-13m85 20 9-9m-20 4 5-13" />
    </svg>
  );
}

function SetMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M4 12a8 7 0 0 1 16 0Z" />
      <path d="M10 12v6h4v-6M3 20h18" />
    </svg>
  );
}

function CardDemo({ initialFlipped = false }: { initialFlipped?: boolean }) {
  const card = {
    number: 7,
    seriesNumeral: "I",
    series: "Machines of the Burrow",
    title: "The Careful Mule",
    typeLine: "Machine of the Burrow",
    setMark: <SetMark />,
    image: <FieldSketch />,
    stats,
    note: "Carries a careful load through the burrow. Never rushes the narrow turn.",
  };
  return <CigaretteCard {...card} defaultFlipped={initialFlipped} />;
}

function EditorialTheme({
  theme,
  children,
}: {
  theme: string;
  children: ReactNode;
}) {
  return (
    <section
      data-theme={theme}
      className="grid min-h-screen content-start gap-lg bg-base-100 p-lg text-base-content"
    >
      <h2 className="font-mono text-sm">{theme}</h2>
      {children}
    </section>
  );
}

export function FieldGuideThemes({ theme }: { theme?: string } = {}) {
  return (
    <div className="grid gap-lg lg:grid-cols-2">
      <EditorialTheme theme={theme ?? "field-guide"}>
        <IssueMasthead
          publication="The Spore Print"
          number="I"
          date="Autumn 2026"
          title="The Work That Wakes Again"
          dek="Field notes from a growing collection of useful machines."
        />
        <Spread layout="columns">
          <Prose variant="dropcap">
            <p>
              Every careful instrument begins as a small observation. The field
              guide keeps its measures close to the work.
            </p>
          </Prose>
          <Callout kind="lesson" title="Field lesson">
            Keep each measure attached to its source.
          </Callout>
        </Spread>
        <GrowthBadge stage="mycelium" />
        <MarginNote>Recorded at the north bench.</MarginNote>
        <Plate
          label="Plate 01"
          caption="A specimen at rest"
          image={<FieldSketch />}
        />
        <CardDemo />
        <CardAlbum
          title="Series I checklist"
          slots={[
            {
              number: 7,
              card: {
                number: 7,
                seriesNumeral: "I",
                series: "Machines of the Burrow",
                title: "The Careful Mule",
                image: <FieldSketch />,
                stats,
                note: "A patient guide to narrow passages.",
              },
            },
            { number: 8 },
          ]}
        />
      </EditorialTheme>
      <EditorialTheme theme={theme ?? "field-guide-night"}>
        <IssueMasthead
          publication="The Spore Print"
          number="I"
          date="Autumn 2026"
          title="The Work That Wakes Again"
          dek="Field notes from a growing collection of useful machines."
        />
        <Spread layout="columns">
          <Prose variant="dropcap">
            <p>
              Every careful instrument begins as a small observation. The field
              guide keeps its measures close to the work.
            </p>
          </Prose>
          <Callout kind="warning" title="Field caution">
            An absent measurement remains absent.
          </Callout>
        </Spread>
        <GrowthBadge stage="fruiting" />
        <Plate
          label="Plate 01"
          caption="A specimen at rest"
          image={<FieldSketch />}
        />
        <CardDemo />
      </EditorialTheme>
    </div>
  );
}

export function CigaretteCardFrontBack() {
  const data = {
    number: 7,
    seriesNumeral: "I",
    series: "Machines of the Burrow",
    title: "The Careful Mule",
    typeLine: "Machine of the Burrow",
    setMark: <SetMark />,
    image: <FieldSketch />,
    stats,
    note: "Carries a careful load through the burrow. Never rushes the narrow turn.",
  };
  const themes = ["field-guide", "field-guide-night"];
  const labels = ["Front", "Back · 3 stats", "Back · 8 stats", "Full art"];
  return (
    <div className="grid gap-lg">
      {themes.map((theme) => (
        <section
          key={theme}
          data-theme={theme}
          className="grid gap-md bg-base-100 p-lg text-base-content"
        >
          <h2 className="font-mono text-sm">{theme}</h2>
          <div className="grid gap-lg md:grid-cols-4">
            {labels.map((label, index) => (
              <div key={label} className="grid justify-items-center gap-sm">
                <p>{label}</p>
                <CigaretteCard
                  {...data}
                  stats={index === 2 ? eightStats : stats}
                  finish={index === 3 ? "full-art" : "standard"}
                  defaultFlipped={index === 1 || index === 2}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function FieldGuideMaterials() {
  const themes = ["field-guide", "field-guide-night"];
  return (
    <div className="grid gap-lg md:grid-cols-2">
      {themes.map((theme) => (
        <section
          key={theme}
          data-theme={theme}
          className="grid content-start justify-items-start gap-md bg-base-100 p-lg text-base-content"
        >
          <h2 className="font-mono text-sm">{theme}</h2>
          <div className="flex flex-wrap items-center gap-md">
            <Keycap>J</Keycap>
            <Keycap>?</Keycap>
            <StatusLed active label="Online" />
            <StatusLed active={false} label="Standby" tone="spore" />
          </div>
          <CartridgeLabel
            title="VISHNU"
            subtitle="A living world engine"
            mark={<span>✿</span>}
          />
          <SpecimenLabel
            plate="Plate S01"
            detail="Cartridge with watershed cutaway"
            kind="Engine specimen"
            number="01"
            title={<h3>Vishnu engine</h3>}
            summary="A world where water flows, soil erodes and agents can play."
          />
        </section>
      ))}
    </div>
  );
}

/** The opt-in pencil layer: circle, underline and a leader back to a drawing. */
export function SketchAnnotations() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => (root.current ? sketch(root.current) : undefined), []);
  const themes = ["field-guide", "field-guide-night"];
  return (
    <div ref={root} className="grid gap-lg md:grid-cols-2">
      {themes.map((theme) => (
        <section
          key={theme}
          data-theme={theme}
          className="grid content-start gap-md bg-base-100 p-lg text-base-content"
        >
          <h2 className="font-mono text-sm">{theme}</h2>
          <div
            data-sketch-root
            data-sketch-item
            className="grid grid-cols-2 items-end gap-lg"
          >
            <div data-sketch-target className="aspect-square w-full">
              <FieldSketch />
            </div>
            <SpecimenLabel
              sketch
              className="[--caps-sketch-leader:on]"
              data-sketch-leader-x="0.5"
              data-sketch-leader-y="0.45"
              plate="Plate S01"
              detail="Apparatus at rest"
              kind="Engine specimen"
              number="01"
              title={<h3>Careful mule</h3>}
              summary="Circle, underline and leader are drawn after layout."
            />
          </div>
        </section>
      ))}
    </div>
  );
}

function PrintMark() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor">
      {Array.from({ length: 48 }, (_, index) => {
        const angle = (index / 48) * Math.PI * 2;
        const inner = index % 3 === 0 ? 8 : 22;
        return (
          <line
            key={index}
            x1={50 + Math.cos(angle) * inner}
            y1={50 + Math.sin(angle) * inner}
            x2={50 + Math.cos(angle) * 44}
            y2={50 + Math.sin(angle) * 44}
            strokeWidth={0.9}
          />
        );
      })}
    </svg>
  );
}

const sections = [
  { href: "#front", label: "Front Page", marker: "A", current: true },
  { href: "#entries", label: "Entries", marker: "B" },
  { href: "#specimens", label: "Specimens", marker: "C" },
  { href: "#issues", label: "Issues", marker: "D" },
];

function PrintPage({ size }: { size: "front" | "running" }) {
  return (
    <>
      <Masthead
        href="#front"
        wordmark="The Spore Print"
        mark={<PrintMark />}
        size={size}
        tagline="Notes from a very strange forest."
        edition={[
          "Saturday, September 26, 2026",
          "Issue I",
          "Shiitake, editor",
        ]}
        startEar={
          <>
            <p className="caps-meta">Forecast</p>
            <p>Damp under the canopy. Spores likely by evening.</p>
          </>
        }
        endEar={
          <figure className="caps-live-portrait">
            <span className="caps-live-portrait-stage">
              <FieldSketch />
            </span>
            <figcaption>Shiitake, editor</figcaption>
          </figure>
        }
        sections={
          <SectionBar
            aria-label="Sections of the paper"
            sections={sections}
            tools={
              <button type="button" aria-label="Switch theme">
                ◐
              </button>
            }
          />
        }
      />
      <div className="caps-edition">
        <article data-edition-slot="lead" className="caps-story-head">
          <p className="caps-meta">Entry 01 · Story world</p>
          <h2 className="caps-headline" data-size="banner">
            The white Pony
          </h2>
          <p className="caps-deck">
            A long headline and its deck, set in the display face.
          </p>
          <p className="caps-byline">
            <span>
              By <strong>Shiitake</strong>
            </span>
            <span>Planted September 25, 2026</span>
          </p>
          <a className="caps-jump" href="#entries">
            Continued on page B2 →
          </a>
        </article>
        <aside data-edition-slot="aside">
          <section className="caps-box">
            <p className="caps-meta">The latest Issue</p>
            <h3>The Work That Wakes Again</h3>
            <p className="caps-deck" data-size="small">
              Two notes on what a machine should remember.
            </p>
          </section>
        </aside>
        <section data-edition-slot="wide" className="grid gap-lg">
          <header className="caps-section-head">
            <p className="caps-meta">The garden</p>
            <h2>What’s growing</h2>
            <a href="#entries">All entries →</a>
          </header>
          <div className="caps-column-grid">
            <section>
              <h3 className="caps-column-head">Spore</h3>
              <article className="caps-brief">
                <h4 className="caps-headline" data-size="brief">
                  A brief in its column
                </h4>
                <p>Short notes flow down a ruled column.</p>
              </article>
            </section>
            <section>
              <h3 className="caps-column-head">Mycelium</h3>
              <article className="caps-brief">
                <h4 className="caps-headline" data-size="brief">
                  A second brief
                </h4>
                <p>Rules divide the columns on wide pages.</p>
              </article>
            </section>
            <section>
              <h3 className="caps-column-head">Fruiting</h3>
              <p className="caps-column-empty">Nothing has fruited yet.</p>
            </section>
          </div>
        </section>
      </div>
      <div className="caps-print-prose max-w-prose" data-dropcap>
        <p>
          The opening paragraph of a story drops its first letter three lines
          deep in the display face.
        </p>
        <blockquote>
          <p>A pull quote sits between double rules.</p>
        </blockquote>
      </div>
      <Folio
        items={["The Spore Print · Front Page", "Page A1", "September 26"]}
      />
    </>
  );
}

/** A newspaper page: nameplate, section bar, edition grid, columns, folio. */
export function PrintNewspaper() {
  return (
    <div className="grid gap-lg">
      <EditorialTheme theme="field-guide">
        <PrintPage size="front" />
      </EditorialTheme>
      <EditorialTheme theme="field-guide-night">
        <PrintPage size="running" />
      </EditorialTheme>
    </div>
  );
}
