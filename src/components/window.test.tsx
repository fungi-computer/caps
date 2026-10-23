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
  it("opens a bead's maintained tooltip from keyboard focus without inventing an action", () => {
    vi.useFakeTimers();
    try {
      const view = render(
        <WindowHeader
          title="Trellis"
          status={[{ id: "saved", label: "Saved", presentation: "bead" }]}
        />,
      );
      const bead = requireValue(
        view.container.querySelector<HTMLSpanElement>(".caps-window-status"),
        "focusable Saved readout",
      );
      expect(bead.closest("button")).toBeNull();
      act(() => {
        bead.focus();
        vi.advanceTimersByTime(300);
      });
      const tooltip = requireValue(
        document.body.querySelector('[role="tooltip"]'),
        "Saved tooltip",
      );
      expect(tooltip.textContent).toBe("Saved");
      expect(bead.getAttribute("aria-describedby")).toBe(tooltip.id);
      expect(bead.hasAttribute("title")).toBe(false);
      act(() => {
        bead.blur();
        vi.runOnlyPendingTimers();
      });
      expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders bead-only status with an accessible label while retaining labeled statuses", () => {
    const states = [
      { id: "saved", label: "Saved", presentation: "bead" as const },
      {
        id: "valid",
        label: "Valid",
        tone: "success" as const,
        presentation: "bead" as const,
      },
      { id: "issue", label: "Not saved", tone: "error" as const },
    ];
    const view = render(<WindowHeader title="Trellis" status={states} />);
    const saved = requireValue(
      view.queryBySelector(".caps-window-status"),
      "Saved bead",
    );
    expect(saved.textContent).toBe("Saved");
    expect(saved.querySelector(".sr-only")?.textContent).toBe("Saved");
    expect(saved.querySelector("svg")).not.toBeNull();
    expect(
      view.container.querySelectorAll(".caps-window-status .sr-only")[1]
        ?.textContent,
    ).toBe("Valid");
    const issue = requireValue(
      view.queryBySelector('[title="Not saved"]'),
      "labeled error",
    );
    expect(issue.textContent).toBe("Not saved");
    expect(issue.querySelector(".sr-only")).toBeNull();
  });

  it("renders an icon-only command with its accessible label and preserves disabled admission", () => {
    const action = vi.fn();
    const commands = [
      {
        id: "run",
        label: "Run workflow",
        icon: "play" as const,
        variant: "ghost" as const,
      },
      {
        id: "blocked",
        label: "Run unavailable",
        icon: "play" as const,
        disabled: true,
      },
    ];
    const view = render(
      <WindowHeader title="Trellis" primary={commands} onAction={action} />,
    );
    const run = requireValue(
      view.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Run workflow"]',
      ),
      "accessible Run icon button",
    );
    expect(run.getAttribute("title")).toBe("Run workflow");
    expect(run.querySelector("svg")).not.toBeNull();
    expect(run.textContent).toBe("");
    act(() => {
      run.click();
    });
    expect(action).toHaveBeenCalledExactlyOnceWith("run");
    const blocked = requireValue(
      view.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Run unavailable"]',
      ),
      "disabled icon command",
    );
    expect(blocked.disabled).toBe(true);
    act(() => {
      blocked.click();
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

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

  it("shows a crumb trail in place of the title, with links and a drag spacer", () => {
    const crumb = vi.fn();
    const drag = vi.fn();
    const view = render(
      <WindowHeader
        title="Trellis"
        subtitle="ignored"
        crumbs={[
          { id: "app", label: "Trellis" },
          { id: "wf", label: "Storyboard test" },
          { id: "run", label: "Run 3" },
        ]}
        onCrumb={crumb}
        handleProps={{ onPointerDown: drag }}
      />,
    );
    const nav = requireValue(view.queryBySelector("nav"), "nav");
    expect(nav.textContent).toBe("Trellis›Storyboard test›Run 3");
    expect(view.container.textContent).not.toContain("ignored");
    const links = [...nav.querySelectorAll("button")];
    expect(links.map((link) => link.textContent)).toEqual([
      "Trellis",
      "Storyboard test",
    ]);
    act(() => links[1]?.click());
    expect(crumb).toHaveBeenCalledWith("wf");
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe(
      "Run 3",
    );
    const handle = requireValue(
      view.queryBySelector("[data-caps-window-handle]"),
      "handle",
    );
    expect(handle.getAttribute("aria-label")).toBe("Trellis · ignored");
    act(() => {
      handle.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(drag).toHaveBeenCalledOnce();
  });

  it("folds a long trail's middle and marks the phone-visible crumbs", () => {
    const view = render(
      <WindowHeader
        title="Bonsai"
        crumbs={["a", "b", "c", "d", "e"].map((id) => ({ id, label: id }))}
      />,
    );
    const positions = [
      ...view.container.querySelectorAll("[data-caps-crumb-position]"),
    ].map((item) => item.getAttribute("data-caps-crumb-position"));
    expect(positions).toEqual(["ancestor", "ancestor", "parent", "current"]);
    expect(
      view.container.querySelector('[aria-label="More of the path"]'),
    ).not.toBeNull();
  });

  it("reports the primary and menu commands the content declares", () => {
    const action = vi.fn();
    const view = render(
      <WindowHeader
        title="Trellis"
        primary={[
          { id: "run", label: "Run" },
          {
            id: "publish",
            label: "Publish",
            variant: "primary",
            disabled: true,
          },
        ]}
        menu={[{ id: "fork", label: "Fork" }]}
        onAction={action}
      />,
    );
    const buttons = [...view.container.querySelectorAll("button")];
    expect(
      buttons.map(
        (button) => button.textContent || button.getAttribute("aria-label"),
      ),
    ).toEqual(["Run", "Publish", "More"]);
    expect(buttons[1]?.disabled).toBe(true);
    act(() => buttons[0]?.click());
    expect(action).toHaveBeenCalledWith("run");
  });

  it("shows header state with the Caps status bead", () => {
    const view = render(
      <WindowHeader
        title="Trellis"
        status={[
          { id: "valid", label: "Valid", tone: "success" },
          { id: "saved", label: "Saved" },
        ]}
      />,
    );
    const group = requireValue(
      view.queryBySelector('[aria-label="State"]'),
      "state",
    );
    expect(group.textContent).toBe("ValidSaved");
    expect(group.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("keeps the title path when no crumbs are supplied", () => {
    const view = render(<WindowHeader title="Games" subtitle="Rank" />);
    expect(view.container.querySelector("nav")).toBeNull();
    expect(view.container.textContent).toContain("Rank");
  });
});
