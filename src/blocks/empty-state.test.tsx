// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { EmptyState } from "./empty-state.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** jsdom has no matchMedia; the shared motion preference reads it when present. */
function stubMotionPreference(reduce: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches: reduce,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

describe("EmptyState", () => {
  it("tells a speech visual it is speaking for a moment, then settles", () => {
    vi.useFakeTimers();
    stubMotionPreference(false);
    const seen: boolean[] = [];
    render(
      <EmptyState
        description="The stalls are still going up."
        title="Nothing here yet"
        variant="speech"
        renderVisual={({ speaking }) => {
          seen.push(speaking);
          return <span>{speaking ? "speaking" : "idle"}</span>;
        }}
      />,
    );
    expect(seen.at(-1)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(seen.at(-1)).toBe(false);
  });

  it("never speaks when motion is reduced, and other variants never speak", () => {
    stubMotionPreference(true);
    const reduced: boolean[] = [];
    render(
      <EmptyState
        description="Quiet."
        title="Reduced"
        variant="speech"
        renderVisual={({ speaking }) => {
          reduced.push(speaking);
          return <span />;
        }}
      />,
    );
    expect(reduced.every((speaking) => !speaking)).toBe(true);
    stubMotionPreference(false);
    const panel: boolean[] = [];
    render(
      <EmptyState
        description="Panel."
        title="Panel"
        variant="panel"
        renderVisual={({ speaking }) => {
          panel.push(speaking);
          return <span />;
        }}
      />,
    );
    expect(panel.every((speaking) => !speaking)).toBe(true);
  });

  it("offers suggestion chips that call back with their own choice", () => {
    const chosen: string[] = [];
    const view = render(
      <EmptyState
        description="Try one."
        suggestions={[
          { label: "a mushroom knight", onSelect: () => chosen.push("knight") },
          { label: "moss on a keyboard", onSelect: () => chosen.push("moss") },
        ]}
        title="Nothing printed"
        variant="panel"
      />,
    );
    const list = requireValue(
      view.container.querySelector("ul[aria-label]"),
      "suggestion list",
    );
    const chips = Array.from(list.querySelectorAll("button"));
    expect(chips.map((chip) => chip.textContent)).toEqual([
      "a mushroom knight",
      "moss on a keyboard",
    ]);
    act(() => {
      chips[1]?.click();
    });
    expect(chosen).toEqual(["moss"]);
  });

  it("tells the visual it is thinking while the host works, and thinking outranks speaking", () => {
    stubMotionPreference(false);
    const seen: { speaking: boolean; thinking: boolean }[] = [];
    const visual = (state: { speaking: boolean; thinking: boolean }) => {
      seen.push(state);
      return <span />;
    };
    render(
      <EmptyState
        description="Working on it."
        thinking
        title="One moment"
        variant="speech"
        renderVisual={visual}
      />,
    );
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((state) => state.thinking && !state.speaking)).toBe(true);
    const idle: boolean[] = [];
    render(
      <EmptyState
        description="Idle."
        title="Idle"
        variant="panel"
        renderVisual={({ thinking }) => {
          idle.push(thinking);
          return <span />;
        }}
      />,
    );
    expect(idle.every((thinking) => !thinking)).toBe(true);
  });

  it("titles a nested absence below the heading it sits under", () => {
    const view = render(
      <EmptyState
        description="Agents use Fungi models until you add a provider key."
        headingLevel={3}
        title="No model keys"
        variant="quiet"
      />,
    );
    const section = requireValue(
      view.container.querySelector("section"),
      "empty state",
    );
    const heading = requireValue(section.querySelector("h3"), "title");
    expect(section.querySelector("h2")).toBeNull();
    expect(heading.className).toBe("empty-state-title");
    expect(section.classList.contains("empty-state-quiet")).toBe(true);
    expect(section.getAttribute("aria-labelledby")).toBe(heading.id);
  });
});
