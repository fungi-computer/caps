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
