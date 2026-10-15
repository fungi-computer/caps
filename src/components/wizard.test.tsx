import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Wizard } from "./wizard.js";
afterEach(cleanup);

test("validation blocks Next while keeping Back and earlier steps usable", () => {
  const change = vi.fn();
  const view = render(
    <Wizard
      steps={[
        { id: "one", title: "One", content: "First" },
        { id: "two", title: "Two", content: "Second" },
        { id: "three", title: "Three", content: "Third" },
      ]}
      current="two"
      onStepChange={change}
      nextDisabled
    />,
  );
  const buttons = [...view.container.querySelectorAll("button")];
  const next = requireValue(
    buttons.find((button) => button.textContent === "Next"),
    "Next button",
  );
  const back = requireValue(
    buttons.find((button) => button.textContent === "Back"),
    "Back button",
  );
  expect(next.disabled).toBe(true);
  expect(back.disabled).toBe(false);
  act(() => {
    next.click();
  });
  expect(change).not.toHaveBeenCalled();
  act(() => {
    back.click();
  });
  expect(change).toHaveBeenCalledWith("one");
});
