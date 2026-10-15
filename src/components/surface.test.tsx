import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Display, Surface } from "./surface.js";

describe("Surface placement", () => {
  it("keeps standalone casing by default", () => {
    expect(renderToStaticMarkup(<Surface />)).toContain(
      'data-surface-placement="standalone"',
    );
  });
  it("passes embedded placement through Display without removing its inner layers", () => {
    const markup = renderToStaticMarkup(
      <Display placement="embedded">Readout</Display>,
    );
    expect(markup).toContain('data-surface-placement="embedded"');
    expect(markup).toContain("caps-display-gasket");
    expect(markup).toContain("caps-screen");
    expect(markup).toContain("Readout");
  });
  it("lets a compact Display fill a flex region with its semantic inset layers", () => {
    const markup = renderToStaticMarkup(
      <Display fit="fill" density="compact" placement="embedded">
        Terminal
      </Display>,
    );
    expect(markup).toContain("caps-display-gasket");
    expect(markup).toContain("caps-screen");
    expect(markup).toContain("min-h-0");
    expect(markup).toContain('data-display-density="compact"');
    expect(markup).toContain("Terminal");
  });
});
