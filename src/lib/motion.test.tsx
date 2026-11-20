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

function mountProbe() {
  function Probe() {
    const ref = useRef<HTMLDivElement>(null);
    const motion = useMotion(ref);
    return (
      <div
        ref={ref}
        data-probe=""
        data-reduced={String(motion.reduced)}
        data-distance={motion.distance}
      />
    );
  }
  const outer = document.createElement("div");
  const host = document.createElement("div");
  outer.append(host);
  document.body.append(outer);
  const root = createRoot(host);
  act(() => {
    root.render(<Probe />);
  });
  const probe = host.querySelector<HTMLElement>("[data-probe]");
  if (!probe) throw new Error("missing probe");
  const unmount = () => {
    act(() => {
      root.unmount();
    });
  };
  return { outer, probe, unmount };
}

test("layout writes on observed elements skip the style read; token writes still apply", async () => {
  const { outer, probe, unmount } = mountProbe();
  const reads = vi.spyOn(window, "getComputedStyle");
  await act(async () => {
    document.body.style.overflow = "hidden";
    outer.style.height = "584px";
    outer.style.setProperty("--stipe-other", "1");
    probe.style.width = "10px";
    await Promise.resolve();
  });
  expect(reads).not.toHaveBeenCalled();
  await act(async () => {
    probe.style.setProperty("--stipe-motion-distance", "9px");
    await Promise.resolve();
  });
  expect(reads).toHaveBeenCalled();
  expect(probe.dataset.distance).toBe("9");
  await act(async () => {
    probe.style.removeProperty("--stipe-motion-distance");
    await Promise.resolve();
  });
  expect(probe.dataset.distance).toBe("4");
  unmount();
});

test("a theme change on an ancestor still re-reads the tokens", async () => {
  const { outer, unmount } = mountProbe();
  const reads = vi.spyOn(window, "getComputedStyle");
  await act(async () => {
    outer.setAttribute("data-theme", "dark");
    await Promise.resolve();
  });
  expect(reads).toHaveBeenCalled();
  unmount();
});

test("switching the reduced-motion preference updates live motion", () => {
  const listeners = new Set<() => void>();
  let reduced = false;
  vi.stubGlobal("matchMedia", (media: string) => ({
    media,
    get matches() {
      return reduced;
    },
    addEventListener: (_type: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.delete(listener);
    },
  }));
  try {
    const { probe, unmount } = mountProbe();
    expect(probe.dataset.reduced).toBe("false");
    expect(probe.dataset.distance).toBe("4");
    act(() => {
      reduced = true;
      for (const listener of listeners) listener();
    });
    expect(probe.dataset.reduced).toBe("true");
    expect(probe.dataset.distance).toBe("0");
    act(() => {
      reduced = false;
      for (const listener of listeners) listener();
    });
    expect(probe.dataset.reduced).toBe("false");
    unmount();
    expect(listeners.size).toBe(0);
  } finally {
    vi.unstubAllGlobals();
  }
});
