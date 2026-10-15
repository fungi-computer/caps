import assert from "node:assert/strict";
import { test } from "node:test";
import { motionViolations } from "./motion-token-guard.mjs";

test("rejects raw animation timings and direct Anime springs", () => {
  assert.equal(
    motionViolations(
      'import { spring as bounce } from "animejs"; animate(el, { opacity: 1, duration: 220 });',
      "control.tsx",
    ).length,
    2,
  );
  assert.equal(
    motionViolations(
      'import * as anime from "animejs"; anime.spring({bounce: 0.3});',
      "control.tsx",
    ).length,
    1,
  );
  assert.equal(
    motionViolations("animate(el, { delay: -40 });", "control.tsx").length,
    1,
  );
  assert.equal(
    motionViolations(
      "animate(el, { keyframes: [{ opacity: 1, delay: 40 }] });",
      "control.tsx",
    ).length,
    1,
  );
});

test("accepts token values, authored helper inputs and instant resets", () => {
  assert.deepEqual(
    motionViolations(
      "const timing = themedSpring(motion, { bounce: 0.3, duration: 320 }); animate(el, { ...timing, delay: motion.stagger }); animate(el, { duration: 0 });",
      "control.tsx",
    ),
    [],
  );
});

test("non-animation domain durations are outside this guard", () => {
  assert.deepEqual(
    motionViolations("const job = { duration: 300 };", "control.tsx"),
    [],
  );
});

test("CSS parser rejects times including fallbacks but ignores quoted text", () => {
  assert.equal(
    motionViolations(
      ".a { transition: opacity .2s; animation-delay: var(--delay, 90ms); }",
      "styles.css",
    ).length,
    2,
  );
  assert.deepEqual(
    motionViolations(
      '.a { transition: opacity var(--stipe-motion-fast); animation-delay: 0s; content: "120ms"; }',
      "styles.css",
    ),
    [],
  );
});
