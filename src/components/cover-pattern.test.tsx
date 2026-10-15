import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CoverPattern } from "./cover-pattern.js";

describe("CoverPattern", () => {
  it("draws the same garden for the same seed and another for another seed", () => {
    const draw = (seed: string) =>
      renderToStaticMarkup(<CoverPattern seed={seed} />);
    expect(draw("moss-golf")).toBe(draw("moss-golf"));
    expect(draw("moss-golf")).not.toBe(draw("bell-tower"));
  });

  it("is mushrooms and mycelium with no words, bubbles or fixed colors", () => {
    const markup = renderToStaticMarkup(<CoverPattern seed="moss-golf" />);
    expect(markup).not.toContain("<text");
    expect(markup).toContain("<path");
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}\b/iu);
    expect(markup).toContain("var(--color-");
  });

  it("is decorative unless it is named", () => {
    expect(renderToStaticMarkup(<CoverPattern seed="a" />)).toContain(
      'aria-hidden="true"',
    );
    const named = renderToStaticMarkup(
      <CoverPattern seed="a" label="Moss Golf cover" />,
    );
    expect(named).toContain('role="img"');
    expect(named).toContain('aria-label="Moss Golf cover"');
    expect(named).not.toContain("aria-hidden");
  });
});
