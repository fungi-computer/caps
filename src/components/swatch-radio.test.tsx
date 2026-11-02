import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { FieldSet } from "./field.js";
import { IconRadio, SwatchRadio } from "./icon-radio.js";
import { CheckKey, CheckKeys } from "./icon-checkbox.js";
import { KeycapButton } from "./keycap.js";
import { RadioGroup } from "./radio-group.js";

afterEach(cleanup);

describe("colour and character keys", () => {
  it("names each swatch, keeps its colour, and submits the chosen name", () => {
    const changed = vi.fn();
    const view = render(
      <form>
        <FieldSet legend="Colour" icon={<svg data-testid="marker" />}>
          <RadioGroup name="colour" value="Rose" onValueChange={changed}>
            <SwatchRadio value="Rose" label="Rose" color="#f98284" />
            <SwatchRadio value="Sky" label="Sky" color="#6aaee8" />
          </RadioGroup>
        </FieldSet>
      </form>,
    );
    const sky = requireValue(
      view.container.querySelector<HTMLInputElement>('input[value="Sky"]'),
      "Sky swatch",
    );
    expect(sky.getAttribute("aria-label")).toBe("Sky");
    const key = requireValue(sky.closest("label"), "swatch key");
    expect(key.getAttribute("data-swatch")).toBe("");
    expect(key.getAttribute("data-art")).toBe("color");
    expect(key.title).toBe("Sky");
    expect(
      key.querySelector<HTMLElement>(".caps-swatch-dot")?.style.backgroundColor,
    ).toBe("rgb(106, 174, 232)");
    // The legend's marker is decorative; the legend text names the group.
    const legend = requireValue(
      view.container.querySelector("legend"),
      "legend",
    );
    expect(legend.textContent).toBe("Colour");
    expect(
      legend.querySelector(".caps-field-icon")?.getAttribute("aria-hidden"),
    ).toBe("true");
    act(() => {
      sky.click();
    });
    expect(changed).toHaveBeenCalledWith("Sky");
  });

  it("keeps an icon key's art in colour only when asked", () => {
    const view = render(
      <RadioGroup name="character" value="cat">
        <IconRadio value="cat" label="Cat" icon={<svg />} art="color" />
        <IconRadio value="burger" label="Burger" icon={<svg />} />
      </RadioGroup>,
    );
    const art = [...view.container.querySelectorAll(".caps-icon-choice")].map(
      (key) => key.getAttribute("data-art"),
    );
    expect(art).toEqual(["color", null]);
  });

  it("marks a compact keycap for the details-panel size", () => {
    const view = render(
      <>
        <KeycapButton label="Start" density="compact" />
        <KeycapButton label="Stop" />
      </>,
    );
    expect(
      [...view.container.querySelectorAll("button")].map((button) =>
        button.getAttribute("data-density"),
      ),
    ).toEqual(["compact", null]);
  });

  it("draws a check key whose native checkbox names, describes and submits it", () => {
    const changed = vi.fn();
    const view = render(
      <form>
        <CheckKeys>
          <CheckKey
            name="grant"
            value="read"
            label="Read Apps"
            hint="See Apps and their data"
            icon={<svg data-testid="sigil" />}
            defaultChecked
            onChange={changed}
          />
          <CheckKey name="grant" value="use" label="Use Apps" />
        </CheckKeys>
      </form>,
    );
    const [read, use] = [
      ...view.container.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      ),
    ];
    const first = requireValue(read, "Read Apps key");
    const second = requireValue(use, "Use Apps key");
    expect(first.getAttribute("aria-label")).toBe("Read Apps");
    const hint = requireValue(
      view.container.querySelector(".caps-check-key-hint"),
      "hint",
    );
    expect(first.getAttribute("aria-describedby")).toBe(hint.id);
    expect(second.hasAttribute("aria-describedby")).toBe(false);
    expect(view.container.querySelector(".caps-check-keys")).not.toBeNull();
    const form = requireValue(first.form, "form");
    expect(new FormData(form).getAll("grant")).toEqual(["read"]);
    act(() => {
      second.click();
    });
    expect(new FormData(form).getAll("grant")).toEqual(["read", "use"]);
    act(() => {
      first.click();
    });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(new FormData(form).getAll("grant")).toEqual(["use"]);
  });
});
