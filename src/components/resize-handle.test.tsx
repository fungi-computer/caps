// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ResizeHandle } from "./resize-handle.js";

it("exposes the divider range and changes the caller-owned size by keyboard", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const onValueChange = vi.fn();
  act(() => {
    root.render(
      <ResizeHandle
        aria-label="Preview and terminal size"
        orientation="horizontal"
        variant="notch"
        value={240}
        min={140}
        max={272}
        onValueChange={onValueChange}
      />,
    );
  });
  const handle = host.querySelector<HTMLElement>("[role=separator]");
  expect(handle?.getAttribute("aria-valuenow")).toBe("240");
  expect(handle?.getAttribute("aria-orientation")).toBe("horizontal");
  act(() => {
    handle?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
  });
  expect(onValueChange).toHaveBeenLastCalledWith(272);
  act(() => {
    handle?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
  });
  expect(onValueChange).toHaveBeenLastCalledWith(140);
  act(() => {
    root.unmount();
  });
  host.remove();
});

it("uses left and right arrows for a vertical separator", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const onValueChange = vi.fn();
  act(() => {
    root.render(
      <ResizeHandle
        aria-label="Side pane size"
        orientation="vertical"
        value={200}
        min={160}
        max={260}
        onValueChange={onValueChange}
      />,
    );
  });
  const handle = host.querySelector<HTMLElement>("[role=separator]");
  act(() => {
    handle?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
  });
  expect(onValueChange).toHaveBeenLastCalledWith(232);
  act(() => {
    handle?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
  });
  expect(onValueChange).toHaveBeenLastCalledWith(260);
  act(() => {
    root.unmount();
  });
  host.remove();
});
