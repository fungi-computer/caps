import { afterEach, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { CigaretteCard } from "../components/technonomicon.js";
import { SpecimenLabel } from "../components/field-guide.js";
import { enhanceCigaretteCards } from "./cigarette-card.js";
import { sketch } from "./sketch.js";

afterEach(() => {
  document.body.replaceChildren();
});

const card = (
  <CigaretteCard
    number={1}
    seriesNumeral="I"
    series="Machines of the Burrow"
    title="Mule"
    image={<span>Sketch</span>}
    stats={[
      {
        key: "commits",
        label: "Commits",
        value: 30,
        source: "git log",
        asOf: "2026-09-25",
      },
    ]}
    note="Carries the load."
  />
);

test("enhanceCigaretteCards flips server-rendered cards and cleans up", () => {
  document.body.innerHTML = renderToStaticMarkup(card);
  const button = document.querySelector("button");
  const cleanup = enhanceCigaretteCards(document);
  button?.click();
  expect(button?.getAttribute("aria-pressed")).toBe("true");
  expect(button?.dataset.flipped).toBe("true");
  expect(
    button
      ?.querySelector(".caps-cigarette-card-back")
      ?.getAttribute("aria-hidden"),
  ).toBe("false");
  button?.click();
  expect(button?.getAttribute("aria-pressed")).toBe("false");
  cleanup();
  button?.click();
  expect(button?.getAttribute("aria-pressed")).toBe("false");
});

test("enhanceCigaretteCards leaves clicks a hydrated card already handled", () => {
  document.body.innerHTML = renderToStaticMarkup(card);
  const button = document.querySelector("button");
  button?.addEventListener("click", (event) => {
    event.preventDefault();
  });
  const cleanup = enhanceCigaretteCards(document);
  button?.click();
  expect(button?.getAttribute("aria-pressed")).toBe("false");
  cleanup();
});

test("enhanceCigaretteCards leaves preview cards to their links", () => {
  document.body.innerHTML = renderToStaticMarkup(
    <CigaretteCard
      href="/cards/1/"
      number={1}
      seriesNumeral="I"
      series="Machines of the Burrow"
      title="Mule"
      image={<span>Sketch</span>}
      stats={[]}
      note="Carries the load."
    />,
  );
  const link = document.querySelector("a");
  link?.addEventListener("click", (event) => {
    event.preventDefault();
  });
  const cleanup = enhanceCigaretteCards(document);
  link?.click();
  expect(link?.dataset.flipped).toBe("false");
  expect(link?.hasAttribute("aria-pressed")).toBe(false);
  cleanup();
});

test("SpecimenLabel marks its plate and detail for the pencil layer on request", () => {
  document.body.innerHTML = renderToStaticMarkup(
    <SpecimenLabel
      sketch
      plate="Plate S01"
      detail="Cartridge"
      kind="Engine specimen"
      number="01"
      title={<h3>Vishnu</h3>}
    />,
  );
  expect(
    document
      .querySelector(".caps-specimen-label-plate")
      ?.getAttribute("data-sketch"),
  ).toBe("circle");
  expect(
    document
      .querySelector(".caps-specimen-label-detail")
      ?.getAttribute("data-sketch"),
  ).toBe("underline");
});

test("sketch skips hosts without layout and removes its overlay on cleanup", () => {
  document.body.innerHTML =
    '<div data-sketch-root><span data-sketch="circle">Plate</span></div>';
  const cleanup = sketch(document);
  // jsdom has no layout, so a zero-sized host draws nothing.
  expect(document.querySelector(".caps-sketch-overlay")).toBeNull();
  expect(document.querySelector("[data-sketch-drawn]")).toBeNull();
  cleanup();
});

function place(
  element: Element | null,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (!element) throw new Error("Missing fixture element");
  element.getBoundingClientRect = () => new DOMRect(x, y, width, height);
}

test("sketch draws marks and an enabled leader in currentColor", () => {
  document.body.innerHTML = `
    <ol data-sketch-root>
      <li data-sketch-item>
        <div data-sketch-target></div>
        <aside style="--caps-sketch-leader: on" data-sketch-leader-x="0.5" data-sketch-leader-y="0.5">
          <span data-sketch="circle">Plate S01</span>
          <span data-sketch="underline">Cartridge</span>
        </aside>
      </li>
    </ol>`;
  place(document.querySelector("[data-sketch-root]"), 0, 0, 800, 600);
  place(document.querySelector("[data-sketch-target]"), 0, 0, 300, 300);
  place(document.querySelector("aside"), 400, 400, 200, 100);
  place(document.querySelector('[data-sketch="circle"]'), 400, 400, 80, 20);
  place(document.querySelector('[data-sketch="underline"]'), 400, 430, 120, 20);
  const cleanup = sketch(document);
  const overlay = document.querySelector(".caps-sketch-overlay");
  expect(overlay?.getAttribute("aria-hidden")).toBe("true");
  expect(overlay?.children.length).toBe(3);
  expect(overlay?.querySelector("path")?.getAttribute("stroke")).toBe(
    "currentColor",
  );
  expect(document.querySelector("[data-sketch-drawn]")).not.toBeNull();
  cleanup();
  expect(document.querySelector(".caps-sketch-overlay")).toBeNull();
});
