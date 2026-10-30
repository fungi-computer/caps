import { describe, expect, it } from "vitest";
import { formatMoney } from "./format-money.js";

describe("formatMoney", () => {
  it.each([
    [0, "$0.00"],
    [5, "$5.00"],
    [4.99, "$4.99"],
    [0.01, "$0.01"],
    [0.005, "<$0.01"],
    [0.00018, "<$0.01"],
    [0.024, "$0.02"],
    [1.234, "$1.23"],
    [0.00012, "<$0.01"],
    [0.00001, "<$0.01"],
    [0.000000001, "<$0.01"],
    [-0.000000001, ">-$0.01"],
    [-0.00012, ">-$0.01"],
  ])("formats %s as %s", (amount, expected) => {
    expect(formatMoney(amount)).toBe(expected);
  });

  it("preserves sub-cent precision explicitly for billing and image receipts", () => {
    expect(formatMoney(0.00018, { precision: "exact" })).toBe("$0.00018");
  });
});
