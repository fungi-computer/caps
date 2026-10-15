import { describe, expect, it } from "vitest";
import { layoutMinimapLabels } from "./minimap-labels.js";

const metrics = {
  width: 200,
  height: 200,
  charWidth: 6,
  lineHeight: 12,
  padding: 2,
  dot: 10,
  gap: 2,
};
const place = (x: number, y: number, label: string, goal = false) => ({
  x,
  y,
  label,
  named: true,
  solid: true,
  goal,
});

describe("layoutMinimapLabels", () => {
  it("puts a lone name below its mark", () => {
    expect(layoutMinimapLabels([place(0.5, 0.5, "Harbour")], metrics)).toEqual([
      "below",
    ]);
  });

  it("moves a crowded name to a clear side, and never lets two overlap", () => {
    const sides = layoutMinimapLabels(
      [place(0.5, 0.5, "Harbour"), place(0.5, 0.58, "Lighthouse")],
      metrics,
    );
    // The lower mark's dot sits where the first name would go below: that
    // name moves above, and the second takes its own spot below.
    expect(sides).toEqual(["above", "below"]);
  });

  it("places goals first, and hides a name with no room rather than overlap it", () => {
    const cluster = [
      place(0.5, 0.5, "Old mill"),
      place(0.52, 0.5, "Well"),
      place(0.5, 0.52, "Barn"),
      place(0.48, 0.5, "Silo"),
      place(0.5, 0.48, "Gate"),
      place(0.51, 0.51, "Home", true),
    ];
    const sides = layoutMinimapLabels(cluster, metrics);
    expect(sides[5]).not.toBe("hidden");
    expect(sides).toContain("hidden");
  });

  it("keeps names inside the chart", () => {
    expect(
      layoutMinimapLabels([place(0.02, 0.98, "Far corner")], metrics),
    ).toEqual(["above-right"]);
  });

  it("lets moving marks pass under names, so a crowd never hides a landmark", () => {
    const foe = {
      x: 0.5,
      y: 0.56,
      label: "Foe",
      named: false,
      solid: false,
      goal: false,
    };
    expect(
      layoutMinimapLabels([place(0.5, 0.5, "Harbour"), foe], metrics)[0],
    ).toBe("below");
  });
});
