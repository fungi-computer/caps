import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Monogram, monogramTone } from "./monogram.js";

describe("Monogram", () => {
  it("shows a decorative first letter with a stable tone for its seed", () => {
    const markup = renderToStaticMarkup(
      <Monogram name="  gardener" seed="agent-1" />,
    );
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('class="caps-monogram"');
    expect(markup).toContain(`data-tone="${monogramTone("agent-1")}"`);
    expect(markup).toContain(">G</span>");
  });

  it("spreads identities across tones and keeps each one stable", () => {
    const seeds = ["gardener", "librarian", "maker", "scribe", "tender"];
    expect(new Set(seeds.map(monogramTone)).size).toBeGreaterThan(1);
    expect(seeds.map(monogramTone)).toEqual(seeds.map(monogramTone));
  });

  it("keeps a whole grapheme for names beyond the Basic Multilingual Plane", () => {
    expect(renderToStaticMarkup(<Monogram name="𝒜gent" />)).toContain(
      ">𝒜</span>",
    );
  });

  it("marks larger App tiles without changing the default disc", () => {
    expect(renderToStaticMarkup(<Monogram name="Grove" />)).not.toMatch(
      /data-(subject|size)=/,
    );
    const markup = renderToStaticMarkup(
      <Monogram name="Grove" subject="app" size="xl" />,
    );
    expect(markup).toContain('data-subject="app"');
    expect(markup).toContain('data-size="xl"');
  });
});

it("draws a stable specimen for an App identity instead of its initial", () => {
  const render = (seed: string) =>
    renderToStaticMarkup(
      <Monogram name="Orchard" seed={seed} variant="specimen" subject="app" />,
    );
  expect(render("app-orchard")).toEqual(render("app-orchard"));
  expect(render("app-orchard")).not.toEqual(render("app-lantern"));
  expect(render("app-orchard")).toContain("<svg");
  expect(render("app-orchard")).not.toContain(">O</span>");
});
