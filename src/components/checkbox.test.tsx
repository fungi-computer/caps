import { act, createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Checkbox } from "./checkbox.js";

afterEach(cleanup);

describe("Checkbox", () => {
  it("keeps native form submission, labels, refs and reset for uncontrolled use", async () => {
    const ref = createRef<HTMLInputElement>();
    const changed = vi.fn();
    const view = render(
      <form>
        <label>
          <Checkbox
            ref={ref}
            name="choice"
            value="yes"
            defaultChecked
            className="custom"
            onChange={changed}
          />
          Keep it
        </label>
      </form>,
    );
    const input = requireValue(ref.current, "checkbox input");
    const form = requireValue(input.form, "form");
    expect(
      input.closest(".caps-checkbox")?.hasAttribute("data-appearance"),
    ).toBe(false);
    expect(input.classList.contains("custom")).toBe(true);
    expect(input.labels?.[0]?.textContent).toBe("Keep it");
    expect(new FormData(form).get("choice")).toBe("yes");
    act(() => {
      input.click();
    });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(new FormData(form).has("choice")).toBe(false);
    await act(async () => {
      form.reset();
      await Promise.resolve();
    });
    expect(input.checked).toBe(true);
    expect(
      view.container
        .querySelector(".caps-checkbox")
        ?.getAttribute("data-state"),
    ).toBe("checked");
  });

  it("keeps controlled state until the owner accepts the change", () => {
    const changed = vi.fn();
    const view = render(<Checkbox checked={false} onChange={changed} />);
    const input = requireValue(
      view.container.querySelector("input"),
      "checkbox input",
    );
    act(() => {
      input.click();
    });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(input.checked).toBe(false);
    expect(input.closest(".caps-checkbox")?.getAttribute("data-state")).toBe(
      "unchecked",
    );
  });

  it("projects mixed selection to the native input and clears it when its owner accepts", () => {
    function Example() {
      const [mixed, setMixed] = useState(true);
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          checked={checked}
          indeterminate={mixed}
          onChange={(event) => {
            setMixed(false);
            setChecked(event.currentTarget.checked);
          }}
        />
      );
    }
    const view = render(<Example />);
    const input = requireValue(
      view.container.querySelector("input"),
      "checkbox input",
    );
    expect(input.indeterminate).toBe(true);
    expect(input.getAttribute("aria-checked")).toBe("mixed");
    const mark = requireValue(
      view.container.querySelector("mask path"),
      "mixed mark",
    );
    expect(mark.hasAttribute("filter")).toBe(false);
    act(() => {
      input.click();
    });
    expect(input.indeterminate).toBe(false);
    expect(input.checked).toBe(true);
    expect(input.getAttribute("aria-checked")).toBe("true");
    expect(mark.getAttribute("filter")).toContain("-goo");
  });

  it("preserves a controlled mixed state when its owner does not accept", () => {
    const view = render(
      <Checkbox checked={false} indeterminate onChange={() => undefined} />,
    );
    const input = requireValue(
      view.container.querySelector("input"),
      "checkbox input",
    );
    act(() => {
      input.click();
    });
    expect(input.indeterminate).toBe(true);
    expect(input.checked).toBe(false);
    expect(input.closest(".caps-checkbox")?.getAttribute("data-state")).toBe(
      "mixed",
    );
  });

  it("keeps disabled and invalid semantics on the real input", () => {
    const changed = vi.fn();
    const view = render(<Checkbox disabled invalid onChange={changed} />);
    const input = requireValue(
      view.container.querySelector("input"),
      "checkbox input",
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");
    act(() => {
      input.click();
    });
    expect(changed).not.toHaveBeenCalled();
    expect(input.checked).toBe(false);
  });
});
