// @vitest-environment jsdom
import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { act } from "react";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { Form } from "./components/field.js";
import { Input } from "./components/input.js";
import {
  FormField,
  SubmitFooter,
  effectValidator,
  fieldError,
} from "./form.js";
import {
  cleanup,
  fireInput,
  render,
  requireValue,
} from "./test-utils/index.js";

afterEach(cleanup);

const nameSchema = Schema.String.check(Schema.isMinLength(2));
const profileSchema = Schema.Struct({
  profile: Schema.Struct({ name: nameSchema }),
});

function Profile({
  save,
  initialName = "Levi",
}: {
  save: (name: string) => Promise<void>;
  initialName?: string;
}) {
  const form = useForm({
    defaultValues: { profile: { name: initialName } },
    validators: {
      onChange: effectValidator(profileSchema),
      onSubmit: effectValidator(profileSchema),
    },
    onSubmit: async ({ value }) => save(value.profile.name),
  });
  return (
    <Form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.state.isSubmitting) void form.handleSubmit();
      }}
    >
      <FormField
        form={form}
        name="profile.name"
        label="Name"
        description="Your displayed name"
        required
      >
        {(field) => {
          expectTypeOf(field.state.value).toEqualTypeOf<string>();
          return (
            <Input
              id="profile-name"
              name={field.name}
              value={field.state.value}
              aria-describedby="external-hint"
              onBlur={field.handleBlur}
              onChange={(event) => {
                field.handleChange(event.currentTarget.value);
              }}
            />
          );
        }}
      </FormField>
      <SubmitFooter form={form} label="Save" />
    </Form>
  );
}

describe("form bindings", () => {
  it("selects a readable string or issue without stringifying unknown errors", () => {
    expect(
      fieldError({ errors: [undefined, null, {}, false, "", { message: 1 }] }),
    ).toBeUndefined();
    expect(fieldError({ errors: ["Required", { message: "Too short" }] })).toBe(
      "Required",
    );
    expect(
      fieldError({ errors: [null, { message: "Too short", path: ["name"] }] }),
    ).toBe("Too short");
  });

  it("prefers schema message annotations over generated check descriptions", async () => {
    const validator = effectValidator(
      Schema.Number.check(
        Schema.isBetween(
          { minimum: 1, maximum: 65_535 },
          { message: "Use a port from 1 to 65535." },
        ),
      ),
    );
    const invalid = await validator["~standard"].validate(65_536);
    expect(fieldError({ errors: invalid.issues ?? [] })).toBe(
      "Use a port from 1 to 65535.",
    );
  });

  it("preserves Effect decoding and nested issue paths through Standard Schema", async () => {
    const validator = effectValidator(profileSchema);
    const invalid = await validator["~standard"].validate({
      profile: { name: "" },
    });
    expect(invalid.issues?.[0]?.path).toEqual(["profile", "name"]);
    const decoded = await effectValidator(Schema.NumberFromString)[
      "~standard"
    ].validate("42");
    expect(decoded).toEqual({ value: 42 });
  });

  it("connects nested schema errors to the control and clears them on correction", async () => {
    const save = vi.fn(() => Promise.resolve());
    const { container } = render(<Profile save={save} />);
    const input = requireValue(container.querySelector("input"), "name input");
    const button = requireValue(
      container.querySelector("button"),
      "save button",
    );
    expect(container.querySelector("label")?.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toBe(
      "external-hint profile-name-description",
    );
    await act(async () => {
      fireInput(input, "");
      await Promise.resolve();
    });
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    await act(async () => {
      input.focus();
      input.blur();
      await Promise.resolve();
    });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      "external-hint profile-name-description profile-name-error",
    );
    expect(container.querySelector('[role="alert"]')?.textContent).not.toBe("");
    expect(button.disabled).toBe(true);
    await act(async () => {
      container.querySelector("form")?.requestSubmit();
      await Promise.resolve();
    });
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      fireInput(input, "River");
      await Promise.resolve();
    });
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.getAttribute("aria-describedby")).toBe(
      "external-hint profile-name-description",
    );
    expect(button.disabled).toBe(false);
    await act(async () => {
      button.click();
      await Promise.resolve();
    });
    expect(save).toHaveBeenCalledExactlyOnceWith("River");
  });

  it("reveals submit-time errors without requiring a prior blur", async () => {
    const save = vi.fn(() => Promise.resolve());
    const { container } = render(<Profile save={save} initialName="" />);
    const input = requireValue(container.querySelector("input"), "name input");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    await act(async () => {
      container.querySelector("button")?.click();
      await Promise.resolve();
    });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(save).not.toHaveBeenCalled();
  });

  it("keeps submission busy until the async action finishes and prevents duplicates", async () => {
    let finish: (() => void) | undefined;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const save = vi.fn(() => pending);
    const { container } = render(<Profile save={save} />);
    const button = requireValue(
      container.querySelector("button"),
      "save button",
    );
    await act(async () => {
      button.click();
      await Promise.resolve();
    });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    await act(async () => {
      container.querySelector("form")?.requestSubmit();
      await Promise.resolve();
    });
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => {
      requireValue(finish, "pending save resolver")();
      await Promise.resolve();
    });
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute("aria-busy")).toBe(false);
  });

  it("accepts native field validators and reports their blur errors", async () => {
    function FieldValidation() {
      const form = useForm({ defaultValues: { name: "" } });
      return (
        <FormField
          form={form}
          name="name"
          label="Name"
          validators={{
            onBlur: ({ value }) => (value ? undefined : "Required"),
          }}
        >
          {(field) => (
            <Input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => {
                field.handleChange(event.currentTarget.value);
              }}
            />
          )}
        </FormField>
      );
    }
    const { container } = render(<FieldValidation />);
    const input = requireValue(container.querySelector("input"), "input");
    await act(async () => {
      input.focus();
      input.blur();
      await Promise.resolve();
    });
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "Required",
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});
