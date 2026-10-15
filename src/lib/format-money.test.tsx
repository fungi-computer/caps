import { describe, expect, it } from "vitest";
import { formatMoney } from "./format-money.js";

describe("formatMoney", () => {
  it.each([
    [0, "$0.00"],
    [5, "$5.00"],
    [4.99, "$4.99"],
    [0.005, "$0.005"],
    [0.00012, "$0.00012"],
    [0.00001, "$0.00001"],
    [0.000000001, "<$0.01"],
    [-0.000000001, ">-$0.01"],
    [-0.00012, "-$0.00012"],
  ])("formats %s as %s", (amount, expected) => {
    expect(formatMoney(amount)).toBe(expected);
  });
});
