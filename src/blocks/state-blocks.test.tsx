// @vitest-environment jsdom
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { AsyncState } from "./async-state.js";
import { EmptyState } from "./empty-state.js";
import { ResultState } from "./result-state.js";

afterEach(cleanup);

describe("state blocks", () => {
  it("selects only the explicit AsyncState slot and preserves native props/ref", () => {
    const ref = createRef<HTMLDivElement>();
    const fetch = vi.fn();
    const view = render(
      <AsyncState
        aria-label="Data"
        className="host"
        content={<span>content</span>}
        empty={<span>empty</span>}
        error={<span>error</span>}
        loading={<span>loading</span>}
        ref={ref}
        state="empty"
      />,
    );
    expect(ref.current?.className).toContain("host");
    expect(view.container.textContent).toBe("empty");
    expect(view.container.querySelector("[aria-label=Data]")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("renders EmptyState hierarchy, slots, native attributes, and ref", () => {
    const ref = createRef<HTMLElement>();
    const view = render(
      <EmptyState
        actions={<button type="button">Create</button>}
        className="pane"
        data-owner="host"
        description="There is nothing here yet."
        ref={ref}
        title="No items"
        visual={<span>art</span>}
      />,
    );
    expect(ref.current?.tagName).toBe("SECTION");
    const section = requireValue(
      view.container.querySelector("section"),
      "EmptyState section",
    );
    const heading = requireValue(
      section.querySelector("h2"),
      "EmptyState heading",
    );
    expect(heading.textContent).toBe("No items");
    expect(section.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(view.container.querySelector("p")?.textContent).toContain("nothing");
    expect(view.container.querySelector("[data-owner=host]")).toBeTruthy();
    expect(view.container.querySelector("[aria-hidden=true]")).toBeTruthy();
  });

  it("labels ResultState and keeps supplied actions and icon presentation", () => {
    const view = render(
      <ResultState
        actions={<a href="/next">Continue</a>}
        description="Your request is complete."
        icon={<span>ok</span>}
        title="Complete"
      />,
    );
    const section = requireValue(
      view.container.querySelector("section"),
      "ResultState section",
    );
    const heading = requireValue(
      section.querySelector("h2"),
      "ResultState heading",
    );
    expect(section.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(section.querySelector("[aria-hidden=true]")?.textContent).toBe("ok");
    expect(section.querySelector("a")?.textContent).toBe("Continue");
  });
});

describe("first-run kit", () => {
  it("renders one primary action, chip states and unique chip keys", () => {
    const onSelect = vi.fn();
    const view = render(
      <EmptyState
        description="Make a thing."
        primaryAction={{
          label: "New thing",
          onSelect,
          disabled: true,
          disabledReason: "Connect a model first",
        }}
        suggestions={[
          { label: "Same", onSelect: () => undefined },
          { label: "Same", onSelect: () => undefined, pending: true },
          { label: "Off", onSelect: () => undefined, disabled: true },
        ]}
        title="Make your first thing"
        variant="panel"
      />,
    );
    const primary = requireValue(
      view.container.querySelector<HTMLButtonElement>(
        ".empty-state-primary button",
      ),
      "primary action",
    );
    expect(primary.disabled).toBe(true);
    expect(primary.getAttribute("aria-describedby")).toBeTruthy();
    expect(view.container.textContent).toContain("Connect a model first");
    const chips = view.container.querySelectorAll(
      ".empty-state-suggestions button",
    );
    expect(chips).toHaveLength(3);
    expect(chips[1]?.getAttribute("aria-busy")).toBe("true");
    expect(chips[2]?.hasAttribute("disabled")).toBe(true);
  });

  it("shows the idle blob loader for blobs and for a panel with no visual", () => {
    const blobs = render(
      <EmptyState description="d" title="t" visual="blobs" />,
    );
    const loader = blobs.container.querySelector(
      ".empty-state-visual .caps-loader",
    );
    expect(loader?.getAttribute("data-pace")).toBe("idle");
    expect(loader?.getAttribute("data-variant")).toBe("wander");
    cleanup();
    const panel = render(
      <EmptyState description="d" title="t" variant="panel" />,
    );
    expect(panel.container.querySelector(".caps-loader")).toBeTruthy();
    cleanup();
    const speech = render(
      <EmptyState description="d" title="t" variant="speech" />,
    );
    expect(speech.container.querySelector(".caps-loader")).toBeNull();
  });

  it("renders ResultState tone, at most three numbered steps and heading level", () => {
    const view = render(
      <ResultState
        description="It stopped."
        headingLevel={3}
        steps={["One", "Two", "Three", "Four"]}
        title="Could not start"
        tone="failed"
        visual={<span>art</span>}
      />,
    );
    expect(view.container.querySelector("h3")?.textContent).toBe(
      "Could not start",
    );
    expect(
      view.container.querySelector("section")?.getAttribute("data-tone"),
    ).toBe("failed");
    expect(view.container.querySelectorAll("ol > li")).toHaveLength(3);
    expect(view.container.querySelector(".result-state-visual")).toBeTruthy();
  });
});
