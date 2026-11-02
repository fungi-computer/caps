import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { DataList, FactRow } from "./data-list.js";

afterEach(cleanup);

describe("FactRow", () => {
  it("reads as a label column and a value, with a decorative Sigil", () => {
    const view = render(
      <DataList density="compact" aria-label="About">
        <FactRow icon={<svg data-testid="sigil" />} label="Model">
          GPT Image 2
        </FactRow>
        <FactRow label="Made">2 Nov 2026</FactRow>
      </DataList>,
    );
    const [model, madeRow] = [...view.container.querySelectorAll("li")];
    const row = requireValue(model, "model row");
    expect(row.className).toContain("list-row");
    expect(row.className).toContain("caps-fact");
    expect(row.querySelector(".caps-fact-label")?.textContent).toBe("Model");
    expect(row.querySelector(".caps-fact-value")?.textContent).toBe(
      "GPT Image 2",
    );
    expect(
      row.querySelector(".caps-fact-icon")?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      requireValue(madeRow, "made row").querySelector(".caps-fact-icon"),
    ).toBeNull();
  });
});
