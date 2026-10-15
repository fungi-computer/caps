import { expect, test } from "vitest";
import {
  createDropState,
  distanceToBottom,
  stepDrop,
  unreadVolume,
  type DropState,
  type DropTokens,
} from "./scroll-to-bottom-blob-state.js";
const tokens: DropTokens = {
  springDuration: 320,
  bounce: 0.3,
  stretch: 0.28,
  fast: 120,
  reduced: false,
};
function settle(state: DropState, distance = 100, options = tokens) {
  for (let i = 0; i < 200; i++)
    state = stepDrop(state, { distance, delta: 0, unread: 0 }, 16, options);
  return state;
}
test("presence has an 8–48px hysteresis band and settles onto exact resting pixels", () => {
  let s = stepDrop(
    createDropState(),
    { distance: 48, delta: 0, unread: 0 },
    16,
    tokens,
  );
  expect(s.phase).toBe("hidden");
  s = settle(s);
  expect(s).toMatchObject({ phase: "resting", y: 0, vy: 0, volume: 1, vv: 0 });
  expect(settle(s, 20).shown).toBe(true);
  expect(settle(s, 7).phase).toBe("hidden");
});
test("scrolling up tugs down; stopping decays continuously", () => {
  let s = settle(createDropState());
  for (let i = 0; i < 15; i++)
    s = stepDrop(s, { distance: 300, delta: -18, unread: 0 }, 16, tokens);
  expect(s.y).toBeGreaterThan(1);
  const stopping = stepDrop(
    s,
    { distance: 300, delta: 0, unread: 0 },
    16,
    tokens,
  );
  expect(stopping.y).toBeGreaterThan(1);
  expect(settle(stopping).y).toBe(0);
});
test("zero bounce rises monotonically without overshooting", () => {
  let s = createDropState();
  let volume = 0;
  for (let i = 0; i < 100; i++) {
    s = stepDrop(s, { distance: 100, delta: 0, unread: 0 }, 16, {
      ...tokens,
      bounce: 0,
    });
    expect(s.volume).toBeGreaterThanOrEqual(volume);
    expect(s.volume).toBeLessThanOrEqual(1);
    volume = s.volume;
  }
});
test("jump ignores scroll input and unread while draining", () => {
  const start = settle(createDropState());
  const a = stepDrop(
    start,
    { distance: 100, delta: 0, unread: 0, jump: true },
    16,
    tokens,
  );
  expect(a.phase).toBe("merging");
  expect(
    stepDrop(a, { distance: 200, delta: -80, unread: 9 }, 16, tokens),
  ).toEqual(stepDrop(a, { distance: 0, delta: 0, unread: 0 }, 16, tokens));
  expect(settle(a, 0).phase).toBe("hidden");
});
test("unread volume is capped and reduced motion uses fades without movement", () => {
  expect(unreadVolume(1000)).toBe(1.15);
  const options = { ...tokens, reduced: true };
  const s = stepDrop(
    createDropState(),
    { distance: 100, delta: -99, unread: 3 },
    16,
    options,
  );
  expect(s).toMatchObject({ y: 0, vy: 0, velocity: 0, bead: 0 });
  expect(s.opacity).toBeGreaterThan(0);
  expect(s.opacity).toBeLessThan(1);
});
test("forward and column-reverse geometry both measure from the real end", () => {
  expect(
    distanceToBottom(
      { clientHeight: 100, scrollHeight: 500, scrollTop: 300 },
      "forward",
    ),
  ).toBe(100);
  expect(
    distanceToBottom(
      { clientHeight: 100, scrollHeight: 500, scrollTop: -100 },
      "reverse",
    ),
  ).toBe(100);
});
