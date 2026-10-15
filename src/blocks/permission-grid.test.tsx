// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { PermissionGrid } from "./permission-grid.js";

afterEach(cleanup);

describe("PermissionGrid", () => {
  it("reads as one named row per capability with state in words", () => {
    const view = render(
      <PermissionGrid
        caption="Website channel"
        summary="Strangers can trigger what is On."
        rows={[
          {
            id: "browser",
            group: "Session",
            label: "Visitor browser commands",
            mark: <svg data-mark="browser" />,
            state: "allowed",
            stateLabel: "On",
            scope: "Default",
          },
          {
            id: "computer",
            label: "Computers and Home files",
            mark: <svg />,
            state: "denied",
            stateLabel: "Off",
            scope: "Owner grant",
            control: <button type="button">Allow Computers</button>,
          },
        ]}
      />,
    );
    const table = requireValue(view.queryBySelector("table"), "a table");
    expect(view.queryByText("Website channel")).not.toBeNull();
    const rows = [...table.querySelectorAll("tbody tr")];
    expect(rows.map((row) => row.getAttribute("data-state"))).toEqual([
      "allowed",
      "denied",
    ]);
    expect(
      [...table.querySelectorAll("tbody th[scope='row']")].map(
        (cell) => cell.textContent,
      ),
    ).toEqual(["Visitor browser commands", "Computers and Home files"]);
    expect(rows[0]?.textContent).toContain("01");
    expect(rows[0]?.textContent).toContain("On");
    expect(rows[1]?.textContent).toContain("Off");
    const mark = requireValue(
      view.queryBySelector("[data-mark='browser']"),
      "the decorative mark",
    );
    expect(mark.closest("[aria-hidden='true']")).not.toBeNull();
    // A control column appears only when some row carries a control.
    expect(table.querySelectorAll("thead th")).toHaveLength(5);
    expect(view.queryByText("Allow Computers")).not.toBeNull();
  });

  it("omits the control column when no row is editable", () => {
    const view = render(
      <PermissionGrid
        caption="Owner Session"
        rows={[
          {
            id: "browser",
            label: "Browser",
            mark: null,
            state: "allowed",
            stateLabel: "On",
            scope: "Owner",
          },
        ]}
      />,
    );
    expect(
      requireValue(view.queryBySelector("table"), "a table").querySelectorAll(
        "thead th",
      ),
    ).toHaveLength(4);
  });
});
