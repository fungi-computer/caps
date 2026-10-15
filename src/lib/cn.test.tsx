import { expect, test } from "vitest";

import { cn } from "./cn.js";

test("caller spacing overrides defaults without dropping the other axis or typography", () => {
  expect(cn("text-xs px-xs py-sm", "px-md")).toBe("text-xs py-sm px-md");
  expect(cn("px-sm", "px-xs")).toBe("px-xs");
  expect(cn("px-xs", "px-lg")).toBe("px-lg");
  expect(cn("p-lg", "px-xs")).toBe("p-lg px-xs");
  expect(cn("ps-xs pe-sm", "ps-md")).toBe("pe-sm ps-md");
});

test("variants and important spacing remain independent from base spacing", () => {
  expect(cn("px-xs md:px-xs", "md:px-lg")).toBe("px-xs md:px-lg");
  expect(cn("hover:gap-sm focus:gap-xs", "hover:gap-md")).toBe(
    "focus:gap-xs hover:gap-md",
  );
  expect(cn("p-xs!", "p-lg!")).toBe("p-lg!");
});

test("conditional composition preserves Daisy and Caps classes", () => {
  expect(
    cn("btn btn-primary", false, null, undefined, [
      "caps-app-bar",
      { "opacity-50": true, hidden: false },
    ]),
  ).toBe("btn btn-primary caps-app-bar opacity-50");
  expect(cn("data-[open]:bg-base-200", "data-[open]:bg-base-300")).toBe(
    "data-[open]:bg-base-300",
  );
  expect(cn("w-[calc(100%-1rem)]", "w-full")).toBe("w-full");
});
