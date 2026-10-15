import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Rough } from "./rough.js";
import { drawRough, parseRoughPoints, readRoughSpec } from "./rough-drawing.js";

function sized(element: HTMLElement, width: number, height: number) {
  Object.defineProperty(element, "offsetWidth", { value: width });
  Object.defineProperty(element, "offsetHeight", { value: height });
  return element;
}

function waitForRoughOverlay(element: HTMLElement): Promise<void> {
  if (element.dataset.roughDrawn === "") return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (element.dataset.roughDrawn !== "") return;
      observer.disconnect();
      resolve();
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-rough-drawn"],
    });
  });
}

describe("Rough", () => {
  it("writes the mark's settings as data attributes around its children", () => {
    const markup = renderToStaticMarkup(
      <Rough mark="circle" tone="primary" seed={4} animate>
        clanker
      </Rough>,
    );
    expect(markup).toBe(
      '<span class="caps-rough caps-rough-circle caps-rough-primary" data-caps-rough="circle" data-rough-seed="4" data-rough-animate="">clanker</span>',
    );
  });

  it("reads specs and ignores unknown shapes and malformed points", () => {
    const element = document.createElement("span");
    expect(readRoughSpec(element)).toBeNull();
    element.dataset.capsRough = "line";
    element.dataset.roughPoints = "0,100 bad 100,0";
    expect(readRoughSpec(element)).toMatchObject({
      mark: "line",
      seed: 7,
      fill: "none",
      points: [
        [0, 100],
        [100, 0],
      ],
    });
    expect(parseRoughPoints(undefined)).toEqual([]);
  });

  it("draws the same wobble for the same seed, as an aria-hidden overlay", async () => {
    const draw = async (seed: string) => {
      const element = sized(document.createElement("span"), 120, 40);
      element.dataset.capsRough = "box";
      element.dataset.roughSeed = seed;
      document.body.append(element);
      const overlayRendered = waitForRoughOverlay(element);
      const stopDrawing = drawRough(document.body);
      await overlayRendered;
      stopDrawing();
      expect(element.dataset.roughDrawn).toBe("");
      const svg = element.querySelector("svg");
      expect(svg?.getAttribute("aria-hidden")).toBe("true");
      const d = [...(svg?.querySelectorAll("path") ?? [])].map((path) =>
        path.getAttribute("d"),
      );
      element.remove();
      return d;
    };
    const first = await draw("3");
    expect(first.length).toBeGreaterThan(0);
    expect(await draw("3")).toEqual(first);
    expect(await draw("9")).not.toEqual(first);
  });
});
