import { expect, test } from "vitest";

import {
  motionBounce,
  motionDefaults,
  motionEasing,
  motionSpringTime,
  motionTime,
} from "./motion.js";
import { immediateTiming, themedSpring } from "./motion-spring.js";

test("authored timings are exact at the default feel", () => {
  expect(motionBounce(motionDefaults, 0.65)).toBeCloseTo(0.65);
  expect(motionSpringTime(motionDefaults, 440)).toBe(440);
  expect(motionTime(motionDefaults, 75)).toBe(75);
});

test("a theme's feel scales every control's own spring", () => {
  const calm = {
    ...motionDefaults,
    bounce: 0,
    springDuration: 480,
    normal: 270,
  };
  expect(motionBounce(calm, 0.65)).toBe(0);
  expect(motionSpringTime(calm, 320)).toBe(480);
  expect(motionTime(calm, 100)).toBe(150);
  const juicy = { ...motionDefaults, bounce: 0.6 };
  expect(motionBounce(juicy, 0.25)).toBeCloseTo(0.5);
  expect(motionBounce(juicy, 0.65)).toBe(0.9);
});

test("reduced motion lands springs at once", () => {
  const reduced = { ...motionDefaults, reduced: true };
  expect(motionTime(reduced, 200)).toBe(0);
  expect(themedSpring(reduced, { bounce: 0.4, duration: 320 })).toBe(
    immediateTiming,
  );
});

test("a stepped theme replaces curves with steps", () => {
  const stepped = { ...motionDefaults, steps: 4 };
  expect(motionEasing(stepped, "ease-out")).toBe("steps(4, end)");
  expect(motionEasing(motionDefaults, "ease-out")).toBe("ease-out");
  expect(themedSpring(stepped, { bounce: 0.3, duration: 320 }).duration).toBe(
    320,
  );
});
