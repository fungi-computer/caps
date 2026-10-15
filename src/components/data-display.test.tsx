// @vitest-environment jsdom
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { CountBadge } from "./count-badge.js";
import { DataList, DataRow } from "./data-list.js";
import { QuotaMeter } from "./quota-meter.js";
import { Stat } from "./stat.js";

afterEach(cleanup);

describe("Caps data display", () => {
  it("keeps zero visible and treats the label as optional content", () => {
    const ref = createRef<HTMLSpanElement>();
    const view = render(
      <>
        <CountBadge
          className="count-custom"
          count={0}
          data-test="count"
          label="items"
          ref={ref}
        />
        <CountBadge count={3} tone="warning" />
      </>,
    );
    const badges = view.container.querySelectorAll<HTMLElement>(".badge");
    const hosts = view.container.querySelectorAll<HTMLElement>(
      ".inline-flex.items-center",
    );

    expect(badges).toHaveLength(2);
    expect(badges[0]?.textContent).toBe("0");
    expect(badges[0]?.className).toBe(
      "badge badge-neutral badge-sm tabular-nums caps-numeric",
    );
    expect(badges[0]?.className).toContain("tabular-nums");
    expect(badges[1]?.textContent).toBe("3");
    expect(badges[1]?.className).toContain("badge-warning");
    expect(view.queryByText("items")).not.toBeNull();
    expect(hosts[0]?.textContent).toBe("0items");
    expect(hosts[0]?.className).toContain("count-custom");
    expect(hosts[0]?.dataset.test).toBe("count");
    expect(hosts[1]?.textContent).toBe("3");
    expect(ref.current).toBe(hosts[0]);
  });

  it("renders stats with native definition-list semantics", () => {
    const ref = createRef<HTMLDListElement>();
    const view = render(
      <Stat
        className="stat-custom"
        data-test="stat"
        description="Compared with last month"
        label="Balance"
        ref={ref}
        value="$42"
      />,
    );
    const stat = requireValue(
      view.container.querySelector<HTMLDListElement>("dl"),
      "Stat definition list",
    );
    expect(stat.className).toContain("stats");
    expect(stat.className).toContain("stat-custom");
    expect(stat.dataset.test).toBe("stat");
    expect(stat.querySelector("dt.stat-title")?.textContent).toBe("Balance");
    expect(stat.querySelector("dd.stat-value")?.textContent).toBe("$42");
    expect(stat.querySelector("dd.stat-desc")?.textContent).toContain(
      "Compared with last month",
    );
    expect(stat.getAttribute("role")).toBeNull();
    expect(ref.current).toBe(stat);
  });

  it("labels quota progress with unique label and description IDs", () => {
    const firstRef = createRef<HTMLDivElement>();
    const secondRef = createRef<HTMLDivElement>();
    const view = render(
      <>
        <QuotaMeter
          className="quota-custom"
          description="Resets tomorrow"
          label="Storage"
          max={100}
          ref={firstRef}
          tone="warning"
          value={35}
        />
        <QuotaMeter label="Requests" max={20} ref={secondRef} value={4} />
      </>,
    );
    const meters =
      view.container.querySelectorAll<HTMLDivElement>(".space-y-sm");
    const progresses = view.container.querySelectorAll("progress");
    expect(progresses).toHaveLength(2);
    expect(progresses[0]?.value).toBe(35);
    expect(progresses[0]?.max).toBe(100);
    expect(progresses[0]?.className).toContain("progress-warning");
    expect(progresses[0]?.getAttribute("role")).toBeNull();
    expect(progresses[1]?.getAttribute("aria-describedby")).toBeNull();

    const firstLabelId = progresses[0]?.getAttribute("aria-labelledby");
    const firstDescriptionId = progresses[0]?.getAttribute("aria-describedby");
    const secondLabelId = progresses[1]?.getAttribute("aria-labelledby");
    const firstLabel = firstLabelId
      ? document.getElementById(firstLabelId)
      : null;
    const firstDescription = firstDescriptionId
      ? document.getElementById(firstDescriptionId)
      : null;
    const secondLabel = secondLabelId
      ? document.getElementById(secondLabelId)
      : null;
    expect(firstLabel?.textContent).toBe("Storage");
    expect(firstDescription?.textContent).toBe("Resets tomorrow");
    expect(secondLabel?.textContent).toBe("Requests");
    expect(firstLabel?.id).not.toBe(secondLabel?.id);
    expect(firstDescription?.id).not.toBe(firstLabel?.id);
    expect(view.queryByText("35 / 100")).not.toBeNull();
    expect(view.queryByText("4 / 20")).not.toBeNull();
    expect(meters).toHaveLength(2);
    expect(firstRef.current).toBe(meters[0]);
    expect(secondRef.current).toBe(meters[1]);
  });

  it("renders data lists and rows as native list elements", () => {
    const listRef = createRef<HTMLUListElement>();
    const rowRef = createRef<HTMLLIElement>();
    const view = render(
      <DataList className="list-custom" ref={listRef}>
        <DataRow className="row-custom" data-test="row" ref={rowRef}>
          Recent transaction
        </DataRow>
      </DataList>,
    );
    const list = requireValue(
      view.container.querySelector<HTMLUListElement>("ul"),
      "DataList root",
    );
    const row = requireValue(
      view.container.querySelector<HTMLLIElement>("li"),
      "DataRow root",
    );
    expect(list.className).toContain("list");
    expect(list.className).toContain("list-custom");
    expect(row.className).toContain("list-row");
    expect(row.className).toContain("row-custom");
    expect(row.dataset.test).toBe("row");
    expect(list.getAttribute("role")).toBeNull();
    expect(row.getAttribute("role")).toBeNull();
    expect(listRef.current).toBe(list);
    expect(rowRef.current).toBe(row);
  });
});
