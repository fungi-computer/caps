// @vitest-environment jsdom
import { act } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Pair() {
  return (
    <>
      {["Cut", "Copy"].map((name) => (
        <Tooltip key={name} delayDuration={300}>
          <TooltipTrigger className={`trigger-${name}`}>{name}</TooltipTrigger>
          <TooltipContent>{name} the selection</TooltipContent>
        </Tooltip>
      ))}
    </>
  );
}

it("opens a neighbour at once while the group is warm, and waits again once cool", () => {
  vi.useFakeTimers();
  const view = render(<Pair />);
  const trigger = (name: string) =>
    requireValue(
      view.container.querySelector<HTMLButtonElement>(`.trigger-${name}`),
      `${name} trigger`,
    );
  const tip = () => document.body.querySelector('[role="tooltip"]');

  act(() => {
    trigger("Cut").focus();
  });
  act(() => {
    vi.advanceTimersByTime(299);
  });
  expect(tip()).toBeNull();
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(tip()?.textContent).toBe("Cut the selection");

  // Moving to the neighbour: no second wait.
  act(() => {
    trigger("Copy").focus();
  });
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(tip()?.textContent).toBe("Copy the selection");

  // After resting away, the group cools and the first wait returns.
  act(() => {
    trigger("Copy").blur();
  });
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(tip()).toBeNull();
  act(() => {
    vi.advanceTimersByTime(1_000);
  });
  act(() => {
    trigger("Cut").focus();
  });
  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(tip()).toBeNull();
  act(() => {
    vi.advanceTimersByTime(200);
  });
  expect(tip()?.textContent).toBe("Cut the selection");
});
