import { describe, expect, it } from "vitest";

import coverage from "./coverage.json";

// The workbench provider imports guide.ts, so a coverage item without an
// introduction throws at module load and blanks every Ladle story.
describe("Caps workbench guide", () => {
  it("introduces every component the coverage list names", async () => {
    const { catalog } = await import("./guide.js");
    const introduced = new Set(catalog.map((item) => item.name));
    expect(
      coverage.items
        .map((item) => item.name)
        .filter((name) => !introduced.has(name)),
    ).toEqual([]);
    expect(catalog).toHaveLength(coverage.items.length);
  });
});
