import { act, useRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import { readMotion, useMotion } from "./motion.js";

// SAFETY: React's test environment flag enables act outside a test renderer.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

test("reads token overrides and CSS seconds, preserving deliberate zeroes", () => {
  const element = document.createElement("div");
  document.body.append(element);
  element.style.setProperty("--stipe-motion-bounce", "0");
  element.style.setProperty("--stipe-motion-spring-duration", "0.42s");
  element.style.setProperty("--stipe-motion-distance", "9px");
  expect(readMotion(element)).toMatchObject({
    bounce: 0,
    springDuration: 420,
    distance: 9,
    fast: 120,
  });
});

test("reduced motion keeps short fades and removes spatial motion", () => {
  const element = document.createElement("div");
  document.body.append(element);
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  try {
    expect(readMotion(element)).toMatchObject({
      reduced: true,
      fast: 120,
      slow: 120,
      bounce: 0,
      distance: 0,
      shake: 0,
      stretch: 0,
      stagger: 0,
      pressDepth: 0,
      pressScale: 1,
    });
  } finally {
    vi.unstubAllGlobals();
  }
});

test("live inline overrides update and the observer disconnects on unmount", async () => {
  function Probe() {
    const ref = useRef<HTMLDivElement>(null);
    const motion = useMotion(ref);
    return <div ref={ref} data-probe="" data-bounce={motion.bounce} />;
  }
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => {
    root.render(<Probe />);
  });
  const probe = host.querySelector<HTMLElement>("[data-probe]");
  if (!probe) throw new Error("missing probe");
  await act(async () => {
    probe.style.setProperty("--stipe-motion-bounce", "0.7");
    await Promise.resolve();
  });
  expect(probe.dataset.bounce).toBe("0.7");
  act(() => {
    root.unmount();
  });
});
