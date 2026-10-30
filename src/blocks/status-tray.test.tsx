import { act, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import { KeycapButton } from "../components/keycap.js";
import {
  StatusTray,
  StatusTrayList,
  StatusTrayNote,
  StatusTrayRow,
} from "./status-tray.js";

afterEach(cleanup);

function Harness({
  disabled = false,
  nativeKeys = false,
}: {
  disabled?: boolean;
  nativeKeys?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <>
      <button type="button">Outside</button>
      <StatusTray
        openId={openId}
        onOpenChange={setOpenId}
        renderTrigger={
          nativeKeys
            ? ({ children, ...props }) => (
                <KeycapButton
                  {...props}
                  label={children}
                  expanded={props["aria-expanded"] === true}
                />
              )
            : undefined
        }
        items={[
          {
            id: "ports",
            label: "Ports",
            count: 3,
            content: (
              <StatusTrayRow
                primary=":5173"
                secondary="Exposed"
                actions={<button type="button">Open preview</button>}
              />
            ),
          },
          {
            id: "processes",
            label: "Processes",
            count: 0,
            disabled,
            content: <StatusTrayNote>No running processes.</StatusTrayNote>,
          },
        ]}
      />
    </>
  );
}

function button(container: HTMLElement, label: string) {
  return requireValue(
    [...container.querySelectorAll("button")].find(
      (node) => node.textContent === label,
    ),
    label,
  );
}

describe("StatusTray", () => {
  it("keeps disclosure, disabled state and focus ownership with a native trigger", () => {
    const { container } = render(<Harness nativeKeys disabled />);
    const ports = button(container, "Ports3");
    const disabled = button(container, "Processes");
    expect(ports.classList.contains("caps-keycap-button")).toBe(true);
    expect(ports.classList.contains("caps-status-tray-chip")).toBe(false);
    expect(disabled.disabled).toBe(true);
    act(() => {
      ports.click();
    });
    const panel = requireValue(
      container.querySelector('[role="dialog"]'),
      "tray",
    );
    expect(ports.getAttribute("aria-controls")).toBe(panel.id);
    expect(document.activeElement).toBe(panel);
    act(() => {
      fireKey(document, { key: "Escape" });
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(ports.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(ports);
  });

  it("opens only the selected tray, exposes its label/control relationship and hides zero counts", () => {
    const { container } = render(<Harness />);
    const ports = button(container, "Ports3");
    const processes = button(container, "Processes");
    act(() => {
      ports.click();
    });
    const panel = requireValue(
      container.querySelector('[role="dialog"]'),
      "open tray",
    );
    expect(ports.getAttribute("aria-expanded")).toBe("true");
    expect(ports.getAttribute("aria-controls")).toBe(panel.id);
    expect(
      document.getElementById(
        requireValue(panel.getAttribute("aria-labelledby"), "heading id"),
      )?.textContent,
    ).toBe("Ports");
    expect(document.activeElement).toBe(panel);
    act(() => {
      processes.click();
    });
    expect(container.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(container.textContent).toContain("No running processes.");
    expect(container.textContent).not.toContain("Open preview");
    expect(ports.getAttribute("aria-expanded")).toBe("false");
    expect(processes.getAttribute("aria-expanded")).toBe("true");
    act(() => {
      processes.click();
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders only the open tray when a host's chrome draws the chips", () => {
    const tray = (openId: string | null) => (
      <StatusTray
        placement="host"
        openId={openId}
        onOpenChange={() => undefined}
        items={[
          {
            id: "ports",
            label: "Ports",
            title: "Exposed ports",
            content: <StatusTrayNote>No exposed ports.</StatusTrayNote>,
          },
        ]}
      />
    );
    expect(render(tray(null)).container.querySelector("button")).toBeNull();
    const { container } = render(tray("ports"));
    const panel = requireValue(
      container.querySelector('[role="dialog"]'),
      "open tray",
    );
    expect(panel.textContent).toContain("Exposed ports");
    expect(panel.textContent).toContain("No exposed ports.");
    expect(container.querySelector("[data-status-tray-chip]")).toBeNull();
    // The host says where its trigger sits; the tray opens above it.
    const anchored = render(
      <StatusTray
        placement="host"
        hostInset={120}
        openId="ports"
        onOpenChange={() => undefined}
        items={[{ id: "ports", label: "Ports", content: "None" }]}
      />,
    ).container.querySelector<HTMLElement>(".caps-status-tray");
    expect(
      anchored?.style.getPropertyValue("--caps-status-tray-host-inset"),
    ).toBe("120px");
  });

  it("closes on Escape or the close control and returns focus to its trigger", () => {
    const { container } = render(<Harness />);
    const ports = button(container, "Ports3");
    act(() => {
      ports.click();
    });
    act(() => {
      fireKey(document, { key: "Escape" });
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(ports);
    act(() => {
      ports.click();
    });
    const close = requireValue(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Close tray"]',
      ),
      "close",
    );
    act(() => {
      close.click();
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(ports);
  });

  it("keeps inside interactions open and dismisses on an outside pointer without stealing focus", () => {
    const { container } = render(<Harness />);
    const ports = button(container, "Ports3");
    act(() => {
      ports.click();
    });
    act(() => {
      button(container, "Open preview").dispatchEvent(
        new Event("pointerdown", { bubbles: true }),
      );
    });
    expect(ports.getAttribute("aria-expanded")).toBe("true");
    const outside = button(container, "Outside");
    act(() => {
      outside.focus();
      outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it("never opens disabled items, including externally selected ones", () => {
    const { container } = render(<Harness disabled />);
    const processes = button(container, "Processes");
    expect(processes.disabled).toBe(true);
    act(() => {
      processes.click();
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    const selected = render(
      <StatusTray
        items={[
          {
            id: "ports",
            label: "Ports",
            content: "Unavailable",
            disabled: true,
          },
        ]}
        openId="ports"
        onOpenChange={() => {
          throw new Error("Disabled tray must not change selection");
        }}
      />,
    );
    expect(selected.container.querySelector('[role="dialog"]')).toBeNull();
    expect(
      button(selected.container, "Ports").getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("keeps each bezel action associated with its readout through list changes", () => {
    function Processes() {
      const [names, setNames] = useState(["bun dev", "vite"]);
      return (
        <StatusTray
          openId="processes"
          onOpenChange={() => undefined}
          items={[
            {
              id: "processes",
              label: "Processes",
              count: names.length,
              content: (
                <StatusTrayList>
                  {names.map((name) => (
                    <StatusTrayRow
                      key={name}
                      primary={name}
                      actions={
                        <button
                          type="button"
                          aria-label={`Stop ${name}`}
                          onClick={() => {
                            setNames((items) =>
                              items.filter((item) => item !== name),
                            );
                          }}
                        >
                          Stop
                        </button>
                      }
                    />
                  ))}
                </StatusTrayList>
              ),
            },
          ]}
        />
      );
    }
    const { container } = render(<Processes />);
    act(() => {
      requireValue(
        container.querySelector<HTMLButtonElement>(
          'button[aria-label="Stop vite"]',
        ),
        "vite stop action",
      ).click();
    });
    expect(container.textContent).toContain("bun dev");
    expect(container.textContent).not.toContain("vite");
    expect(button(container, "Processes1").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("explains an unavailable feed without implying an empty list", () => {
    const { container } = render(
      <StatusTray
        openId="processes"
        onOpenChange={() => undefined}
        items={[
          {
            id: "processes",
            label: "Processes",
            content: (
              <StatusTrayNote title="No signal">
                This Computer cannot list processes yet.
              </StatusTrayNote>
            ),
          },
        ]}
      />,
    );
    expect(container.textContent).toContain("No signal");
    expect(container.textContent).toContain("cannot list processes");
    expect(container.querySelector(".caps-status-tray-count")).toBeNull();
  });

  it("lets a child consume Escape before the tray dismisses", () => {
    function Nested() {
      const [openId, setOpenId] = useState<string | null>("ports");
      return (
        <StatusTray
          openId={openId}
          onOpenChange={setOpenId}
          items={[
            {
              id: "ports",
              label: "Ports",
              content: (
                <input
                  aria-label="Port"
                  onKeyDown={(event) => {
                    event.preventDefault();
                  }}
                />
              ),
            },
          ]}
        />
      );
    }
    const { container } = render(<Nested />);
    act(() => {
      fireKey(requireValue(container.querySelector("input"), "port input"), {
        key: "Escape",
      });
    });
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("places an item's own controls right after its chip in DOM order", () => {
    const { container } = render(
      <StatusTray
        openId={null}
        onOpenChange={() => undefined}
        items={[
          {
            id: "folder",
            label: "Folder",
            content: null,
            after: <button type="button">Upload</button>,
          },
          { id: "activity", label: "Activity", content: null },
        ]}
      />,
    );
    expect(
      [...container.querySelectorAll("button")].map((node) => node.textContent),
    ).toEqual(["Folder", "Upload", "Activity"]);
  });
});
