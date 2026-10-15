import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Eyebrow, SectionHeading } from "./section-heading.js";

describe("SectionHeading", () => {
  it("renders a heading that owns its case and tracking", () => {
    const markup = renderToStaticMarkup(
      <SectionHeading id="shelf">Fresh from the workshop</SectionHeading>,
    );
    expect(markup).toContain("<h2");
    expect(markup).toContain("caps-section-heading");
    expect(markup).not.toContain("uppercase");
  });
});

describe("Eyebrow", () => {
  it("is quiet by default and writes sentence case", () => {
    const markup = renderToStaticMarkup(<Eyebrow>Live worlds</Eyebrow>);
    expect(markup).toContain("Live worlds");
    expect(markup).toContain('class="caps-eyebrow"');
    expect(markup).toContain('data-tone="quiet"');
    expect(markup).not.toContain("uppercase");
  });

  it("carries a tone and a caller class", () => {
    const markup = renderToStaticMarkup(
      <Eyebrow tone="live" className="mb-xs">
        On air right now
      </Eyebrow>,
    );
    expect(markup).toContain('data-tone="live"');
    expect(markup).toContain("caps-eyebrow mb-xs");
  });
});
