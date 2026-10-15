import { act, createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Field } from "./field.js";
import { IconCheckbox } from "./icon-checkbox.js";
import { IconRadio } from "./icon-radio.js";
import { RadioGroup } from "./radio-group.js";

afterEach(cleanup);

describe("icon choices", () => {
  it.each(["default", "compact"] as const)(
    "keeps the Checkbox owner, full label, Field wiring, native submission and reset (%s)",
    async (appearance) => {
      const ref = createRef<HTMLInputElement>();
      const changed = vi.fn();
      const view = render(
        <form>
          <Field description="Only this Computer" error="Ask its owner">
            <IconCheckbox
              ref={ref}
              appearance={appearance}
              label="Read files"
              caption="READ"
              icon={<svg />}
              name="access"
              value="read"
              defaultChecked
              onChange={changed}
            />
          </Field>
        </form>,
      );
      const input = requireValue(ref.current, "native checkbox");
      const form = requireValue(input.form, "form");
      expect(
        input.closest(".caps-checkbox")?.getAttribute("data-appearance"),
      ).toBe(appearance === "compact" ? "compact" : null);
      expect(input.type).toBe("checkbox");
      expect(input.hasAttribute("appearance")).toBe(false);
      expect(input.getAttribute("aria-label")).toBe("Read files");
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.getAttribute("aria-describedby")).toContain(
        `${input.id}-description`,
      );
      expect(input.getAttribute("aria-describedby")).toContain(
        `${input.id}-error`,
      );
      expect(
        view.container
          .querySelector(".caps-icon-choice-mark")
          ?.getAttribute("aria-hidden"),
      ).toBe("true");
      expect(new FormData(form).getAll("access")).toEqual(["read"]);
      act(() => {
        input.click();
      });
      expect(changed).toHaveBeenCalledTimes(1);
      expect(new FormData(form).has("access")).toBe(false);
      await act(async () => {
        form.reset();
        await Promise.resolve();
      });
      expect(input.checked).toBe(true);
      expect(input.closest(".caps-checkbox")?.getAttribute("data-state")).toBe(
        "checked",
      );
    },
  );

  it("uses RadioGroup selection and reset without another selection owner", async () => {
    const ref = createRef<HTMLInputElement>();
    const changed = vi.fn();
    const view = render(
      <form>
        <RadioGroup
          name="runtime"
          defaultValue="prints"
          onValueChange={changed}
        >
          <IconRadio value="prints" label="Prints" icon={<svg />} />
          <IconRadio
            ref={ref}
            value="inkcap"
            label="Inkcap"
            caption="INKCAP"
            icon={<svg />}
          />
        </RadioGroup>
      </form>,
    );
    const input = requireValue(ref.current, "native radio");
    const form = requireValue(input.form, "form");
    act(() => {
      input.click();
    });
    expect(changed).toHaveBeenCalledWith("inkcap");
    expect(new FormData(form).getAll("runtime")).toEqual(["inkcap"]);
    expect(view.container.querySelectorAll("input:checked")).toHaveLength(1);
    await act(async () => {
      form.reset();
      await Promise.resolve();
    });
    expect(new FormData(form).getAll("runtime")).toEqual(["prints"]);
    expect(input.checked).toBe(false);
    expect(input.closest(".caps-radio")?.getAttribute("data-checked")).toBe(
      "false",
    );
  });

  it.each(["default", "compact"] as const)(
    "keeps disabled and controlled mixed semantics on the input (%s)",
    (appearance) => {
      const changed = vi.fn();
      const view = render(
        <>
          <IconCheckbox
            appearance={appearance}
            label="Managed access"
            icon={<svg />}
            disabled
            onChange={changed}
          />
          <IconCheckbox
            appearance={appearance}
            label="Mixed access"
            icon={<svg />}
            checked={false}
            indeterminate
            onChange={changed}
          />
          <RadioGroup disabled>
            <IconRadio
              label="Managed runtime"
              value="prints"
              icon={<svg />}
              onChange={changed}
            />
          </RadioGroup>
        </>,
      );
      act(() => {
        view.container
          .querySelectorAll<HTMLInputElement>("input:disabled")
          .forEach((input) => {
            input.click();
          });
      });
      expect(changed).not.toHaveBeenCalled();
      const mixed = requireValue(
        view.container.querySelector<HTMLInputElement>(
          'input[aria-checked="mixed"]',
        ),
        "mixed checkbox",
      );
      act(() => {
        mixed.click();
      });
      expect(mixed.indeterminate).toBe(true);
      expect(mixed.checked).toBe(false);
    },
  );
});
