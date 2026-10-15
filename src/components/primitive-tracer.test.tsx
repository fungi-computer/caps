import { act, createRef, useState } from "react";
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanup,
  fireInput,
  fireKey,
  render,
  requireValue,
} from "../test-utils/index.js";
import { Button } from "./button.js";
import { Combobox } from "./combobox.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog.js";
import { Field } from "./field.js";
import { IconButton } from "./icon-button.js";
import { Input } from "./input.js";
import { Switch } from "./switch.js";

afterEach(cleanup);

describe("Caps primitive tracer", () => {
  it("lets caller classes override conflicting utilities and forwards native props/ref", () => {
    const ref = createRef<HTMLButtonElement>();
    const view = render(
      <Button className="transition-none" data-test="button" ref={ref}>
        Save
      </Button>,
    );
    const button = requireValue(
      view.container.querySelector<HTMLButtonElement>("button"),
      "Button root",
    );
    expect(button.dataset.test).toBe("button");
    expect(button.className).toContain("transition-none");
    expect(button.className).not.toContain("transition-colors");
    expect(ref.current).toBe(button);
  });

  it("provides an icon-size seam without losing an accessible name", () => {
    const view = render(
      <IconButton aria-label="Close" icon={<span>×</span>} iconSize="sm" />,
    );
    const button = requireValue(
      view.container.querySelector<HTMLButtonElement>("button"),
      "IconButton root",
    );
    expect(button.getAttribute("aria-label")).toBe("Close");
    expect(button.className).not.toContain("icon-size-sm");
    expect(button.querySelector("span")?.className).toContain(
      "var(--stipe-icon-size-sm)",
    );
  });

  it("maps retained Dashboard icon-button states without hiding native controls", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    const view = render(
      <div className="group">
        <IconButton
          aria-label="Actions"
          className="justify-self-end"
          data-icon-button="default"
          icon={<svg data-icon />}
          onClick={onClick}
          ref={ref}
        />
        <IconButton
          aria-label="Responsive action"
          data-icon-button="responsive"
          icon={<svg />}
          iconSize="xs"
          size="responsive"
        />
        <IconButton
          active
          aria-label="Active action"
          data-icon-button="active"
          icon={<svg />}
        />
        <IconButton
          aria-label="Revealed action"
          data-icon-button="reveal"
          icon={<svg />}
          reveal
        />
        <IconButton
          aria-label="Delete"
          data-icon-button="destructive"
          icon={<svg />}
          tone="destructive"
        />
        <IconButton
          aria-label="Unavailable action"
          data-icon-button="disabled"
          disabled
          icon={<svg />}
        />
      </div>,
    );

    const getButton = (state: string) =>
      requireValue(
        view.container.querySelector<HTMLButtonElement>(
          `[data-icon-button="${state}"]`,
        ),
        `${state} IconButton`,
      );
    const defaultButton = getButton("default");
    expect(defaultButton.getAttribute("aria-label")).toBe("Actions");
    expect(defaultButton.className.split(/\s+/)).toEqual(
      expect.arrayContaining([
        "btn-ghost",
        "caps-icon-button",
        "btn-circle",
        "btn-xs",
        "justify-self-end",
      ]),
    );
    expect(
      defaultButton.querySelector("[data-icon]")?.parentElement?.className,
    ).toContain("size-3");
    expect(ref.current).toBe(defaultButton);
    act(() => {
      defaultButton.click();
    });
    expect(onClick).toHaveBeenCalledOnce();

    expect(getButton("responsive").className.split(/\s+/)).toEqual(
      expect.arrayContaining(["btn-sm", "md:btn-xs"]),
    );
    expect(getButton("active").className.split(/\s+/)).toContain("text-accent");

    const revealedButton = getButton("reveal");
    const revealClasses = revealedButton.className.split(/\s+/);
    expect(revealClasses).toEqual(
      expect.arrayContaining([
        "scale-0",
        "group-hover:scale-100",
        "focus-visible:scale-100",
      ]),
    );
    expect(
      revealClasses.some((className) => className.includes("opacity")),
    ).toBe(false);
    act(() => {
      revealedButton.focus();
    });
    expect(document.activeElement).toBe(revealedButton);

    expect(getButton("destructive").className.split(/\s+/)).toContain(
      "hover:text-error",
    );
    const disabledButton = getButton("disabled");
    expect(disabledButton.disabled).toBe(true);
    // A disabled ghost icon button stays faceless: no plate, no outline.
    expect(
      disabledButton.className
        .split(/\s+/)
        .some((className) => /^disabled:(outline|bg|border)/.test(className)),
    ).toBe(false);
    expect(
      disabledButton.className
        .split(/\s+/)
        .some((className) => className.startsWith("disabled:opacity")),
    ).toBe(false);
  });

  it("composes links through the Slot without changing the child element", () => {
    const view = render(
      <Button asChild variant="link">
        <a href="/docs">Docs</a>
      </Button>,
    );
    const link = requireValue(
      view.container.querySelector<HTMLAnchorElement>("a"),
      "Button-composed link",
    );
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.className).toContain("btn-link");
  });

  it("associates Field labels, descriptions, and errors with the native control", () => {
    const view = render(
      <Field error="Required" label="Name">
        <Input />
      </Field>,
    );
    const input = requireValue(
      view.container.querySelector<HTMLInputElement>("input"),
      "Field input",
    );
    const label = requireValue(
      view.container.querySelector<HTMLLabelElement>("label"),
      "Field label",
    );
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain(
      `${input.id}-error`,
    );
    const error = view.container.querySelector('[role="alert"]');
    expect(
      error?.closest(".caps-field-error-reveal")?.previousElementSibling,
    ).toBe(input);
    expect(label.textContent).toBe("Name");
    expect(error?.textContent).toBe("Required");
  });

  it("collapses absent errors and keeps guidance above the control", () => {
    const view = render(
      <Field label="Name" description="Choose a unique name.">
        <Input />
      </Field>,
    );
    const input = requireValue(view.container.querySelector("input"), "input");
    const error = requireValue(
      view.container.querySelector('[role="alert"]'),
      "error slot",
    );
    expect(error.textContent).toBe("");
    expect(
      error.closest(".caps-field-error-reveal")?.previousElementSibling,
    ).toBe(input);
    expect(
      error.closest(".caps-field-error-reveal")?.getAttribute("data-open"),
    ).toBe("false");
    expect(error.getAttribute("aria-hidden")).toBe("true");
    expect(input.previousElementSibling?.textContent).toContain(
      "Choose a unique name.",
    );
    expect(input.getAttribute("aria-describedby")).toBe(
      `${input.id}-description`,
    );
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("keeps horizontal Field copy together and describes the native switch", () => {
    const view = render(
      <Field
        label="Updates"
        description="Only important changes."
        orientation="horizontal"
      >
        <Switch id="updates" defaultChecked />
      </Field>,
    );
    const input = requireValue(
      view.container.querySelector<HTMLInputElement>("input"),
      "Switch input",
    );
    const label = requireValue(
      view.container.querySelector<HTMLLabelElement>("label"),
      "Switch label",
    );
    const description = requireValue(
      view.container.querySelector("#updates-description"),
      "Switch description",
    );
    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toBe(description.id);
    expect(label.closest(".caps-field-copy")).toBe(description.parentElement);
    expect(label.parentElement?.className).toBe("caps-field-copy");
    expect(
      view.container
        .querySelector(".caps-field")
        ?.getAttribute("data-orientation"),
    ).toBe("horizontal");
  });

  it("passes required through Field to the native control", () => {
    const view = render(
      <Field label="Name" required>
        <Input />
      </Field>,
    );
    const input = requireValue(
      view.container.querySelector<HTMLInputElement>("input"),
      "required Field input",
    );
    expect(input.required).toBe(true);
  });

  it("closes a controlled dialog on Escape and keeps title/description relations", () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog onOpenChange={onOpenChange} open>
        <DialogContent>
          <DialogTitle>Confirm</DialogTitle>
          <DialogDescription>Details</DialogDescription>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>,
    );
    const dialog = requireValue(
      document.body.querySelector(".caps-dialog-popup"),
      "controlled Dialog panel",
    );
    expect(dialog.getAttribute("aria-labelledby")).toBe(
      dialog.querySelector("h2")?.id,
    );
    expect(dialog.getAttribute("aria-describedby")).toBe(
      dialog.querySelector("p")?.id,
    );
    act(() => {
      fireKey(dialog, { key: "Escape" });
    });
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
  });

  it("keeps dialog backdrop beside, not inside, the panel and closes once", () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog onOpenChange={onOpenChange} open>
        <DialogContent>
          <DialogTitle>Confirm</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const panel = requireValue(
      document.body.querySelector(".caps-dialog-popup"),
      "Dialog panel",
    );
    const backdrop = requireValue(
      document.body.querySelector<HTMLButtonElement>(".caps-dialog-backdrop"),
      "Dialog backdrop",
    );
    expect(backdrop.parentElement).toBe(panel.parentElement);
    expect(panel.contains(backdrop)).toBe(false);
    act(() => {
      backdrop.click();
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it("does not point at a missing dialog description", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Confirm</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const panel = requireValue(
      document.body.querySelector(".caps-dialog-popup"),
      "Dialog panel without a description",
    );
    expect(panel.getAttribute("aria-describedby")).toBeNull();
  });

  it("supports generic listbox keyboard selection and controlled values", () => {
    const onValueChange = vi.fn();
    const view = render(
      <Combobox
        getKey={(item) => item.id}
        getLabel={(item) => item.name}
        items={[
          { id: "a", name: "Alpha" },
          { id: "b", name: "Beta" },
        ]}
        onValueChange={onValueChange}
        trigger={<button type="button">Open</button>}
      />,
    );
    const trigger = requireValue(
      view.container.querySelector<HTMLButtonElement>("button"),
      "Combobox trigger",
    );
    act(() => {
      trigger.click();
    });
    const input = requireValue(
      document.querySelector<HTMLInputElement>('[role="combobox"]'),
      "Combobox input",
    );
    act(() => {
      input.focus();
      fireKey(input, { key: "ArrowDown" });
      fireKey(input, { key: "Enter" });
    });
    expect(onValueChange).toHaveBeenCalledWith("a", { id: "a", name: "Alpha" });
  });

  it("keeps the active item identity when the host reorders options", () => {
    const onValueChange = vi.fn();
    let reorder: (() => void) | undefined;
    function ReorderHarness() {
      const [items, setItems] = useState([
        { id: "a", name: "Alpha" },
        { id: "b", name: "Beta" },
      ]);
      reorder = () => {
        setItems([...items].reverse());
      };
      return (
        <Combobox
          getKey={(item) => item.id}
          getLabel={(item) => item.name}
          id="stable"
          items={items}
          onValueChange={onValueChange}
          trigger={<button type="button">Open</button>}
        />
      );
    }
    const view = render(<ReorderHarness />);
    const trigger = requireValue(
      view.container.querySelector<HTMLButtonElement>("button"),
      "reorder Combobox trigger",
    );
    act(() => {
      trigger.click();
    });
    const input = requireValue(
      document.querySelector<HTMLInputElement>('[role="combobox"]'),
      "reorder Combobox input",
    );
    act(() => {
      input.focus();
      fireKey(input, { key: "ArrowDown" });
    });
    const activeId = input.getAttribute("aria-activedescendant");
    expect(activeId).toBe("stable-listbox-option-b");
    act(() => reorder?.());
    expect(input.getAttribute("aria-activedescendant")).toBe(activeId);
    act(() => {
      fireKey(input, { key: "Enter" });
    });
    expect(onValueChange).toHaveBeenCalledWith("b", {
      id: "b",
      name: "Beta",
    });
  });

  it("keeps an intentionally empty query empty and preserves native Enter", () => {
    const view = render(
      <Combobox
        getKey={(item) => item.id}
        getLabel={(item) => item.name}
        items={[{ id: "a", name: "Alpha" }]}
        trigger={<button type="button">Open</button>}
        value="a"
      />,
    );
    const trigger = requireValue(
      view.container.querySelector<HTMLButtonElement>("button"),
      "empty-query Combobox trigger",
    );
    act(() => {
      trigger.click();
    });
    const input = requireValue(
      document.querySelector<HTMLInputElement>('[role="combobox"]'),
      "empty-query Combobox input",
    );
    act(() => {
      input.focus();
      fireInput(input, "");
    });
    expect(input.value).toBe("");
    const enter = fireKey(input, { key: "Enter" });
    expect(enter.defaultPrevented).toBe(true);
  });

  it("keeps null controlled with no selected item", () => {
    const view = render(
      <Combobox
        getKey={(item) => item.id}
        getLabel={(item) => item.name}
        items={[{ id: "a", name: "Alpha" }]}
        trigger={<button type="button">Open</button>}
        value={null}
      />,
    );
    const trigger = requireValue(
      view.container.querySelector<HTMLButtonElement>("button"),
      "null-controlled Combobox trigger",
    );
    act(() => {
      trigger.click();
    });
    const input = requireValue(
      document.querySelector<HTMLInputElement>('[role="combobox"]'),
      "null-controlled Combobox input",
    );
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.value).toBe("");
  });
});
