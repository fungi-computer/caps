// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Field } from "./field.js";
import { Input } from "./input.js";
import { InputGroup, InputGroupAddon } from "./input-group.js";

afterEach(cleanup);

describe("Field with an InputGroup", () => {
  it("labels the input inside the group, not the group", () => {
    const { container } = render(
      <Field label="Add USD credit" description="Top-ups start at $5.00.">
        <InputGroup>
          <InputGroupAddon>$</InputGroupAddon>
          <Input placeholder="5.00" />
        </InputGroup>
      </Field>,
    );
    const input = requireValue(container.querySelector("input"), "input");
    const label = requireValue(container.querySelector("label"), "label");
    expect(input.id).not.toBe("");
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toBe(
      `${input.id}-description`,
    );
    expect(
      container.querySelector(".caps-input-group")?.hasAttribute("id"),
    ).toBe(false);
    expect(container.querySelector(".caps-input-group")?.textContent).toBe("$");
  });
});
