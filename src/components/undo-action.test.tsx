import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { HoldButton } from "./hold-button.js";
import { UndoAction } from "./undo-action.js";

// SAFETY: React reads this flag to enable act() outside a test renderer.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => {
    root.unmount();
  });
  host.remove();
  vi.useRealTimers();
});

function button() {
  const element = host.querySelector("button");
  if (!element) throw new Error("button missing");
  return element;
}

test("an undo action commits only after its window, and Escape undoes", () => {
  const commit = vi.fn();
  act(() => {
    root.render(
      <UndoAction
        armedAnnouncement="Port 80 closes in 5 seconds."
        undoneAnnouncement="Port 80 stays open."
        onCommit={commit}
        undoMs={5000}
      >
        Stop
      </UndoAction>,
    );
  });
  act(() => {
    button().click();
  });
  expect(button().textContent).toBe("Undo");
  expect(host.querySelector('[role="status"]')?.textContent).toBe(
    "Port 80 closes in 5 seconds.",
  );
  act(() => {
    button().dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  });
  act(() => {
    vi.advanceTimersByTime(6000);
  });
  expect(commit).not.toHaveBeenCalled();
  expect(button().textContent).toBe("Stop");
  act(() => {
    button().click();
  });
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(commit).toHaveBeenCalledOnce();
  expect(button().textContent).toBe("Stop");
});

test("a hold button needs a full hold; letting go early does nothing", () => {
  const confirm = vi.fn();
  act(() => {
    root.render(
      <HoldButton onConfirm={confirm} holdMs={900}>
        Stop
      </HoldButton>,
    );
  });
  act(() => {
    button().click();
  });
  const key = (type: string) => {
    act(() => {
      button().dispatchEvent(
        new KeyboardEvent(type, { key: " ", bubbles: true }),
      );
    });
  };
  key("keydown");
  act(() => {
    vi.advanceTimersByTime(500);
  });
  key("keyup");
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(confirm).not.toHaveBeenCalled();
  key("keydown");
  act(() => {
    vi.advanceTimersByTime(900);
  });
  expect(confirm).toHaveBeenCalledOnce();
  expect(button().getAttribute("aria-describedby")).not.toBeNull();
});

test("moving focus away cancels a keyboard hold and forwards blur", () => {
  const confirm = vi.fn();
  const blur = vi.fn();
  act(() => {
    root.render(
      <>
        <HoldButton onConfirm={confirm} onBlur={blur} holdMs={900}>
          Stop
        </HoldButton>
        <input aria-label="Next field" />
      </>,
    );
  });
  act(() => {
    button().focus();
  });
  act(() => {
    button().dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );
    vi.advanceTimersByTime(300);
    host.querySelector("input")?.focus();
    vi.advanceTimersByTime(1000);
  });
  expect(blur).toHaveBeenCalledOnce();
  expect(confirm).not.toHaveBeenCalled();
});

test("an armed action exposes Undo instead of its destructive accessible name", () => {
  act(() => {
    root.render(
      <>
        <span id="remove-label">Stop exposing port 5173</span>
        <UndoAction
          aria-label="Stop exposing port 5173"
          aria-labelledby="remove-label"
          onCommit={() => undefined}
          armedAnnouncement="Port closes in 5 seconds."
          undoneAnnouncement="Port stays open."
        >
          Remove exposure
        </UndoAction>
      </>,
    );
  });
  act(() => {
    button().click();
  });
  expect(button().textContent).toBe("Undo");
  expect(button().hasAttribute("aria-label")).toBe(false);
  expect(button().hasAttribute("aria-labelledby")).toBe(false);
  act(() => {
    button().click();
  });
  expect(button().getAttribute("aria-label")).toBe("Stop exposing port 5173");
  expect(button().getAttribute("aria-labelledby")).toBe("remove-label");
});
