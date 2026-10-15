import { act, createRef, useState } from "react";
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";

import {
  cleanup,
  fireInput,
  fireKey,
  render,
  requireValue,
} from "../test-utils/index.js";
import { Combobox, ComboboxTrigger } from "./combobox.js";
import { Field } from "./field.js";
import { StatusBarPicker } from "../blocks/app-status-bar.js";

afterEach(cleanup);

it("toggles multiple selections without closing and keeps them through search", () => {
  function MultiPicker() {
    const [value, setValue] = useState<string[]>(["apple"]);
    return (
      <Combobox
        multiple
        value={value}
        onValueChange={setValue}
        items={options}
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        trigger={<button type="button">Choose several</button>}
      />
    );
  }
  const view = render(<MultiPicker />);
  act(() => {
    requireValue(view.container.querySelector("button"), "trigger").click();
  });
  const input = requireValue(
    document.querySelector<HTMLInputElement>('[role="combobox"]'),
    "search",
  );
  expect(
    document
      .querySelector('[role="listbox"]')
      ?.getAttribute("aria-multiselectable"),
  ).toBe("true");
  expect(
    document.querySelector('[role="option"][data-active="true"]'),
  ).toBeNull();
  act(() => {
    fireInput(input, "Banana");
  });
  act(() => {
    fireKey(input, { key: "ArrowDown" });
  });
  expect(
    document.querySelector('[role="option"][data-active="true"]'),
  ).not.toBeNull();
  act(() => {
    fireKey(input, { key: "Enter" });
  });
  expect(
    document
      .querySelector('[role="option"][id$="banana"]')
      ?.getAttribute("aria-selected"),
  ).toBe("true");
  expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  act(() => {
    fireInput(input, "");
  });
  expect(
    document
      .querySelector('[role="option"][id$="apple"]')
      ?.getAttribute("aria-selected"),
  ).toBe("true");
  act(() => {
    requireValue(
      document.querySelector<HTMLButtonElement>('[role="option"][id$="apple"]'),
      "apple",
    ).click();
  });
  expect(
    document
      .querySelector('[role="option"][id$="apple"]')
      ?.getAttribute("aria-selected"),
  ).toBe("false");
  expect(
    document
      .querySelector('[role="option"][id$="banana"]')
      ?.getAttribute("aria-selected"),
  ).toBe("true");
});

const options = [
  { group: "Fruits", id: "apple", label: "Apple" },
  { group: "Fruits", id: "banana", label: "Banana" },
  { group: "Vegetables", id: "carrot", label: "Carrot" },
];

// Keep the two mode boundaries honest at the call site. These probes are
// compile-time contracts; they should never become runtime compatibility
// branches.
function comboboxTypeProbes() {
  <Combobox
    defaultValue="apple"
    getKey={(item: (typeof options)[number]) => item.id}
    getLabel={(item: (typeof options)[number]) => item.label}
    items={options}
  />;
  <Combobox
    getKey={(item: (typeof options)[number]) => item.id}
    getLabel={(item: (typeof options)[number]) => item.label}
    items={options}
    value="apple"
  />;
  // @ts-expect-error controlled and uncontrolled selection modes are exclusive
  <Combobox
    defaultValue="apple"
    getKey={(item: (typeof options)[number]) => item.id}
    getLabel={(item: (typeof options)[number]) => item.label}
    items={options}
    value="banana"
  />;
  // @ts-expect-error inline mode does not expose popup open controls
  <Combobox
    defaultOpen
    getKey={(item: (typeof options)[number]) => item.id}
    getLabel={(item: (typeof options)[number]) => item.label}
    items={options}
  />;
  // @ts-expect-error popup controlled and uncontrolled open modes are exclusive
  <Combobox
    defaultOpen
    getKey={(item: (typeof options)[number]) => item.id}
    getLabel={(item: (typeof options)[number]) => item.label}
    items={options}
    open
    trigger={<button type="button">Choose</button>}
  />;
}
void comboboxTypeProbes;

it("renders inline root props/ref, input ref, and listbox semantics", () => {
  const rootRef = createRef<HTMLDivElement>();
  const inputRef = createRef<HTMLInputElement>();
  const onClick = vi.fn();
  const view = render(
    <Combobox
      activeTone="primary"
      className="picker-root"
      contentClassName="picker-content"
      data-owner="picker"
      getKey={(item) => item.id}
      getLabel={(item) => item.label}
      groupBy={(item) => item.group}
      id="picker"
      inputRef={inputRef}
      items={options}
      onClick={onClick}
      rootRef={rootRef}
      style={{ color: "red" }}
    />,
  );
  const root = requireValue(
    view.queryBySelector(".picker-root"),
    "Combobox root",
  );
  expect(
    root
      .querySelector(".caps-combobox-panel")
      ?.getAttribute("data-active-tone"),
  ).toBe("primary");
  expect(root.hasAttribute("activeTone")).toBe(false);
  const input = requireValue(
    view.container.querySelector<HTMLInputElement>('[role="combobox"]'),
    "Combobox input",
  );
  const listbox = requireValue(
    view.queryBySelector('[role="listbox"]'),
    "Combobox listbox",
  );

  expect(root.className).toContain("picker-root");
  expect(root.dataset.owner).toBe("picker");
  expect(root.style.color).toBe("red");
  expect(view.queryBySelector(".picker-content")).not.toBe(root);
  expect(rootRef.current).toBe(root);
  expect(inputRef.current).toBe(input);
  expect(input.id).toBe("picker");
  expect(input.getAttribute("aria-controls")).toBe(listbox.id);
  expect(input.getAttribute("aria-expanded")).toBe("true");
  expect(input.getAttribute("aria-activedescendant")).toBe(
    `${listbox.id}-option-apple`,
  );
  expect(view.container.querySelectorAll('[role="group"]')).toHaveLength(2);
  expect(view.container.querySelectorAll('[role="option"]')).toHaveLength(3);

  act(() => {
    root.click();
  });
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("uses a dialog popup trigger ref and closes after a commit", () => {
  const rootRef = createRef<HTMLDivElement>();
  const triggerRef = createRef<HTMLButtonElement>();
  const onOpenChange = vi.fn();
  const onValueChange = vi.fn();
  const view = render(
    <Combobox
      getKey={(item) => item.id}
      getLabel={(item) => item.label}
      items={options}
      onOpenChange={onOpenChange}
      onValueChange={onValueChange}
      rootRef={rootRef}
      trigger={<button type="button">Choose</button>}
      triggerRef={triggerRef}
    />,
  );
  const trigger = requireValue(
    view.container.querySelector("button"),
    "Combobox trigger",
  );
  const root = view.container.firstElementChild;
  expect(rootRef.current).toBe(root);
  expect(rootRef.current).not.toBe(trigger);
  expect(triggerRef.current).toBe(trigger);
  expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");

  act(() => {
    trigger.click();
  });
  const input = requireValue(
    document.querySelector<HTMLInputElement>('[role="combobox"]'),
    "Combobox popup input",
  );
  const option = requireValue(
    document.querySelector<HTMLElement>('[role="option"][id$="banana"]'),
    "Combobox banana option",
  );
  act(() => {
    option.click();
  });
  expect(onValueChange).toHaveBeenCalledWith("banana", options[1]);
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(input).not.toBeNull();
});

it.each([false, true])(
  "associates Field labels and guidance with the real control (popup: %s)",
  (popup) => {
    const pickerProps = {
      getKey: (item: (typeof options)[number]) => item.id,
      getLabel: (item: (typeof options)[number]) => item.label,
      items: options,
    };
    const view = render(
      <Field label="Computers" description="Choose a Computer" error="Required">
        {popup ? (
          <Combobox
            {...pickerProps}
            trigger={
              <ComboboxTrigger aria-label="Allowed Computers">
                Choose Computers…
              </ComboboxTrigger>
            }
          />
        ) : (
          <Combobox {...pickerProps} />
        )}
      </Field>,
    );
    const label = requireValue(view.container.querySelector("label"), "label");
    const control = requireValue(
      view.container.querySelector(popup ? "button" : "input"),
      "selection control",
    );
    expect(label.control).toBe(control);
    const guidance = control
      .getAttribute("aria-describedby")
      ?.split(" ")
      .map((id) => document.getElementById(id)?.textContent);
    expect(guidance).toEqual(["Choose a Computer", "Required"]);
    expect(control.getAttribute("aria-invalid")).toBe("true");
    if (popup)
      expect(control.getAttribute("aria-label")).toBe("Allowed Computers");
  },
);

it("supports controlled popup open state and reports changes", () => {
  const onOpenChange = vi.fn();
  const view = render(
    <Combobox
      getKey={(item) => item.id}
      getLabel={(item) => item.label}
      items={options}
      onOpenChange={onOpenChange}
      open={false}
      trigger={<button type="button">Choose</button>}
    />,
  );
  const trigger = requireValue(
    view.container.querySelector("button"),
    "controlled Combobox trigger",
  );
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  act(() => {
    trigger.click();
  });
  expect(onOpenChange).toHaveBeenCalledWith(true);
  expect(document.querySelector('[role="combobox"]')).toBeNull();
});

it("opens the status picker on a host request and selects only after the person chooses", () => {
  const onSelect = vi.fn();
  function Host() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
        >
          Request Computer choice
        </button>
        <StatusBarPicker
          noun="Computer"
          pluralNoun="Computers"
          icon={<span aria-hidden="true">Computer</span>}
          options={[
            { id: "computer-one", label: "First Computer" },
            { id: "computer-two", label: "Second Computer" },
          ]}
          value="computer-one"
          open={open}
          onOpenChange={setOpen}
          onSelect={onSelect}
        />
      </>
    );
  }
  const view = render(<Host />);
  expect(document.querySelector('[role="combobox"]')).toBeNull();
  act(() => {
    requireValue(
      view.container.querySelector("button"),
      "host request",
    ).click();
  });
  expect(document.querySelector('[role="combobox"]')).not.toBeNull();
  expect(onSelect).not.toHaveBeenCalled();
  act(() => {
    requireValue(
      document.querySelector<HTMLElement>(
        '[role="option"][id$="computer-two"]',
      ),
      "second Computer",
    ).click();
  });
  expect(onSelect).toHaveBeenCalledExactlyOnceWith("computer-two");
  expect(document.querySelector('[role="combobox"]')).toBeNull();
});

it("recovers stale active keys after filtering and disablement", () => {
  let setItems: ((next: typeof options) => void) | undefined;
  function Harness() {
    const [items, updateItems] = useState(options);
    setItems = updateItems;
    return (
      <Combobox
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        isDisabled={(item) => item.id === "banana"}
        items={items}
      />
    );
  }
  const view = render(<Harness />);
  const input = requireValue(
    view.container.querySelector<HTMLInputElement>('[role="combobox"]'),
    "filterable Combobox input",
  );
  act(() => {
    fireInput(input, "ban");
  });
  expect(input.getAttribute("aria-activedescendant")).toBeNull();
  act(() => {
    fireInput(input, "");
  });
  expect(input.getAttribute("aria-activedescendant")).toContain("apple");
  act(() => setItems?.(options.filter((item) => item.id !== "apple")));
  expect(input.getAttribute("aria-activedescendant")).toContain("carrot");
});

it("keeps a disabled selected item out of keyboard navigation", () => {
  // Fail immediately on React's update-loop warning instead of hanging the runner.
  const reactError = vi
    .spyOn(console, "error")
    .mockImplementation((message) => {
      if (String(message).includes("Maximum update depth"))
        throw new Error(String(message));
    });
  try {
    const onValueChange = vi.fn();
    const view = render(
      <Combobox
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        isDisabled={(item) => item.id === "apple"}
        items={options}
        onValueChange={onValueChange}
        value="apple"
      />,
    );
    const input = requireValue(
      view.container.querySelector<HTMLInputElement>('[role="combobox"]'),
      "search",
    );
    expect(input.getAttribute("aria-activedescendant")).toContain("banana");
    act(() => {
      fireKey(input, { key: "Enter" });
    });
    expect(onValueChange).toHaveBeenCalledWith("banana", options[1]);
  } finally {
    reactError.mockRestore();
  }
});

it("moves off a selected item when it becomes disabled and handles no enabled items", () => {
  const onValueChange = vi.fn();
  let setDisabled: (keys: string[]) => void = () => undefined;
  function Picker() {
    const [disabled, updateDisabled] = useState<string[]>([]);
    setDisabled = updateDisabled;
    return (
      <Combobox
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        isDisabled={(item) => disabled.includes(item.id)}
        items={options}
        onValueChange={onValueChange}
        value="apple"
      />
    );
  }
  const view = render(<Picker />);
  const input = requireValue(
    view.container.querySelector<HTMLInputElement>('[role="combobox"]'),
    "search",
  );
  expect(input.getAttribute("aria-activedescendant")).toContain("apple");
  act(() => {
    setDisabled(["apple"]);
  });
  expect(input.getAttribute("aria-activedescendant")).toContain("banana");
  act(() => {
    setDisabled(["apple", "banana", "carrot"]);
  });
  expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  act(() => {
    fireKey(input, { key: "ArrowDown" });
    fireKey(input, { key: "Enter" });
  });
  expect(onValueChange).not.toHaveBeenCalled();
});

it.each([{ isComposing: true }, { keyCode: 229 }])(
  "leaves composition Enter alone before an ordinary Enter selects (%j)",
  (composition) => {
    const onValueChange = vi.fn();
    const view = render(
      <Combobox
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        items={options}
        onValueChange={onValueChange}
      />,
    );
    const input = requireValue(
      view.container.querySelector<HTMLInputElement>('[role="combobox"]'),
      "search",
    );
    act(() => {
      const event = fireKey(input, { key: "Enter", ...composition });
      expect(event.defaultPrevented).toBe(false);
    });
    expect(onValueChange).not.toHaveBeenCalled();
    act(() => {
      fireKey(input, { key: "Enter" });
    });
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("apple", options[0]);
  },
);

it("does not commit a disabled item on Enter", () => {
  const onValueChange = vi.fn();
  const view = render(
    <Combobox
      getKey={(item) => item.id}
      getLabel={(item) => item.label}
      isDisabled={(item) => item.id === "banana"}
      items={options}
      onValueChange={onValueChange}
    />,
  );
  const input = requireValue(
    view.container.querySelector<HTMLInputElement>('[role="combobox"]'),
    "disabled-item Combobox input",
  );
  act(() => {
    fireInput(input, "ban");
  });
  act(() => {
    fireKey(input, { key: "Enter" });
  });
  expect(onValueChange).not.toHaveBeenCalled();
});

it("closes on popup Escape and returns focus to the trigger", async () => {
  const onOpenChange = vi.fn();
  const view = render(
    <Combobox
      getKey={(item) => item.id}
      getLabel={(item) => item.label}
      items={options}
      onOpenChange={onOpenChange}
      trigger={<button type="button">Choose</button>}
    />,
  );
  const trigger = requireValue(
    view.container.querySelector("button"),
    "Escape-test Combobox trigger",
  );
  act(() => {
    trigger.click();
  });
  const input = requireValue(
    document.querySelector<HTMLInputElement>('[role="combobox"]'),
    "Escape-test Combobox input",
  );
  await act(async () => {
    input.focus();
    fireKey(input, { key: "Escape" });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
  expect(document.activeElement).toBe(trigger);
});

it.each([
  ["empty", [{ id: "", label: "Invalid" }]],
  [
    "duplicate",
    [
      { id: "same", label: "One" },
      { id: "same", label: "Two" },
    ],
  ],
])("rejects %s item keys", (_name, invalidItems) => {
  expect(() =>
    render(
      <Combobox
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        items={invalidItems}
      />,
    ),
  ).toThrow(/keys/);
});
