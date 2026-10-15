// @vitest-environment jsdom
import { act, createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import { Listbox } from "./listbox.js";

afterEach(cleanup);

const items = [
  { id: "one", label: "One" },
  { id: "two", label: "Two" },
  { id: "three", label: "Three" },
];

describe("Listbox", () => {
  it("supports local navigation, disabled options, native props, and refs", () => {
    const onValueChange = vi.fn();
    const ref = createRef<HTMLDivElement>();
    const view = render(
      <Listbox
        className="list-custom"
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        isDisabled={(item) => item.id === "two"}
        items={items}
        onValueChange={onValueChange}
        rootRef={ref}
        renderItem={(item, active, state) => (
          <span data-active={active} data-selected={state.selected}>
            {item.label}
          </span>
        )}
      />,
    );
    const list = requireValue(
      view.queryBySelector(".list-custom"),
      "Listbox root",
    );
    const options =
      view.container.querySelectorAll<HTMLElement>('[role="option"]');
    expect(ref.current).toBe(list);
    expect(list.getAttribute("aria-activedescendant")).toContain("one");
    expect(options[1]?.getAttribute("aria-disabled")).toBe("true");
    act(() => options[1]?.click());
    expect(onValueChange).not.toHaveBeenCalled();

    act(() => {
      fireKey(list, { key: "ArrowDown" });
    });
    expect(list.getAttribute("aria-activedescendant")).toContain("three");
    act(() => {
      fireKey(list, { key: "Enter" });
    });
    expect(onValueChange).toHaveBeenCalledWith("three", items[2]);
    expect(options[2]?.getAttribute("aria-selected")).toBe("true");
  });

  it("supports typed multiple selection and stays free of global listeners", () => {
    const onValueChange = vi.fn();
    const view = render(
      <Listbox
        defaultValue={["one"]}
        emptyMessage="Nothing here"
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        items={items}
        multiple
        onValueChange={onValueChange}
      />,
    );
    const list = requireValue(
      view.container.querySelector('[role="listbox"]'),
      "multiple Listbox root",
    );
    expect(list.getAttribute("aria-multiselectable")).toBe("true");
    expect(
      view.container.querySelector('[aria-selected="true"]')?.textContent,
    ).toBe("One");
    act(() => {
      fireKey(list, { key: "End" });
    });
    act(() => {
      fireKey(list, { key: " " });
    });
    expect(onValueChange).toHaveBeenCalledWith(
      ["one", "three"],
      [items[0], items[2]],
    );
    const hostKeyDown = vi.fn();
    view.container.addEventListener("keydown", hostKeyDown);
    act(() => {
      const escape = fireKey(list, { key: "Escape" });
      expect(escape.defaultPrevented).toBe(false);
    });
    expect(hostKeyDown).toHaveBeenCalledTimes(1);
  });

  it("keeps a controlled active descendant aligned with external selection", () => {
    let setSingle: ((value: string | null) => void) | undefined;
    let setMultiple: ((value: string[]) => void) | undefined;
    let rerender: (() => void) | undefined;
    function Harness() {
      const [single, updateSingle] = useState<string | null>("one");
      const [multiple, updateMultiple] = useState(["one"]);
      const [, updateRender] = useState(0);
      setSingle = updateSingle;
      setMultiple = updateMultiple;
      rerender = () => {
        updateRender((value) => value + 1);
      };
      return (
        <div>
          <Listbox
            aria-label="Single"
            value={single}
            items={items}
            getKey={(item) => item.id}
            getLabel={(item) => item.label}
          />
          <Listbox
            aria-label="Multiple"
            multiple
            value={multiple}
            items={items}
            getKey={(item) => item.id}
            getLabel={(item) => item.label}
          />
        </div>
      );
    }
    const view = render(<Harness />);
    const lists = view.container.querySelectorAll('[role="listbox"]');
    const singleList = requireValue(lists[0], "controlled single Listbox");
    const multipleList = requireValue(lists[1], "controlled multiple Listbox");
    expect(singleList.getAttribute("aria-activedescendant")).toContain("one");
    expect(multipleList.getAttribute("aria-activedescendant")).toContain("one");

    act(() => setSingle?.("two"));
    act(() => setMultiple?.(["three"]));
    expect(singleList.getAttribute("aria-activedescendant")).toContain("two");
    expect(multipleList.getAttribute("aria-activedescendant")).toContain(
      "three",
    );

    act(() => {
      fireKey(singleList, { key: "ArrowDown" });
    });
    const manuallyNavigated = singleList.getAttribute("aria-activedescendant");
    act(() => rerender?.());
    expect(singleList.getAttribute("aria-activedescendant")).toBe(
      manuallyNavigated,
    );

    act(() => setSingle?.(null));
    act(() => setMultiple?.([]));
    expect(singleList.getAttribute("aria-activedescendant")).toBeNull();
    expect(multipleList.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("renders its empty state without inventing options", () => {
    const view = render(
      <Listbox
        aria-label="Empty"
        emptyMessage={<strong>Nothing here</strong>}
        items={[]}
        getKey={(item: { id: string }) => item.id}
        getLabel={(item: { id: string }) => item.id}
      />,
    );
    expect(view.container.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(view.container.textContent).toContain("Nothing here");
  });
});
