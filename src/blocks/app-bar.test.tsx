import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import { AppBar } from "./app-bar.js";
import { OverlayRoot } from "../components/overlay-root.js";

afterEach(cleanup);

const button = (container: HTMLElement, label: string) =>
  requireValue(
    container.ownerDocument.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`,
    ),
    label,
  );
const groups = (container: HTMLElement) => ({
  running: requireValue(
    container.querySelector<HTMLElement>(".caps-app-bar-items"),
    "Running apps",
  ),
  available: requireValue(
    container.ownerDocument.querySelector<HTMLElement>(
      ".caps-app-bar-launchers",
    ),
    "Available apps",
  ),
});

describe("AppBar", () => {
  it("uses the shell popover root for both the dial and its primary action", () => {
    const layer = document.createElement("div");
    document.body.append(layer);
    const select = vi.fn();
    try {
      const { container } = render(
        <OverlayRoot
          containers={{
            popover: layer,
            dialog: null,
            toast: null,
            tooltip: null,
          }}
        >
          <AppBar
            windows={[]}
            launchers={[]}
            launcher={{ label: "Apps" }}
            primaryAction={{
              label: "New chat",
              icon: <svg />,
              onSelect: select,
            }}
          />
        </OverlayRoot>,
      );
      act(() => {
        button(container, "Apps").click();
      });
      expect(layer.querySelector(".caps-app-bar-launchers")).toBeTruthy();
      const action = requireValue(
        layer.querySelector<HTMLButtonElement>(".caps-app-bar-primary"),
        "portaled primary action",
      );
      expect(container.contains(action)).toBe(false);
      act(() => {
        action.click();
      });
      expect(select).toHaveBeenCalledOnce();
      expect(button(container, "Apps").getAttribute("aria-expanded")).toBe(
        "false",
      );
    } finally {
      layer.remove();
    }
  });
  it("keeps the dial in the caller's layer through focus and selection", () => {
    const layer = document.createElement("div");
    document.body.append(layer);
    const select = vi.fn();
    try {
      const { container } = render(
        <AppBar
          container={layer}
          windows={[]}
          launchers={[{ id: "files", label: "Files", onSelect: select }]}
          launcher={{ label: "Apps" }}
        />,
      );
      const launcher = button(container, "Apps");
      act(() => {
        launcher.click();
      });
      const files = button(container, "Files");
      expect(layer.contains(files)).toBe(true);
      expect(container.contains(files)).toBe(false);
      act(() => {
        files.focus();
      });
      expect(launcher.getAttribute("aria-expanded")).toBe("true");
      act(() => {
        files.click();
      });
      expect(select).toHaveBeenCalledOnce();
      expect(launcher.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(launcher);
    } finally {
      cleanup();
      layer.remove();
    }
  });

  it("keeps running icons focusable while available apps are collapsed", () => {
    const { container } = render(
      <AppBar
        windows={[
          { id: "editor", label: "Editor", active: true, onSelect: vi.fn() },
        ]}
        launchers={[{ id: "files", label: "Files", onSelect: vi.fn() }]}
        launcherLabels="wrap"
        launcher={{ label: "Apps" }}
      />,
    );
    expect(groups(container).running.getAttribute("aria-hidden")).not.toBe(
      "true",
    );
    expect(button(container, "Editor").tabIndex).toBe(0);
    expect(button(container, "Editor").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(button(container, "Editor").querySelector("svg")).toBeTruthy();
    expect(button(container, "Files").tabIndex).toBe(-1);
    expect(
      document.body.querySelector(
        '.caps-app-bar-item[data-launcher-labels="wrap"]',
      ),
    ).toBeTruthy();
    expect(button(container, "Files").hasAttribute("aria-pressed")).toBe(false);
    expect(groups(container).available.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(container.querySelectorAll('[aria-label="Editor"]')).toHaveLength(1);
  });

  it("opens and closes the compact app dial from the launcher", () => {
    const { container } = render(
      <AppBar
        windows={[]}
        launchers={[]}
        launcher={{ label: "Apps" }}
        primaryAction={{ label: "New chat", icon: <svg />, onSelect: vi.fn() }}
      />,
    );
    const launcher = button(container, "Apps");
    act(() => {
      launcher.click();
    });
    expect(launcher.getAttribute("aria-expanded")).toBe("true");
    expect(groups(container).available.getAttribute("aria-hidden")).toBe(
      "false",
    );
    act(() => {
      launcher.click();
    });
    expect(launcher.getAttribute("aria-expanded")).toBe("false");
    expect(groups(container).available.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("groups Team Apps and recent Sessions in the keyboard reachable dial", () => {
    const selectSession = vi.fn();
    const { container } = render(
      <AppBar
        windows={[]}
        launchers={[{ id: "grove", label: "Grove", onSelect: vi.fn() }]}
        sessions={[
          { id: "session-1", label: "Field notes", onSelect: selectSession },
        ]}
        launcher={{ label: "Open apps and sessions" }}
      />,
    );
    act(() => {
      button(container, "Open apps and sessions").click();
    });
    expect(
      document.body.querySelector('[aria-label="Team Apps"]'),
    ).toBeTruthy();
    expect(
      document.body.querySelector('[aria-label="Recent Sessions"]'),
    ).toBeTruthy();
    expect(button(container, "Grove").tabIndex).toBe(0);
    expect(button(container, "Field notes").tabIndex).toBe(0);
    act(() => {
      button(container, "Field notes").click();
    });
    expect(selectSession).toHaveBeenCalledOnce();
    expect(
      button(container, "Open apps and sessions").getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("reports launcher disclosure changes to a shell owner", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <AppBar
        windows={[]}
        launchers={[]}
        isOpen={false}
        onOpenChange={onOpenChange}
        launcher={{ label: "Apps" }}
      />,
    );
    act(() => {
      button(container, "Apps").click();
    });
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(button(container, "Apps").getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("Escape closes the dial and returns focus without hiding running apps", () => {
    const { container } = render(
      <AppBar
        windows={[{ id: "editor", label: "Editor", onSelect: vi.fn() }]}
        launchers={[{ id: "files", label: "Files", onSelect: vi.fn() }]}
        launcher={{ label: "Apps" }}
      />,
    );
    const launcher = button(container, "Apps");
    act(() => {
      launcher.click();
      button(container, "Files").focus();
    });
    act(() => {
      fireKey(button(container, "Files"), { key: "Escape" });
    });
    expect(document.activeElement).toBe(launcher);
    expect(launcher.getAttribute("aria-expanded")).toBe("false");
    expect(button(container, "Editor").tabIndex).toBe(0);
    expect(button(container, "Files").tabIndex).toBe(-1);
  });

  it("delegates selection and lets the caller move focus into its app", () => {
    const destination = document.createElement("button");
    document.body.append(destination);
    try {
      const select = vi.fn(() => {
        destination.focus();
      });
      const { container } = render(
        <AppBar
          windows={[]}
          launchers={[{ id: "files", label: "Files", onSelect: select }]}
          launcher={{ label: "Apps" }}
        />,
      );
      act(() => {
        button(container, "Apps").click();
      });
      act(() => {
        button(container, "Files").click();
      });
      expect(select).toHaveBeenCalledOnce();
      expect(button(container, "Apps").getAttribute("aria-expanded")).toBe(
        "false",
      );
      expect(document.activeElement).toBe(destination);
    } finally {
      destination.remove();
    }
  });

  it("reveals the icon-and-label primary action only when expanded", () => {
    const create = vi.fn();
    const { container } = render(
      <AppBar
        windows={[]}
        launchers={[]}
        launcher={{ label: "Apps" }}
        primaryAction={{ label: "New chat", icon: <svg />, onSelect: create }}
      />,
    );
    const action = requireValue(
      container.ownerDocument.querySelector<HTMLButtonElement>(
        ".caps-app-bar-primary",
      ),
      "primary action",
    );
    expect(action.textContent).toBe("New chat");
    expect(action.querySelector("svg")).toBeTruthy();
    expect(action.tabIndex).toBe(-1);
    expect(action.getAttribute("aria-hidden")).toBe("true");
    act(() => {
      button(container, "Apps").click();
    });
    expect(action.tabIndex).toBe(0);
    expect(action.getAttribute("aria-hidden")).toBe("false");
    act(() => {
      action.click();
    });
    expect(create).toHaveBeenCalledOnce();
    expect(button(container, "Apps").getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("dismisses on outside pointer activation without stealing focus", () => {
    const { container } = render(
      <AppBar
        windows={[]}
        launchers={[]}
        launcher={{ label: "Apps" }}
        primaryAction={{ label: "New chat", icon: <svg />, onSelect: vi.fn() }}
      />,
    );
    act(() => {
      button(container, "Apps").click();
    });
    act(() => {
      document.body.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "mouse",
        }),
      );
      document.body.dispatchEvent(
        new MouseEvent("mousedown", { bubbles: true }),
      );
      document.body.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true, pointerType: "mouse" }),
      );
      document.body.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      document.body.click();
    });
    expect(button(container, "Apps").getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("delegates closing without removing caller-owned windows", () => {
    const close = vi.fn();
    const select = vi.fn();
    const { container } = render(
      <AppBar
        windows={[
          { id: "editor", label: "Editor", onSelect: select, onClose: close },
        ]}
        launchers={[]}
        launcher={{ label: "Apps" }}
      />,
    );
    act(() => {
      button(container, "Close Editor").click();
    });
    expect(close).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
    expect(button(container, "Editor")).toBeTruthy();
    expect(document.activeElement).toBe(button(container, "Apps"));
  });

  it("supports an always-expanded tray and an empty explanation", () => {
    const { container } = render(
      <AppBar
        alwaysExpanded
        emptyLabel="No Apps installed"
        windows={[]}
        launchers={[]}
        launcher={{ label: "Apps" }}
      />,
    );
    act(() => {
      button(container, "Apps").click();
    });
    expect(button(container, "Apps").getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(document.body.textContent).toContain("No Apps installed");
  });

  it("uses unique disclosure targets and a single copy of long lists", () => {
    const windows = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      label: `App ${String(index)}`,
      onSelect: vi.fn(),
    }));
    const { container } = render(
      <>
        <AppBar windows={windows} launchers={[]} launcher={{ label: "One" }} />
        <AppBar windows={[]} launchers={windows} launcher={{ label: "Two" }} />
      </>,
    );
    expect(document.body.querySelectorAll(".caps-app-bar-item")).toHaveLength(
      24,
    );
    const firstId = button(container, "One").getAttribute("aria-controls");
    const secondId = button(container, "Two").getAttribute("aria-controls");
    expect(firstId).not.toBe(secondId);
    expect(
      document.getElementById(firstId ?? "")?.getAttribute("aria-label"),
    ).toBe("Speed dial");
  });
});
