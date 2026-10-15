// @vitest-environment jsdom
import { act, createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import { CommandMenu } from "./command-menu.js";
import { Composer } from "./composer.js";
import { Mosaic } from "./mosaic.js";
import { ResourceSelect } from "./resource-select.js";

afterEach(cleanup);

describe("product-neutral blocks", () => {
  it("renders Mosaic as a labelled list with named, optionally disabled interactive tiles", () => {
    const onOpen = vi.fn();
    const view = render(
      <Mosaic
        className="wall"
        label="Pictures"
        items={[
          { alt: "Ready", id: "ready" },
          { id: "pending", state: "loading", disabled: true },
        ]}
        onOpen={onOpen}
      />,
    );
    expect(view.queryBySelector('[role="list"]')?.className).toContain("wall");
    expect(view.container.querySelectorAll('[role="listitem"]')).toHaveLength(
      2,
    );
    const buttons =
      view.container.querySelectorAll<HTMLButtonElement>("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.getAttribute("aria-label")).toBe("Ready");
    expect(buttons[1]?.disabled).toBe(true);
    act(() => buttons[0]?.click());
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ready" }),
    );
    const passive = render(<Mosaic items={[{ id: "passive" }]} />);
    expect(passive.container.querySelector("button")).toBeNull();
  });

  it("keeps Composer slots direct, caller-named, and ref-forwarded", () => {
    const ref = createRef<HTMLDivElement>();
    const view = render(
      <Composer
        className="host"
        input={<input aria-label="Draft" className="join-item" />}
        action={
          <button aria-label="Send now" className="join-item" type="button">
            Send
          </button>
        }
        ref={ref}
        rowClassName="busy"
      />,
    );
    expect(ref.current?.className).toContain("host");
    expect(view.container.querySelector(".join")?.className).toContain("busy");
    expect(
      view.container.querySelector('[aria-label="Send now"]')?.parentElement
        ?.className,
    ).toContain("join");
  });

  it("shows a CommandMenu key hint before the label and announces it", () => {
    const view = render(
      <CommandMenu
        items={[{ id: "zoom", label: "Zoom window", shortcut: "z" }]}
        onSelect={vi.fn()}
      />,
    );
    const option = view.container.querySelector('[role="option"]');
    expect(option?.getAttribute("aria-keyshortcuts")).toBe("z");
    expect(option?.querySelector("kbd")?.textContent).toBe("z");
  });

  it("navigates CommandMenu with one listbox focus and skips disabled options", () => {
    const onSelect = vi.fn();
    const view = render(
      <CommandMenu
        items={[
          { id: "one", label: "One" },
          { disabled: true, id: "two", label: "Two" },
          { id: "three", label: "Three" },
        ]}
        onSelect={onSelect}
        selected="one"
      />,
    );
    const list = requireValue(
      view.container.querySelector<HTMLElement>('[role="listbox"]'),
      "CommandMenu listbox",
    );
    expect(view.container.querySelectorAll('[role="option"]')).toHaveLength(3);
    act(() => {
      fireKey(list, { key: "ArrowDown" });
    });
    expect(list.getAttribute("aria-activedescendant")).toContain("three");
    act(() => {
      fireKey(list, { key: "Enter" });
    });
    expect(onSelect).toHaveBeenCalledWith("three");
  });

  it("honours ResourceSelect disabled options, keyboard choice, native trigger props, and refs", () => {
    const onSelect = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    const view = render(
      <ResourceSelect
        onSelect={onSelect}
        options={[
          { id: "one", label: "One" },
          { disabled: true, id: "two", label: "Two" },
          { id: "three", label: "Three" },
        ]}
        ref={ref}
        triggerProps={{ "data-owner": "host", className: "host-trigger" }}
        value="one"
      />,
    );
    const trigger = requireValue(
      view.container.querySelector<HTMLButtonElement>("button"),
      "ResourceSelect trigger",
    );
    expect(ref.current).toBe(trigger);
    expect(trigger.dataset.owner).toBe("host");
    expect(trigger.className).toContain("host-trigger");
    act(() => {
      trigger.click();
    });
    const search = requireValue(
      document.querySelector<HTMLElement>('[role="combobox"]'),
      "ResourceSelect search input",
    );
    act(() => {
      fireKey(search, { key: "ArrowDown" });
    });
    act(() => {
      fireKey(search, { key: "Enter" });
    });
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "three" }),
    );
    expect(onSelect).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: "two" }),
    );
  });
});
