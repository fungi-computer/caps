import { act, createRef } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render } from "../test-utils/index.js";
import { ScrollToBottomBlob } from "./scroll-to-bottom-blob.js";

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
  });
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
function setup() {
  const scroller = document.createElement("div");
  Object.defineProperties(scroller, {
    clientHeight: { value: 100 },
    scrollHeight: { value: 600 },
  });
  scroller.scrollTop = 500;
  document.body.append(scroller);
  const ref = { current: scroller };
  const focus = createRef<HTMLInputElement>();
  const onJump = () => {
    scroller.scrollTop = 500;
    scroller.dispatchEvent(new Event("scroll"));
  };
  const view = render(
    <>
      <input ref={focus} />
      <ScrollToBottomBlob
        scrollerRef={ref}
        onJump={onJump}
        focusAfterJump={focus}
      />
    </>,
  );
  const advance = (ms = 2000) => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };
  const scroll = (top: number) => {
    act(() => {
      scroller.scrollTop = top;
      scroller.dispatchEvent(new Event("scroll"));
    });
    advance();
  };
  advance();
  const root = view.container.querySelector<HTMLElement>("[data-motion-state]");
  const button = view.container.querySelector<HTMLButtonElement>("button");
  if (!root || !button) throw new Error("Missing drop");
  return { root, button, scroll, advance, focus, scroller };
}
test("persistent control owns hysteresis, exact rest, and jump focus", () => {
  const t = setup();
  expect(t.root.style.display).toBe("none");
  expect(t.button.tabIndex).toBe(-1);
  t.scroll(440);
  expect(t.root.dataset.motionState).toBe("resting");
  expect(
    t.root.querySelector<HTMLElement>("[data-drop-body]")?.style.transform,
  ).toBe("");
  t.scroll(480);
  expect(t.root.style.display).not.toBe("none");
  t.scroll(495);
  expect(t.root.dataset.motionState).toBe("hidden");
  t.scroll(400);
  act(() => {
    t.button.focus();
    t.button.click();
  });
  expect(document.activeElement).toBe(t.focus.current);
  t.advance();
  expect(t.root.dataset.motionState).toBe("hidden");
});
test("unmount cancels owned animation frames", () => {
  const t = setup();
  t.scroll(400);
  const cancel = vi.spyOn(globalThis, "cancelAnimationFrame");
  cleanup();
  expect(cancel).toHaveBeenCalled();
});

test("pauses when the document is hidden and resumes from current scroll geometry", () => {
  const t = setup();
  t.scroll(400);
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const paused = t.root.innerHTML;
  t.scroll(300);
  expect(t.root.innerHTML).toBe(paused);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  t.advance();
  expect(t.root.dataset.motionState).toBe("resting");
});
