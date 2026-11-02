import { act } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import { HoldButton } from "./hold-button.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function trigger() {
  return requireValue(document.querySelector("button"), "hold button");
}

function pointer(type: "pointerdown" | "pointerup" | "pointerout") {
  trigger().dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
      relatedTarget: type === "pointerout" ? document.body : null,
    }),
  );
}

it("keeps a held key when the pointer leaves the button", () => {
  vi.useFakeTimers();
  const confirm = vi.fn();
  render(<HoldButton onConfirm={confirm}>Disconnect</HoldButton>);
  act(() => {
    fireKey(trigger(), { key: "Enter" });
    vi.advanceTimersByTime(400);
    pointer("pointerout");
    vi.advanceTimersByTime(500);
  });
  expect(confirm).toHaveBeenCalledOnce();
});

it("ends a pointer hold when that pointer leaves, not when a key is released", () => {
  vi.useFakeTimers();
  const confirm = vi.fn();
  render(<HoldButton onConfirm={confirm}>Disconnect</HoldButton>);
  act(() => {
    pointer("pointerdown");
    vi.advanceTimersByTime(400);
    fireKey(trigger(), { type: "keyup", key: "Enter" });
    vi.advanceTimersByTime(500);
  });
  expect(confirm).toHaveBeenCalledOnce();
  act(() => {
    pointer("pointerup");
    pointer("pointerdown");
    vi.advanceTimersByTime(400);
    pointer("pointerout");
    vi.advanceTimersByTime(900);
  });
  expect(confirm).toHaveBeenCalledOnce();
});
