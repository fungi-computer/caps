import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CardGrid } from "./card-grid.js";

describe("CardGrid", () => {
  it("provides responsive cards and a named minimum-width token", () => {
    const markup = renderToStaticMarkup(
      <CardGrid minColumnWidth="wide" aria-label="Plans">
        <article>Free</article>
        <article>Pro</article>
      </CardGrid>,
    );
    expect(markup).toContain('class="caps-card-grid"');
    expect(markup).toContain('aria-label="Plans"');
    expect(markup).toContain("--caps-card-grid-min-column:24rem");
  });

  it("can render a labelled shelf around its responsive cards", () => {
    const markup = renderToStaticMarkup(
      <CardGrid shelf={{ title: "Games", description: "Find a world" }}>
        <article>Mosslight</article>
      </CardGrid>,
    );
    expect(markup).toContain(
      '<section class="flex flex-col gap-md" aria-labelledby=',
    );
    expect(markup).toContain("Find a world");
    expect(markup).toContain('class="caps-card-grid"');
  });
});
