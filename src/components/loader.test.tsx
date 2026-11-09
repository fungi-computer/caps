// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render } from "../test-utils/index.js";
import { Keycap } from "./keycap.js";
import { Loader } from "./loader.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Loader and Keycap additions", () => {
  it("marks idle pace and renders its still silhouette under reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    const view = render(<Loader decorative pace="idle" variant="wander" />);
    const loader = view.container.querySelector(".caps-loader");
    expect(loader?.getAttribute("data-pace")).toBe("idle");
    expect(loader?.querySelectorAll("ellipse").length).toBeGreaterThan(0);
  });

  it("defaults pace to working", () => {
    const view = render(<Loader decorative />);
    expect(
      view.container.querySelector(".caps-loader")?.getAttribute("data-pace"),
    ).toBe("working");
  });

  it("marks a Keycap as a hint caption", () => {
    const view = render(<Keycap size="hint">Esc</Keycap>);
    expect(view.container.querySelector("kbd")?.getAttribute("data-size")).toBe(
      "hint",
    );
  });

  it("marks a Keycap hidden on touch", () => {
    const view = render(<Keycap touch="hide">B</Keycap>);
    expect(
      view.container.querySelector("kbd")?.getAttribute("data-touch"),
    ).toBe("hide");
  });
});
