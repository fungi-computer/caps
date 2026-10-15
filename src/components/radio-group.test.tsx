import { act, createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { RadioGroup, RadioGroupItem } from "./radio-group.js";

afterEach(cleanup);

describe("RadioGroup", () => {
  it("keeps native refs, labels, submission, and exclusive selection", () => {
    const ref = createRef<HTMLInputElement>();
    const changed = vi.fn();
    const view = render(
      <form>
        <RadioGroup name="choice" defaultValue="quiet" onValueChange={changed}>
          <label>
            <RadioGroupItem value="quiet" />
            Quiet
          </label>
          <label>
            <RadioGroupItem ref={ref} value="bold" className="custom-radio" />
            Bold
          </label>
        </RadioGroup>
      </form>,
    );
    const form = requireValue(view.container.querySelector("form"), "form");
    const input = requireValue(ref.current, "radio input");
    expect(input.classList.contains("custom-radio")).toBe(true);
    expect(new FormData(form).get("choice")).toBe("quiet");
    act(() => {
      input.click();
    });
    expect(changed).toHaveBeenCalledWith("bold");
    expect(new FormData(form).getAll("choice")).toEqual(["bold"]);
    expect(view.container.querySelectorAll("input:checked")).toHaveLength(1);
    expect(input.closest(".caps-radio")?.getAttribute("data-checked")).toBe(
      "true",
    );
    expect(input.labels?.[0]?.textContent).toBe("Bold");
  });

  it("honors group and individual disabled states", () => {
    const changed = vi.fn();
    const view = render(
      <>
        <RadioGroup defaultValue="quiet" onValueChange={changed}>
          <RadioGroupItem value="quiet" />
          <RadioGroupItem value="bold" disabled />
        </RadioGroup>
        <RadioGroup disabled onValueChange={changed}>
          <RadioGroupItem value="managed" />
        </RadioGroup>
      </>,
    );
    const disabled =
      view.container.querySelectorAll<HTMLInputElement>("input:disabled");
    expect(disabled).toHaveLength(2);
    act(() => {
      disabled.forEach((input) => {
        input.click();
      });
    });
    expect(changed).not.toHaveBeenCalled();
    expect(view.container.querySelectorAll("input:checked")).toHaveLength(1);
  });
});
