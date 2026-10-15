import { act, createRef, useState } from "react";
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs.js";

afterEach(cleanup);

describe("Tabs", () => {
  it("links tabs to panels and navigates locally around disabled tabs", () => {
    const rootRef = createRef<HTMLDivElement>();
    const ref = createRef<HTMLButtonElement>();
    const onValueChange = vi.fn();
    const view = render(
      <Tabs ref={rootRef} defaultValue="one" onValueChange={onValueChange}>
        <TabsList aria-label="Sections" className="list-custom">
          <TabsTrigger ref={ref} value="one">
            One
          </TabsTrigger>
          <TabsTrigger disabled value="two">
            Two
          </TabsTrigger>
          <TabsTrigger className="trigger-custom" value="three">
            Three
          </TabsTrigger>
        </TabsList>
        <TabsContent value="one">First</TabsContent>
        <TabsContent forceMount value="three">
          Third
        </TabsContent>
      </Tabs>,
    );
    const tabs =
      view.container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const firstTab = requireValue(tabs[0], "first tab");
    const thirdTab = requireValue(tabs[2], "third tab");
    const firstPanel = view.container.querySelector('[role="tabpanel"]');
    expect(rootRef.current).toBe(view.container.firstElementChild);
    expect(ref.current).toBe(tabs[0]);
    expect(view.queryBySelector(".list-custom")).not.toBeNull();
    expect(tabs[0]?.getAttribute("aria-controls")).toBe(firstPanel?.id);
    expect(firstPanel?.getAttribute("aria-labelledby")).toBe(tabs[0]?.id);
    expect(tabs[0]?.tabIndex).toBe(0);
    expect(tabs[1]?.disabled).toBe(true);

    act(() => {
      fireKey(firstTab, { key: "ArrowRight" });
    });
    expect(tabs[2]?.tabIndex).toBe(0);
    expect(document.activeElement).toBe(tabs[2]);
    expect(onValueChange).toHaveBeenCalledWith("three");
    expect(
      view.container.querySelector('[role="tabpanel"]')?.textContent,
    ).toContain("Third");

    act(() => {
      fireKey(thirdTab, { key: "ArrowLeft" });
    });
    expect(document.activeElement).toBe(tabs[0]);
    act(() => {
      fireKey(firstTab, { key: "End" });
    });
    expect(document.activeElement).toBe(tabs[2]);
    act(() => {
      fireKey(thirdTab, { key: "Home" });
    });
    expect(document.activeElement).toBe(tabs[0]);
  });

  it("supports controlled selection and caller keyboard handlers", () => {
    const onKeyDown = vi.fn();
    const onValueChange = vi.fn();
    let setValue: ((value: string) => void) | undefined;
    function Harness() {
      const [value, update] = useState("one");
      setValue = update;
      return (
        <Tabs
          value={value}
          onValueChange={(next) => {
            onValueChange(next);
            setValue?.(next);
          }}
        >
          <TabsList>
            <TabsTrigger onKeyDown={onKeyDown} value="one">
              One
            </TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">One panel</TabsContent>
          <TabsContent value="two">Two panel</TabsContent>
        </Tabs>
      );
    }
    const view = render(<Harness />);
    const tabs =
      view.container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const secondTab = requireValue(tabs[1], "controlled second tab");
    act(() => setValue?.("two"));
    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    expect(view.container.textContent).toContain("Two panel");
    expect(onKeyDown).not.toHaveBeenCalled();
    act(() => {
      fireKey(secondTab, { key: "ArrowLeft" });
    });
    expect(onValueChange).toHaveBeenCalledWith("one");
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("presents equal exclusive choices as one segmented control", () => {
    const view = render(
      <Tabs defaultValue="in">
        <TabsList aria-label="Account" variant="segmented">
          <TabsTrigger value="in">Sign in</TabsTrigger>
          <TabsTrigger value="up">Create account</TabsTrigger>
        </TabsList>
        <TabsContent value="in">Sign in panel</TabsContent>
        <TabsContent value="up">Create panel</TabsContent>
      </Tabs>,
    );
    const list = requireValue(
      view.container.querySelector<HTMLElement>('[role="tablist"]'),
      "segmented list",
    );
    expect(list.dataset.variant).toBe("segmented");
    expect(list.classList.contains("caps-tabs-segmented")).toBe(true);
    expect(list.classList.contains("tabs-border")).toBe(false);
    const create = requireValue(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1],
      "create tab",
    );
    act(() => {
      create.click();
    });
    expect(create.getAttribute("aria-selected")).toBe("true");
    expect(view.container.textContent).toContain("Create panel");
  });
});
