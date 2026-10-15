import { describe, expect, it } from "vitest";
import { seedHash } from "./seed-hash.js";

describe("seedHash", () => {
  it("is stable for the same seed", () => {
    expect(seedHash("agent-1")).toBe(seedHash("agent-1"));
  });

  it("spreads short, similar seeds apart", () => {
    const seeds = ["gardener", "librarian", "maker", "scribe", "tender"];
    expect(new Set(seeds.map(seedHash)).size).toBe(seeds.length);
  });

  it("always returns an unsigned 32-bit integer", () => {
    for (const seed of ["", "a", "a very long identity string indeed"]) {
      const value = seedHash(seed);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffffff);
    }
  });
});
