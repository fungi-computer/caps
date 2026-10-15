import { act, createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import { ItemGrid, ItemSlot, type ItemGridCell } from "./item-grid.js";
import { Keycap, KeycapButton } from "./keycap.js";
import {
  PixelNumber,
  checkPixelText,
  formatPixelNumber,
} from "./pixel-number.js";
import { GameMeter } from "./progress.js";
import { WindowFrame } from "./window.js";

afterEach(cleanup);

describe("GameMeter", () => {
  it("keeps the resource label, current value and native progress together", () => {
    const view = render(
      <GameMeter label="Door" value={30} max={210} tone="info" />,
    );
    const meter = requireValue(
      view.queryBySelector("progress"),
      "resource progress",
    );
    expect(meter.getAttribute("aria-label")).toBe("Door");
    expect(meter.getAttribute("value")).toBe("30");
    expect(meter.getAttribute("max")).toBe("210");
    expect(view.queryByText("30 / 210")).not.toBeNull();
  });
});

describe("Keycap", () => {
  it("is a native kbd that keeps its ref, tone, size and pressed state", () => {
    const ref = createRef<HTMLElement>();
    const view = render(
      <Keycap ref={ref} tone="primary" size="lg" pressed className="host">
        B
      </Keycap>,
    );
    const key = requireValue(ref.current, "keycap");
    expect(key.tagName).toBe("KBD");
    expect(key.textContent).toBe("B");
    expect(key.dataset).toMatchObject({
      tone: "primary",
      size: "lg",
      pressed: "true",
    });
    expect(key.classList).toContain("host");
    expect(view.queryBySelector(".caps-keycap")).toBe(key);
  });
});

describe("KeycapButton", () => {
  it("names the action, labels its shortcut and stays a native button", () => {
    const onClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    render(
      <KeycapButton ref={ref} label="Build" shortcut="B" onClick={onClick} />,
    );
    const button = requireValue(ref.current, "button");
    expect(button.type).toBe("button");
    expect(button.getAttribute("aria-keyshortcuts")).toBe("B");
    expect(button.hasAttribute("aria-pressed")).toBe(false);
    expect(button.querySelector("kbd")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(button.querySelector(".caps-keycap-led")).toBeNull();
    act(() => {
      button.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("becomes a toggle with a lit indicator only when pressed is given", () => {
    const view = render(<KeycapButton label="Orders" pressed />);
    const button = requireValue(
      view.queryBySelector("button"),
      "toggle button",
    );
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(
      button.querySelector(".caps-keycap-led")?.getAttribute("data-lit"),
    ).toBe("true");
  });
});

describe("KeycapButton as a disclosure", () => {
  it("reports expanded instead of pressed and lights its lamp", () => {
    const view = render(<KeycapButton label="Build" shortcut="B" expanded />);
    const button = requireValue(view.queryBySelector("button"), "button");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.hasAttribute("aria-pressed")).toBe(false);
    expect(
      button.querySelector(".caps-keycap-led")?.getAttribute("data-lit"),
    ).toBe("true");
  });
});

describe("PixelNumber", () => {
  it("formats numbers with padding and an explicit sign", () => {
    expect(formatPixelNumber(7, 2)).toBe("07");
    expect(formatPixelNumber(3, 0, true)).toBe("+3");
    expect(formatPixelNumber(-12)).toBe("-12");
    expect(formatPixelNumber(0, 0, true)).toBe("0");
    expect(formatPixelNumber(2.5)).toBe("2.5");
    expect(() => formatPixelNumber(Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });

  it("refuses characters the face cannot draw and names the ones it can", () => {
    expect(checkPixelText("08:00")).toBe("08:00");
    expect(() => checkPixelText("HP")).toThrow(/cannot draw "H"/);
  });

  it("draws crisp integer-scaled pixels and keeps readable text", () => {
    const view = render(
      <PixelNumber value={8} size="lg" outline tone="error" />,
    );
    const svg = requireValue(view.queryBySelector("svg"), "svg");
    // "8" is 3×5; the outline adds a pixel on every side; lg is 4 px per pixel.
    expect(svg.getAttribute("width")).toBe("20");
    expect(svg.getAttribute("height")).toBe("28");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(view.queryBySelector(".sr-only")?.textContent).toBe("8");
    expect(
      view.container.querySelectorAll(".caps-pixel-number-outline rect").length,
    ).toBeGreaterThan(0);
    expect(
      view.queryBySelector(".caps-pixel-number")?.getAttribute("data-tone"),
    ).toBe("error");
  });

  it("draws readout text such as a clock", () => {
    const view = render(<PixelNumber text="08:00" />);
    expect(view.queryBySelector(".sr-only")?.textContent).toBe("08:00");
    // Four 3-wide digits, a 1-wide colon and four 1-pixel gaps.
    expect(view.queryBySelector("svg")?.getAttribute("viewBox")).toBe(
      "0 0 17 5",
    );
  });
});

describe("ItemGrid", () => {
  const items = [
    { id: "axe", label: "Axe", x: 0, y: 0, w: 1, h: 3 },
    { id: "bread", label: "Bread", x: 2, y: 1, quantity: 4, selected: true },
  ];

  it("exposes every cell with its occupant and footprint geometry", () => {
    const view = render(
      <ItemGrid label="Backpack" columns={4} rows={3} items={items} />,
    );
    const grid = requireValue(view.queryBySelector("[role=grid]"), "grid role");
    expect(grid.getAttribute("aria-label")).toBe("Backpack");
    expect(grid.getAttribute("aria-colcount")).toBe("4");
    expect(view.container.querySelectorAll("[role=gridcell]")).toHaveLength(12);
    expect(
      view.queryBySelector('[data-cell="0,2"]')?.getAttribute("aria-label"),
    ).toBe("Axe, column 1, row 3");
    const bread = requireValue(
      view.queryBySelector('[data-cell="2,1"]'),
      "bread cell",
    );
    expect(bread.getAttribute("aria-label")).toBe("Bread ×4, column 3, row 2");
    expect(bread.getAttribute("aria-selected")).toBe("true");
    const drawn = requireValue(view.queryBySelector(".caps-item"), "drawn axe");
    expect(drawn.style.gridColumn).toBe("1 / span 1");
    expect(drawn.style.gridRow).toBe("1 / span 3");
  });

  it("moves a roving cursor with the arrow keys and activates with Enter", () => {
    const activated: ItemGridCell[] = [];
    const view = render(
      <ItemGrid
        label="Pockets"
        columns={2}
        rows={2}
        items={items.slice(0, 0)}
        onCellActivate={(cell) => activated.push(cell)}
      />,
    );
    const first = requireValue(
      view.queryBySelector('[data-cell="0,0"]'),
      "first cell",
    );
    expect(first.tabIndex).toBe(0);
    act(() => {
      first.focus();
      fireKey(first, { key: "ArrowRight" });
    });
    const second = requireValue(
      view.queryBySelector('[data-cell="1,0"]'),
      "second cell",
    );
    expect(second.tabIndex).toBe(0);
    expect(first.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(second);
    act(() => {
      fireKey(second, { key: "ArrowRight" });
      fireKey(second, { key: "Enter" });
    });
    expect(activated).toEqual([{ x: 1, y: 0, item: null }]);
  });

  it("shows a refused drop and says why", () => {
    const view = render(
      <ItemGrid
        label="Backpack"
        columns={4}
        rows={3}
        items={items}
        ghost={{
          x: 0,
          y: 1,
          w: 2,
          h: 1,
          legal: false,
          reason: "Overlaps the axe",
        }}
      />,
    );
    expect(
      view.queryBySelector(".caps-item-ghost")?.getAttribute("data-legal"),
    ).toBe("false");
    const reason = requireValue(
      view.queryBySelector(".caps-item-grid-reason"),
      "reason",
    );
    expect(reason.textContent).toBe("Overlaps the axe");
    expect(
      view.queryBySelector("[role=grid]")?.getAttribute("aria-describedby"),
    ).toBe(reason.id);
    expect(
      view.queryBySelector('[data-cell="1,1"]')?.getAttribute("aria-label"),
    ).toBe("Empty, column 2, row 2, cannot drop: Overlaps the axe");
  });

  it("throws on items that do not fit rather than drawing them wrong", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => null);
    expect(() =>
      render(
        <ItemGrid
          label="Pockets"
          columns={2}
          rows={2}
          items={[{ id: "log", label: "Log", x: 1, y: 0, w: 2 }]}
        />,
      ),
    ).toThrow(/does not fit a 2×2 grid/);
    quiet.mockRestore();
  });
});

describe("ItemSlot", () => {
  it("names the slot and its item, and reports its drop state", () => {
    const view = render(
      <ItemSlot label="Head" item={{ label: "Straw hat" }} state="legal" />,
    );
    const slot = requireValue(view.queryBySelector("button"), "slot");
    expect(slot.getAttribute("aria-label")).toBe("Head: Straw hat");
    expect(slot.dataset).toMatchObject({ state: "legal", filled: "true" });
  });
});

describe("WindowFrame theme", () => {
  it("passes a nested theme to the frame without a material variant", () => {
    const view = render(
      <WindowFrame aria-label="Backpack" data-theme="paper" />,
    );
    const frame = view.queryBySelector(".caps-window");
    expect(frame?.getAttribute("data-theme")).toBe("paper");
    expect(frame?.hasAttribute("data-variant")).toBe(false);
  });
});
