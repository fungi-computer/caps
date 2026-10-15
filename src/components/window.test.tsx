// @vitest-environment jsdom
import { act, createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import {
  WindowFrame,
  WindowHeader,
  WindowActions,
  WindowBody,
} from "./window.js";

afterEach(cleanup);

describe("Window", () => {
  it("forwards the shell ref and native attributes without claiming modal behavior", () => {
    const ref = createRef<HTMLElement>();
    const view = render(
      <WindowFrame
        ref={ref}
        aria-label="Notes"
        active
        floating
        hidden
        className="host-position"
      >
        <WindowHeader title="Notes" />
        <WindowBody>Draft</WindowBody>
      </WindowFrame>,
    );
    expect(ref.current).toBe(view.queryBySelector("section"));
    expect(ref.current?.getAttribute("data-active")).toBe("true");
    expect(ref.current?.getAttribute("data-floating")).toBe("true");
    expect(ref.current?.hidden).toBe(true);
    expect(ref.current?.classList.contains("host-position")).toBe(true);
    expect(view.queryBySelector('[role="dialog"]')).toBeNull();
    expect(view.queryBySelector("button")).toBeNull();
  });

  it("only exposes commands supplied by the host, with window-specific names", () => {
    const close = vi.fn();
    const view = render(<WindowActions title="Notes" onClose={close} />);
    const buttons = view.container.querySelectorAll("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.getAttribute("aria-label")).toBe("Close Notes");
    act(() => buttons[0]?.click());
    expect(close).toHaveBeenCalledOnce();
  });

  it("marks content-sized panels and exposes a compact panel's selection command", () => {
    const select = vi.fn();
    const view = render(
      <WindowFrame fitContent>
        <WindowHeader
          title="Crew & orders"
          actions={<WindowActions title="Crew & orders" onSelect={select} />}
        />
        <WindowBody>Orders</WindowBody>
      </WindowFrame>,
    );
    expect(
      view.queryBySelector("section")?.getAttribute("data-fit-content"),
    ).toBe("true");
    const button = view.container.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("Show Crew & orders");
    act(() => button?.click());
    expect(select).toHaveBeenCalledOnce();
  });

  it("offers Back before the title only when the host supplies it, outside the drag handle", () => {
    const back = vi.fn();
    const drag = vi.fn();
    const view = render(
      <WindowHeader
        title="Games"
        subtitle="Leaderboard"
        density="compact"
        back={{
          label: "Back in Games",
          hint: "Back (Ctrl K, then [)",
          onBack: back,
        }}
        handleProps={{ onPointerDown: drag }}
      />,
    );
    const header = requireValue(view.queryBySelector("header"), "header");
    expect(header.getAttribute("data-density")).toBe("compact");
    const buttons = [...header.querySelectorAll("button")];
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Back in Games",
      null,
    ]);
    expect(buttons[0]?.getAttribute("title")).toBe("Back (Ctrl K, then [)");
    expect(buttons[1]?.getAttribute("title")).toBe("Games · Leaderboard");
    expect(buttons[1]?.textContent).toContain("Leaderboard");
    act(() => buttons[0]?.click());
    expect(back).toHaveBeenCalledOnce();
    expect(drag).not.toHaveBeenCalled();

    const plain = render(<WindowHeader title="Games" />);
    expect(plain.container.querySelector("button")).toBeNull();
    expect(plain.queryBySelector("header")?.getAttribute("data-density")).toBe(
      "regular",
    );
  });

  it("keeps action pointer events out of the host drag handle", () => {
    const drag = vi.fn();
    const zoom = vi.fn();
    const view = render(
      <WindowHeader
        title="Notes"
        handleProps={{ onPointerDown: drag, onDoubleClick: zoom }}
        actions={<WindowActions title="Notes" onClose={() => undefined} />}
      />,
    );
    const close = requireValue(
      view.queryBySelector('[aria-label="Close Notes"]'),
      "close",
    );
    const handle = requireValue(
      view.queryBySelector("[data-caps-window-handle]"),
      "handle",
    );
    act(() => {
      close.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(drag).not.toHaveBeenCalled();
    act(() => {
      handle.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(drag).toHaveBeenCalledOnce();
    act(() => {
      handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    });
    expect(zoom).toHaveBeenCalledOnce();
    expect(handle.getAttribute("type")).toBe("button");
  });

  it("reflects host-owned state changes without remounting the body", () => {
    const promote = vi.fn();
    const minimize = vi.fn();
    function Host() {
      const [floating, setFloating] = useState(false);
      const [maximized, setMaximized] = useState(false);
      return (
        <WindowFrame floating={floating}>
          <WindowHeader
            title="Notes"
            actions={
              <WindowActions
                title="Notes"
                floating={floating}
                maximized={maximized}
                onToggleFloating={() => {
                  setFloating(!floating);
                }}
                onToggleMaximize={() => {
                  setMaximized(!maximized);
                }}
                onPromote={promote}
                onMinimize={minimize}
              />
            }
          />
          <WindowBody>
            <input aria-label="Draft" defaultValue="Keep this" />
          </WindowBody>
        </WindowFrame>
      );
    }
    const view = render(<Host />);
    const input = view.queryBySelector("input");
    const press = (label: string) => {
      act(() => {
        requireValue(
          view.queryBySelector(`[aria-label="${label}"]`),
          label,
        ).click();
      });
    };
    press("Float Notes");
    expect(view.queryBySelector('[aria-label="Tile Notes"]')).not.toBeNull();
    press("Zoom Notes");
    expect(view.queryBySelector('[aria-label="Restore Notes"]')).not.toBeNull();
    expect(view.queryBySelector("input")).toBe(input);
    press("Make Notes main");
    press("Minimize Notes");
    expect(promote).toHaveBeenCalledOnce();
    expect(minimize).toHaveBeenCalledOnce();
  });
});
