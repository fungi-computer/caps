import { act } from "react";
import { afterEach, expect, test } from "vitest";

import { cleanup, render } from "../test-utils/index.js";
import { Prose } from "./prose.js";
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
  StagePlate,
} from "./technonomicon.js";

afterEach(cleanup);

const card = {
  number: 7,
  seriesNumeral: "II",
  series: "Machines of the Burrow",
  title: "The Careful Mule",
  image: <img src="/mule.png" alt="A field sketch of a mule" />,
  stats: [
    {
      key: "tests",
      label: "Checks passing",
      value: 12,
      unit: "tests",
      source: "CI",
      asOf: "2026-09-26",
    },
    {
      key: "missing",
      label: "World-hours",
      value: null,
      source: "benchmark fixture",
      asOf: "2026-09-26",
    },
  ],
  note: "Carries a careful load through the burrow. Never rushes the narrow turn.",
};

test("CigaretteCard keeps both faces in one native pressed button and flips on activation", () => {
  const view = render(<CigaretteCard {...card} />);
  const button = view.queryBySelector("button");
  expect(button?.getAttribute("aria-pressed")).toBe("false");
  expect(button?.hasAttribute("aria-label")).toBe(false);
  expect(button?.textContent).toContain("not measured");
  expect(button?.textContent).toContain("12");
  expect(button?.textContent).toContain("tests");
  expect(
    view.queryBySelector(".caps-cigarette-card-collector")?.textContent,
  ).toBe("No. 7 · Series II: Machines of the Burrow");
  expect(
    view
      .queryBySelector(".caps-cigarette-card-back")
      ?.getAttribute("aria-hidden"),
  ).toBe("true");
  expect(view.queryBySelector(".caps-cigarette-card-mark")?.textContent).toBe(
    "II",
  );
  expect(
    view.queryBySelector(".caps-cigarette-card-headline")?.textContent,
  ).toBe("Checks passing12tests");
  expect(
    view.queryBySelector(".caps-cigarette-card-stat")?.textContent,
  ).toContain("Checks passing");
  expect(button?.querySelector("table, div, p")).toBeNull();
  act(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  expect(button?.getAttribute("aria-pressed")).toBe("true");
  expect(button?.getAttribute("data-flipped")).toBe("true");
  expect(
    view
      .queryBySelector(".caps-cigarette-card-front")
      ?.getAttribute("aria-hidden"),
  ).toBe("true");
});

test("CigaretteCard lists eight measurements with units and dated provenance", () => {
  const stats = Array.from({ length: 8 }, (_, index) => ({
    key: `measure-${String(index)}`,
    label: `Measure ${String(index + 1)}`,
    value: index === 2 ? null : index * 1.25,
    unit: "kg",
    source: `Source ${String(index + 1)}`,
    asOf: "2026-09-26T08:43:51.862Z",
  }));
  const view = render(<CigaretteCard {...card} stats={stats} />);
  expect(
    view.container.querySelectorAll(".caps-cigarette-card-stat"),
  ).toHaveLength(8);
  expect(
    view.container.querySelectorAll(
      ".caps-cigarette-card-stat-value .caps-cigarette-card-not-measured",
    ),
  ).toHaveLength(1);
  expect(
    view.container.querySelectorAll(".caps-cigarette-card-stat-value")[1]
      ?.textContent,
  ).toBe("1.25kg");
  expect(
    view.queryBySelector(".caps-cigarette-card-sources")?.textContent,
  ).toContain("Source 8 · 2026-09-26");
});

test("CigaretteCard lists a shared source only once in its footer", () => {
  const stats = card.stats.map((stat) => ({
    ...stat,
    source: "shared field book",
  }));
  const view = render(<CigaretteCard {...card} stats={stats} />);
  expect(
    view.queryBySelector(".caps-cigarette-card-sources")?.textContent,
  ).toBe("shared field book · 2026-09-26");
});

test("CigaretteCard prints the type line, set mark and full-art finish", () => {
  const view = render(
    <CigaretteCard
      {...card}
      finish="full-art"
      typeLine="Machine of the Burrow"
      setMark={<svg data-testid="set" />}
    />,
  );
  const button = view.queryBySelector("button");
  expect(button?.getAttribute("data-finish")).toBe("full-art");
  expect(view.queryBySelector(".caps-cigarette-card-type")?.textContent).toBe(
    "Machine of the Burrow",
  );
  expect(
    view.container.querySelectorAll(".caps-cigarette-card-set svg"),
  ).toHaveLength(2);
});

test("CardAlbum counts collected cards and rules a slot for each missing number", () => {
  const view = render(
    <CardAlbum
      title="Series II"
      slots={[{ number: 1, card: { ...card, number: 1 } }, { number: 2 }]}
    />,
  );
  expect(view.queryBySelector(".caps-album-head p")?.textContent).toBe(
    "1 of 2 collected",
  );
  expect(
    view.queryBySelector('li[data-collected="false"] .caps-album-empty')
      ?.textContent,
  ).toBe("No. 2not yet collected");
});

test("plate and margin note preserve semantic figure and inline note elements", () => {
  const view = render(
    <>
      <Plate
        label="Plate 01"
        caption="Mule in profile"
        image={<span>Sketch</span>}
      />
      <MarginNote>Measure twice.</MarginNote>
    </>,
  );
  expect(view.queryBySelector("figure")).toBeTruthy();
  expect(view.queryByText("Measure twice.")?.tagName).toBe("SPAN");
});

test("stage plate keeps its live drawing first, then caption, hint and key", () => {
  const view = render(
    <StagePlate
      label="Specimen 01"
      caption="A cartridge and its rings"
      hint={<span>Drag to turn it</span>}
      specimenKey={<ol className="caps-stage-plate-key" />}
    >
      <div className="caps-stage-plate-viewport" tabIndex={0} />
    </StagePlate>,
  );
  const figure = view.queryBySelector("figure.caps-stage-plate");
  expect(figure?.firstElementChild?.className).toBe(
    "caps-stage-plate-viewport",
  );
  expect(view.queryBySelector(".caps-stage-plate-caption")?.textContent).toBe(
    "A cartridge and its rings",
  );
  expect(view.queryBySelector("p.caps-stage-plate-hint")?.textContent).toBe(
    "Drag to turn it",
  );
  expect(figure?.lastElementChild?.tagName).toBe("OL");
});

test("editorial pieces expose their labels, kinds, layouts, stages and empty album slots", () => {
  const view = render(
    <>
      <Callout kind="lesson" title="Field lesson">
        Keep the record clear.
      </Callout>
      <GrowthBadge stage="spore" />
      <IssueMasthead
        publication="The Spore Print"
        number="I"
        date="Autumn 2026"
        title="Issue title"
        dek="Issue summary."
      />
      <Spread layout="columns">
        <p>Left column</p>
        <p>Right column</p>
      </Spread>
      <CardAlbum title="Series I" slots={[{ number: 8 }]} />
      <Prose variant="dropcap">
        <p>First paragraph.</p>
      </Prose>
    </>,
  );
  expect(view.queryBySelector('[data-kind="lesson"] h2')?.textContent).toBe(
    "Field lesson",
  );
  expect(view.queryBySelector('[data-stage="spore"]')?.textContent).toBe(
    "spore",
  );
  expect(view.queryBySelector(".caps-issue-masthead h1")?.textContent).toBe(
    "Issue title",
  );
  expect(view.queryBySelector(".caps-issue-kicker")?.textContent).toBe(
    "The Spore Print · Issue I · Autumn 2026",
  );
  expect(view.queryBySelector('[data-layout="columns"]')).toBeTruthy();
  expect(view.queryBySelector(".caps-album-empty")?.textContent).toContain(
    "No. 8",
  );
  expect(view.queryBySelector(".caps-prose-dropcap")).toBeTruthy();
});

test("Masthead prints a linked nameplate, ears, an edition line and its section bar", () => {
  const view = render(
    <Masthead
      href="/"
      wordmark="The Spore Print"
      mark={<svg data-testid="mark" />}
      tagline="Notes from a very strange forest."
      edition={["Saturday, September 26, 2026", "Issue I"]}
      startEar={<p>Forecast</p>}
      endEar={<p>Editor</p>}
      size="running"
      sections={
        <SectionBar
          aria-label="Sections"
          sections={[
            { href: "/", label: "Front Page", marker: "A", shortcut: "G" },
            {
              href: "/journal/",
              label: "Entries",
              marker: "B",
              current: true,
            },
          ]}
          tools={<button type="button">Theme</button>}
        />
      }
    />,
  );
  const header = view.queryBySelector("header.caps-masthead");
  expect(header?.getAttribute("data-size")).toBe("running");
  const nameplate = view.queryBySelector("a.caps-masthead-nameplate");
  expect(nameplate?.getAttribute("href")).toBe("/");
  expect(nameplate?.textContent).toBe("The Spore Print");
  expect(
    view.queryBySelector(".caps-masthead-mark")?.getAttribute("aria-hidden"),
  ).toBe("true");
  expect(view.queryBySelector('[data-side="start"]')?.textContent).toBe(
    "Forecast",
  );
  expect(view.queryBySelector('[data-side="end"]')?.textContent).toBe("Editor");
  expect(view.queryBySelector(".caps-masthead-edition")?.children.length).toBe(
    2,
  );
  const current = view.queryBySelector('[aria-current="page"]');
  expect(current?.getAttribute("href")).toBe("/journal/");
  expect(
    view
      .queryBySelector('a[href="/"].caps-section-bar-link')
      ?.getAttribute("aria-keyshortcuts"),
  ).toBe("G");
  expect(
    view.queryBySelector("nav.caps-section-bar")?.getAttribute("aria-label"),
  ).toBe("Sections");
  expect(view.queryBySelector(".caps-section-bar-tools button")).toBeTruthy();
});

test("Masthead omits empty ears and edition lines, and Folio prints its items", () => {
  const view = render(
    <>
      <Masthead href="/" wordmark="Paper" />
      <Folio items={["Paper · Front Page", "Page A1"]} />
    </>,
  );
  expect(view.queryBySelector(".caps-masthead-ear")).toBeNull();
  expect(view.queryBySelector(".caps-masthead-edition")).toBeNull();
  expect(
    view.queryBySelector(".caps-masthead")?.getAttribute("data-size"),
  ).toBe("front");
  expect(view.queryBySelector("footer.caps-folio")?.textContent).toBe(
    "Paper · Front PagePage A1",
  );
});

test("a CigaretteCard with href is a preview link to its page, showing its face", () => {
  const view = render(
    <CardAlbum
      title="Series I"
      slots={[
        {
          number: 7,
          card: { ...card, href: "/cards/7/", style: { maxWidth: "12rem" } },
        },
      ]}
    />,
  );
  const link = view.queryBySelector("a.caps-cigarette-card");
  expect(link?.getAttribute("href")).toBe("/cards/7/");
  expect(link?.style.maxWidth).toBe("12rem");
  expect(view.queryBySelector("button")).toBeNull();
  expect(link?.hasAttribute("aria-pressed")).toBe(false);
  expect(view.queryBySelector(".caps-cigarette-card-back")).toBeNull();
  expect(
    view
      .queryBySelector(".caps-cigarette-card-front")
      ?.hasAttribute("aria-hidden"),
  ).toBe(false);
  expect(link?.textContent).toContain("The Careful Mule");
});
