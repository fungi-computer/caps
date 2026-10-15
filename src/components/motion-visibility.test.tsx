import { setTimeout as delay } from "node:timers/promises";
import gsap from "gsap";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, render } from "../test-utils/index.js";
import { Loader } from "./loader.js";
import { Status } from "./status.js";

const observers: VisibilityObserver[] = [];

class VisibilityObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];
  private target: Element | undefined;
  readonly disconnect = vi.fn();

  constructor(private readonly callback: IntersectionObserverCallback) {
    observers.push(this);
  }

  observe(target: Element) {
    this.target = target;
  }
  unobserve(target: Element) {
    if (this.target === target) this.target = undefined;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  intersect(isIntersecting: boolean) {
    const target = this.target;
    if (!target) throw new Error("Missing observed visual");
    const rect = target.getBoundingClientRect();
    this.callback(
      [
        {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          time: performance.now(),
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
        },
      ],
      this,
    );
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  observers.length = 0;
  vi.stubGlobal("IntersectionObserver", VisibilityObserver);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  gsap.ticker.sleep();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("decorative motion visibility", () => {
  it.each([
    ["status", <Status key="status" motion="bounce" />],
    ["loader", <Loader key="loader" variant="bloom" />],
  ])(
    "pauses %s loops outside the viewport and resumes the same phase",
    async (_, visual) => {
      const view = render(visual);
      const observer = observers[0];
      if (!observer) throw new Error("Missing visibility observer");
      const initial = view.container.innerHTML;
      await expect.poll(() => view.container.innerHTML).not.toBe(initial);

      act(() => {
        observer.intersect(false);
      });
      const paused = view.container.innerHTML;
      await delay(80);
      expect(view.container.innerHTML).toBe(paused);
      act(() => {
        observer.intersect(true);
      });
      expect(view.container.innerHTML).toBe(paused);
      await expect.poll(() => view.container.innerHTML).not.toBe(paused);

      cleanup();
      expect(observer.disconnect).toHaveBeenCalledOnce();
    },
  );

  it("does not resume an offscreen visual when the document becomes visible", async () => {
    const removed = vi.spyOn(document, "removeEventListener");
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const view = render(<Status motion="bounce" />);
    const observer = observers[0];
    if (!observer) throw new Error("Missing visibility observer");
    act(() => {
      observer.intersect(false);
    });
    const paused = view.container.innerHTML;
    hidden.mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event("visibilitychange"));
    await delay(80);
    expect(view.container.innerHTML).toBe(paused);
    act(() => {
      observer.intersect(true);
    });
    await expect.poll(() => view.container.innerHTML).not.toBe(paused);
    cleanup();
    expect(removed).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
  });

  it("returns active motion to a static visual when reduced motion changes", async () => {
    let reduced = false;
    const changes = new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({
      get matches() {
        return reduced;
      },
      addEventListener(_event: string, update: () => void) {
        changes.add(update);
      },
      removeEventListener(_event: string, update: () => void) {
        changes.delete(update);
      },
    }));
    const view = render(<Status motion="bounce" />);
    const initial = view.container.innerHTML;
    await expect.poll(() => view.container.innerHTML).not.toBe(initial);
    act(() => {
      reduced = true;
      for (const update of changes) update();
    });
    expect(observers[0]?.disconnect).toHaveBeenCalledOnce();
    const still = view.container.innerHTML;
    await delay(80);
    expect(view.container.innerHTML).toBe(still);
    act(() => {
      reduced = false;
      for (const update of changes) update();
    });
    await expect.poll(() => view.container.innerHTML).not.toBe(still);
    cleanup();
    expect(changes.size).toBe(0);
    expect(observers[1]?.disconnect).toHaveBeenCalledOnce();
  });
});
