// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanup,
  fireInput,
  fireKey,
  render,
  requireValue,
} from "../test-utils/index.js";
import { Field, NumberField } from "./field.js";

afterEach(cleanup);

function press(input: HTMLInputElement, key: string) {
  act(() => {
    fireKey(input, { key });
  });
}

function parts(container: HTMLElement) {
  const input = requireValue(
    container.querySelector<HTMLInputElement>("input"),
    "input",
  );
  const [decrement, increment] = container.querySelectorAll("button");
  if (!decrement || !increment) throw new Error("stepper keys missing");
  return { input, decrement, increment };
}

describe("NumberField", () => {
  it("is a native spinbutton that Field labels, describes and invalidates", () => {
    const { container } = render(
      <Field
        label="Sleep after"
        description="Minutes without activity."
        error="Use at most 120."
      >
        <NumberField min={5} max={120} step={5} unit="min" defaultValue={30} />
      </Field>,
    );
    const { input, decrement, increment } = parts(container);
    expect(input.type).toBe("number");
    expect(input.min).toBe("5");
    expect(input.max).toBe("120");
    expect(input.step).toBe("5");
    expect(input.inputMode).toBe("numeric");
    expect(input.value).toBe("30");
    expect(container.querySelector("label")?.getAttribute("for")).toBe(
      input.id,
    );
    expect(input.getAttribute("aria-describedby")).toBe(
      `${input.id}-description ${input.id}-error`,
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(decrement.getAttribute("aria-label")).toBe("Decrease");
    expect(increment.getAttribute("aria-label")).toBe("Increase");
    expect(
      container.querySelector(".caps-number-field-unit")?.textContent,
    ).toBe("min");
  });

  it("steps with the keys and the keyboard, clamped to min and max", () => {
    const onValueChange = vi.fn<(value: number | null) => void>();
    const { container } = render(
      <NumberField
        aria-label="Seats"
        min={0}
        max={20}
        step={2}
        defaultValue={4}
        onValueChange={onValueChange}
      />,
    );
    const { input, decrement, increment } = parts(container);
    act(() => {
      increment.click();
    });
    expect(input.value).toBe("6");
    press(input, "ArrowDown");
    expect(input.value).toBe("4");
    press(input, "PageUp");
    expect(input.value).toBe("20");
    expect(increment.disabled).toBe(true);
    press(input, "Home");
    expect(input.value).toBe("0");
    expect(decrement.disabled).toBe(true);
    press(input, "End");
    expect(input.value).toBe("20");
    expect(onValueChange.mock.calls).toEqual([[6], [4], [20], [0], [20]]);
  });

  it("lets a typed value through and clamps it on blur", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <NumberField
        aria-label="Quota"
        min={5}
        max={50}
        onValueChange={onValueChange}
      />,
    );
    const { input } = parts(container);
    expect(input.value).toBe("");
    act(() => {
      fireInput(input, "2");
    });
    expect(input.value).toBe("2");
    expect(onValueChange).not.toHaveBeenCalled();
    act(() => {
      input.dispatchEvent(new window.FocusEvent("focusout", { bubbles: true }));
    });
    expect(input.value).toBe("5");
    expect(onValueChange).toHaveBeenLastCalledWith(5);
  });

  it("wraps at the ends when asked", () => {
    const { container } = render(
      <NumberField aria-label="Hour" min={0} max={23} wrap defaultValue={23} />,
    );
    const { input, increment } = parts(container);
    expect(increment.disabled).toBe(false);
    act(() => {
      increment.click();
    });
    expect(input.value).toBe("0");
    press(input, "ArrowDown");
    expect(input.value).toBe("23");
  });

  it("disables the input and both keys together", () => {
    const { container } = render(
      <NumberField aria-label="Seats" disabled defaultValue={3} />,
    );
    const { input, decrement, increment } = parts(container);
    expect(input.disabled).toBe(true);
    expect(decrement.disabled).toBe(true);
    expect(increment.disabled).toBe(true);
    expect(
      container
        .querySelector(".caps-number-field")
        ?.hasAttribute("data-disabled"),
    ).toBe(true);
  });
});
