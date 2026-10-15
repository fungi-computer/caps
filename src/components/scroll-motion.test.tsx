import { describe, expect, it } from "vitest";
import { overscrollImpulse, scrollImpulse } from "./scroll-motion.js";

describe("scroll thumb motion", () => {
  it("compresses only outward pressure at a scrollable edge", () => {
    expect(overscrollImpulse(0, 100, -120)).toEqual({
      scaleY: 0.94,
      scaleX: 1.03,
      origin: "center top",
    });
    expect(overscrollImpulse(100, 100, 120)?.origin).toBe("center bottom");
    expect(overscrollImpulse(50, 100, 120)).toBeNull();
    expect(overscrollImpulse(0, 100, 120)).toBeNull();
    expect(overscrollImpulse(100, 100, -120)).toBeNull();
    expect(overscrollImpulse(0, 0, -120)).toBeNull();
    expect(overscrollImpulse(0, 100, -1)).toBeNull();
  });
  it("ignores gentle movements and steady speed", () => {
    expect(scrollImpulse(0, 0.2, 16)).toBeNull();
    expect(scrollImpulse(4, 4, 16)).toBeNull();
    expect(scrollImpulse(4, 4.1, 16)).toBeNull();
  });
  it("stretches slightly in the direction of acceleration", () => {
    expect(scrollImpulse(0, 4, 16)).toEqual({
      scaleY: 1.04,
      scaleX: 0.98,
      origin: "center top",
    });
    expect(scrollImpulse(0, -4, 16)?.origin).toBe("center bottom");
  });
  it("compresses on deceleration and stopping in either direction", () => {
    expect(scrollImpulse(4, 1, 16)?.scaleY).toBe(0.96);
    expect(scrollImpulse(-4, -1, 16)?.scaleY).toBe(0.96);
    expect(scrollImpulse(4, 0, 32)?.scaleY).toBeLessThan(1);
  });
});
