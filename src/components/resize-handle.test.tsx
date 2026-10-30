// @vitest-environment jsdom
import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ResizeHandle, type ResizeHandleProps } from "./resize-handle.js";

const mounted: { host: HTMLDivElement; root: Root }[] = [];

function renderHandle(props: ResizeHandleProps) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  mounted.push({ host, root });
  act(() => {
    root.render(<ResizeHandle {...props} />);
  });
  const handle = host.querySelector<HTMLElement>("[role=separator]");
  if (!handle) throw new Error("Resize separator did not render");
  return handle;
}

afterEach(() => {
  for (const { host, root } of mounted.splice(0)) {
    act(() => {
      root.unmount();
    });
    host.remove();
  }
});

it("exposes the divider range and changes the caller-owned size by keyboard", () => {
  const onValueChange = vi.fn();
  const handle = renderHandle({
    "aria-label": "Preview and terminal size",
    orientation: "horizontal",
    variant: "notch",
    value: 240,
    min: 140,
    max: 272,
    onValueChange,
  });
  expect(handle.getAttribute("aria-valuenow")).toBe("240");
  expect(handle.getAttribute("aria-orientation")).toBe("horizontal");
  act(() => {
    handle.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
  });
  expect(onValueChange).toHaveBeenLastCalledWith(272);
  act(() => {
    handle.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
  });
  expect(onValueChange).toHaveBeenLastCalledWith(140);
});

it("uses left and right arrows for a vertical separator", () => {
  const onValueChange = vi.fn();
  const handle = renderHandle({
    "aria-label": "Side pane size",
    orientation: "vertical",
    value: 200,
    min: 160,
    max: 260,
    onValueChange,
  });
  act(() => {
    handle.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
  });
  expect(onValueChange).toHaveBeenLastCalledWith(232);
  act(() => {
    handle.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
  });
  expect(onValueChange).toHaveBeenLastCalledWith(260);
});

it.each([
  { orientation: "horizontal", backward: "ArrowUp", unrelated: "ArrowLeft" },
  { orientation: "vertical", backward: "ArrowLeft", unrelated: "ArrowUp" },
] as const)(
  "clamps $orientation backward movement and ignores the other axis",
  ({ orientation, backward, unrelated }) => {
    const onValueChange = vi.fn();
    const handle = renderHandle({
      "aria-label": "Pane size",
      orientation,
      value: 180,
      min: 160,
      max: 260,
      onValueChange,
    });
    act(() => {
      handle.dispatchEvent(
        new KeyboardEvent("keydown", { key: backward, bubbles: true }),
      );
    });
    expect(onValueChange).toHaveBeenLastCalledWith(160);
    onValueChange.mockClear();
    act(() => {
      handle.dispatchEvent(
        new KeyboardEvent("keydown", { key: unrelated, bubbles: true }),
      );
    });
    expect(onValueChange).not.toHaveBeenCalled();
  },
);

it("preserves a caller's keyboard veto, explicit tab order and pointer handlers", () => {
  const onValueChange = vi.fn();
  const onPointerDown = vi.fn();
  const handle = renderHandle({
    "aria-label": "Pane size",
    "aria-controls": "preview",
    orientation: "vertical",
    value: 200,
    min: 160,
    max: 260,
    tabIndex: -1,
    onValueChange,
    onPointerDown,
    onKeyDown: (event) => {
      event.preventDefault();
    },
  });
  expect(handle.tabIndex).toBe(-1);
  expect(handle.getAttribute("aria-controls")).toBe("preview");
  act(() => {
    handle.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "End",
        bubbles: true,
        cancelable: true,
      }),
    );
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { pointerId: 3, bubbles: true }),
    );
  });
  expect(onValueChange).not.toHaveBeenCalled();
  expect(onPointerDown).toHaveBeenCalledOnce();
});

it("forwards its ref and exposes rounded caller-owned range values", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  mounted.push({ host, root });
  const ref = createRef<HTMLDivElement>();
  act(() => {
    root.render(
      <ResizeHandle
        ref={ref}
        aria-label="Fractional pane size"
        orientation="horizontal"
        value={200.4}
        min={160.2}
        max={260.8}
        onValueChange={vi.fn()}
      />,
    );
  });
  expect(ref.current).toBe(host.querySelector("[role=separator]"));
  expect(ref.current?.tabIndex).toBe(0);
  expect(ref.current?.getAttribute("aria-valuenow")).toBe("200");
  expect(ref.current?.getAttribute("aria-valuemin")).toBe("160");
  expect(ref.current?.getAttribute("aria-valuemax")).toBe("261");
});
