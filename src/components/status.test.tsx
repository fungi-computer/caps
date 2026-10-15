import { act, createRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Status, type StatusGlyph } from "./status.js";

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Status", () => {
  it("uses the compact size for secondary row state", () => {
    const view = render(<Status size="compact" label="Errored" tone="error" />);
    expect(view.queryBySelector(".caps-status-compact")).not.toBeNull();
  });

  it("keeps the caller's label, ref, and semantics outside the decorative SVG", () => {
    const ref = createRef<HTMLSpanElement>();
    const view = render(
      <Status
        ref={ref}
        label={<strong>Connected</strong>}
        tone="success"
        className="host-status"
        aria-live="polite"
      />,
    );
    expect(ref.current).toBe(view.queryBySelector(".host-status"));
    expect(ref.current?.getAttribute("aria-live")).toBe("polite");
    expect(ref.current?.querySelector("strong")?.textContent).toBe("Connected");
    expect(ref.current?.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(ref.current?.querySelector("svg")?.classList).toContain(
      "text-success",
    );
  });

  it("renders its initial glyph and reuses the geometry across reduced-motion changes", () => {
    let change: ((glyph: StatusGlyph) => void) | undefined;
    function Harness() {
      const [glyph, setGlyph] = useState<StatusGlyph>("bang");
      change = setGlyph;
      return <Status glyph={glyph} motion="bounce" />;
    }
    const view = render(<Harness />);
    const body = requireValue(
      view.container.querySelector("rect"),
      "bead body",
    );
    const drop = requireValue(
      view.container.querySelector("circle"),
      "bead drop",
    );
    expect(body.getAttribute("height")).toBe("20");
    expect(drop.getAttribute("cy")).toBe("12");
    act(() => change?.("pill"));
    expect(body.getAttribute("height")).toBe("32");
    expect(drop.getAttribute("cy")).toBe("0");
    act(() => change?.("dot"));
    expect(body.getAttribute("height")).toBe("8");
    expect(view.container.querySelector("rect")).toBe(body);
    expect(view.container.querySelector("circle")).toBe(drop);
    expect(
      view.container.querySelector("svg > g")?.getAttribute("style"),
    ).toBeNull();
  });

  it("gives simultaneous beads independent filter and surface references", () => {
    const view = render(
      <>
        <Status tone="success" />
        <Status tone="error" glyph="bang" />
      </>,
    );
    const filters = [...view.container.querySelectorAll("filter")];
    expect(new Set(filters.map((filter) => filter.id)).size).toBe(
      filters.length,
    );
    for (const svg of view.container.querySelectorAll("svg")) {
      const filter = requireValue(svg.querySelector("filter"), "gooey filter");
      const surface = requireValue(
        svg.querySelector("radialGradient"),
        "bead surface",
      );
      expect(svg.querySelector("g[filter]")?.getAttribute("filter")).toBe(
        `url(#${filter.id})`,
      );
      expect(svg.querySelector("g[mask] > rect")?.getAttribute("fill")).toBe(
        `url(#${surface.id})`,
      );
    }
  });
});
