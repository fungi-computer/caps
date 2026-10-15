// @vitest-environment jsdom
import { act, createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Tooltip", () => {
  it("opens from focus after a delay with rich content and generated description", () => {
    vi.useFakeTimers();
    const view = render(
      <Tooltip delayDuration={200} side="right">
        <TooltipTrigger
          aria-describedby="external-description"
          asChild
          className="trigger-custom"
        >
          <button type="button">Help</button>
        </TooltipTrigger>
        <TooltipContent className="content-custom">
          <strong>Helpful</strong> details
        </TooltipContent>
      </Tooltip>,
    );
    const trigger = requireValue(
      view.container.querySelector<HTMLButtonElement>(".trigger-custom"),
      "focus Tooltip trigger",
    );
    expect(trigger.getAttribute("aria-describedby")).toBe(
      "external-description",
    );
    act(() => {
      trigger.focus();
    });
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    const content = requireValue(
      document.body.querySelector('[role="tooltip"]'),
      "opened Tooltip content",
    );
    expect(content.textContent).toContain("Helpful");
    expect(content.getAttribute("data-side")).toBe("right");
    expect(trigger.getAttribute("aria-describedby")).toBe(
      `external-description ${content.id}`,
    );
    act(() => {
      trigger.blur();
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
    expect(trigger.getAttribute("aria-describedby")).toBe(
      "external-description",
    );
  });

  it("supports controlled SSR-safe initial state and caller classes", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    const view = render(
      <Tooltip onOpenChange={onOpenChange} open>
        <TooltipTrigger
          ref={ref}
          className="direct-trigger"
          disabled
          type="submit"
        >
          Help
        </TooltipTrigger>
        <TooltipContent>Always visible</TooltipContent>
      </Tooltip>,
    );
    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip?.textContent).toBe("Always visible");
    expect(
      tooltip?.closest('[class~="z-(--stipe-layer-tooltip)"]'),
    ).not.toBeNull();
    expect(view.queryBySelector(".direct-trigger")).not.toBeNull();
    expect(ref.current?.disabled).toBe(true);
    expect(ref.current?.type).toBe("submit");
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => {
      ref.current?.dispatchEvent(new Event("pointerout", { bubbles: true }));
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("opens from a real pointer hover and clears a pending timer on unmount", () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const view = render(
      <Tooltip delayDuration={100} onOpenChange={onOpenChange}>
        <TooltipTrigger asChild>
          <button type="button">Hover</button>
        </TooltipTrigger>
        <TooltipContent>Hover details</TooltipContent>
      </Tooltip>,
    );
    const trigger = requireValue(
      view.container.querySelector("button"),
      "hover Tooltip trigger",
    );
    act(() => {
      trigger.dispatchEvent(new Event("pointerover", { bubbles: true }));
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull();
    act(() => {
      trigger.dispatchEvent(new Event("pointerout", { bubbles: true }));
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();

    const pending = render(
      <Tooltip delayDuration={100} onOpenChange={onOpenChange}>
        <TooltipTrigger asChild>
          <button type="button">Pending</button>
        </TooltipTrigger>
        <TooltipContent>Pending details</TooltipContent>
      </Tooltip>,
    );
    const pendingTrigger = requireValue(
      pending.container.querySelector("button"),
      "pending Tooltip trigger",
    );
    act(() => {
      pendingTrigger.focus();
    });
    const callsBeforeUnmount = onOpenChange.mock.calls.length;
    cleanup();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onOpenChange).toHaveBeenCalledTimes(callsBeforeUnmount);
  });
});
