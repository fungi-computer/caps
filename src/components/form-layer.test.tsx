// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Checkbox } from "./checkbox.js";
import { Field, FieldSet, Form, FormFooter, FormSection } from "./field.js";
import { Input } from "./input.js";
import { RadioGroup, RadioGroupCard } from "./radio-group.js";

afterEach(cleanup);

describe("Caps form layer", () => {
  it("disables every control while a Form is busy", () => {
    const { container } = render(
      <Form aria-label="Settings" busy>
        <Field label="Name">
          <Input />
        </Field>
        <FormFooter>
          <button type="submit">Save</button>
        </FormFooter>
      </Form>,
    );
    const form = requireValue(container.querySelector("form"), "form");
    expect(form.getAttribute("aria-busy")).toBe("true");
    expect(
      requireValue(form.querySelector("fieldset"), "fieldset").disabled,
    ).toBe(true);
  });

  it("names a FormSection by its title", () => {
    const { container } = render(
      <FormSection title="Access" description="Who can reach it.">
        <Field label="Name">
          <Input />
        </Field>
      </FormSection>,
    );
    const section = requireValue(container.querySelector("section"), "section");
    const heading = requireValue(section.querySelector("h3"), "heading");
    expect(heading.textContent).toBe("Access");
    expect(section.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("marks optional fields and keeps the caller's description id", () => {
    const { container } = render(
      <Field label="Notes" optional description="Only your Team sees these.">
        <Input aria-describedby="outside-hint" />
      </Field>,
    );
    const input = requireValue(container.querySelector("input"), "input");
    expect(container.querySelector("label")?.textContent).toBe("NotesOptional");
    expect(input.getAttribute("aria-describedby")).toBe(
      `outside-hint ${input.id}-description`,
    );
  });

  it("names a FieldSet by its legend and disables its choices", () => {
    const { container } = render(
      <FieldSet legend="Rights" description="Shared by every Agent." disabled>
        <Field orientation="inline" label="Read files">
          <Checkbox />
        </Field>
      </FieldSet>,
    );
    const set = requireValue(container.querySelector("fieldset"), "fieldset");
    expect(set.querySelector("legend")?.textContent).toBe("Rights");
    expect(set.getAttribute("aria-describedby")).toBe(
      set.querySelector("p")?.id,
    );
    expect(set.disabled).toBe(true);
  });

  it("puts an inline control before its label", () => {
    const { container } = render(
      <Field orientation="inline" label="Email me" error="Required">
        <Checkbox />
      </Field>,
    );
    const row = requireValue(
      container.querySelector(".caps-field-row"),
      "field row",
    );
    expect(row.firstElementChild?.classList.contains("caps-checkbox")).toBe(
      true,
    );
    const input = requireValue(container.querySelector("input"), "input");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(`${input.id}-error`);
  });

  it("leads a field with a decorative icon that never names the control", () => {
    const { container } = render(
      <Field
        orientation="horizontal"
        icon={<svg data-testid="marker" />}
        label="Inbox"
        description="Grove opens new mail."
      >
        <Input />
      </Field>,
    );
    const lead = requireValue(
      container.querySelector(".caps-field-row > .caps-field-lead"),
      "field lead",
    );
    const icon = requireValue(
      lead.querySelector(".caps-field-icon"),
      "field icon",
    );
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.querySelector("[data-testid=marker]")).not.toBeNull();
    expect(lead.querySelector(".caps-field-copy label")?.textContent).toBe(
      "Inbox",
    );
    const input = requireValue(container.querySelector("input"), "input");
    expect(
      container.querySelector(`label[for="${input.id}"]`)?.textContent,
    ).toBe("Inbox");
  });

  it("names a readout row without wiring the label to the readout", () => {
    const { container } = render(
      <Field orientation="horizontal" readout label="Tracker">
        <span role="status">Not enabled</span>
      </Field>,
    );
    const label = requireValue(container.querySelector("label"), "label");
    expect(label.hasAttribute("for")).toBe(false);
    const status = requireValue(
      container.querySelector('[role="status"]'),
      "status",
    );
    expect(status.hasAttribute("id")).toBe(false);
    expect(status.hasAttribute("aria-describedby")).toBe(false);
  });

  it("keeps a field without an icon free of the lead wrapper", () => {
    const { container } = render(
      <Field orientation="horizontal" label="Inbox">
        <Input />
      </Field>,
    );
    expect(container.querySelector(".caps-field-lead")).toBeNull();
    expect(
      container.querySelector(".caps-field-row > .caps-field-copy"),
    ).not.toBeNull();
  });

  it("names a RadioGroupCard by its title and describes it by its copy", () => {
    const { container } = render(
      <RadioGroup aria-label="Size" defaultValue="small">
        <RadioGroupCard value="small" title="Small" description="Light Apps." />
        <RadioGroupCard value="large" title="Large" meta="16 GB" />
      </RadioGroup>,
    );
    const [small, large] = container.querySelectorAll("input");
    if (!small || !large) throw new Error("radios missing");
    expect(document.getElementById(`${small.id}-title`)?.textContent).toBe(
      "Small",
    );
    expect(small.getAttribute("aria-labelledby")).toBe(`${small.id}-title`);
    expect(small).toHaveProperty("checked", true);
    expect(
      requireValue(
        small.getAttribute("aria-describedby"),
        "description reference",
      ),
    ).toBe(`${small.id}-description`);
    expect(
      small.closest(".caps-choice-card")?.getAttribute("data-checked"),
    ).toBe("true");
    expect(large).toHaveProperty("checked", false);
    expect(large.hasAttribute("aria-describedby")).toBe(false);
  });

  it("seats footer status opposite the actions", () => {
    const { container } = render(
      <FormFooter layout="stretch" divider={false} status="Saved">
        <button type="submit">Save</button>
      </FormFooter>,
    );
    const footer = requireValue(container.querySelector("footer"), "footer");
    expect(footer.dataset.layout).toBe("stretch");
    expect(footer.dataset.divider).toBe("false");
    expect(footer.querySelector(".caps-form-footer-status")?.textContent).toBe(
      "Saved",
    );
  });
});
