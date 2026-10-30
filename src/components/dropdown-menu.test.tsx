// @vitest-environment jsdom
import { act, createRef } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { Button } from "./button.js";
import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import {
  DropdownMenu,
  type DropdownMenuChangeDetails,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPopup,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";

afterEach(cleanup);

it("renders the native checked indicator and follows the item's checked state", async () => {
  const view = render(
    <DropdownMenu>
      <DropdownMenuTrigger>Options</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem defaultChecked>
          Current
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const menu = await openMenu(
    requireValue(view.queryBySelector("button"), "menu trigger"),
  );
  const item = requireValue(
    menu.querySelector<HTMLElement>('[role="menuitemcheckbox"]'),
    "checkable item",
  );
  expect(item.getAttribute("aria-checked")).toBe("true");
  expect(item.querySelector("span[data-checked]")?.textContent).toBe("✓");
  expect(
    item.querySelector("span[data-checked]")?.getAttribute("aria-hidden"),
  ).toBe("true");
  await act(async () => {
    item.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(item.getAttribute("aria-checked")).toBe("false");
  expect(item.textContent).not.toContain("✓");
  await act(async () => {
    item.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(item.getAttribute("aria-checked")).toBe("true");
  expect(item.querySelector("span[data-checked]")?.textContent).toBe("✓");
});

it("places different-length checked labels in the existing item's right-edge column", async () => {
  const view = render(
    <DropdownMenu>
      <DropdownMenuTrigger>Options</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem defaultChecked>
          Pinned
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem defaultChecked>
          Notify when in season
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const menu = await openMenu(
    requireValue(view.queryBySelector("button"), "menu trigger"),
  );
  const items = menu.querySelectorAll<HTMLElement>(
    '[role="menuitemcheckbox"][aria-checked="true"]',
  );
  expect(items).toHaveLength(2);
  for (const item of items) {
    const indicator = requireValue(
      item.querySelector("span[data-checked]"),
      "native checked indicator",
    );
    expect(item.classList.contains("flex")).toBe(true);
    expect(item.classList.contains("w-full")).toBe(true);
    expect(indicator.parentElement).toBe(item);
    const label = requireValue(
      indicator.previousElementSibling,
      "flexible menu label slot",
    );
    expect(label.classList.contains("flex-1")).toBe(true);
    expect(label.classList.contains("min-w-0")).toBe(true);
    expect(["Pinned", "Notify when in season"]).toContain(label.textContent);
    expect(indicator.classList.contains("shrink-0")).toBe(true);
  }
});

it("composes menu items without losing selection or native checked details", async () => {
  const onSelect = vi.fn();
  const onCheckedChange = vi.fn();
  const view = render(
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="menubar" variant="ghost" />}>
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          render={<button data-action />}
          nativeButton
          closeOnClick={false}
          className={({ disabled }) => (disabled ? "unavailable" : "available")}
          onSelect={onSelect}
        >
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          render={<button data-check />}
          nativeButton
          className={({ checked }) => (checked ? "checked" : "unchecked")}
          onCheckedChange={onCheckedChange}
        >
          Show details
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const menu = await openMenu(
    requireValue(view.queryBySelector("button"), "composed item trigger"),
  );
  const action = requireValue(
    menu.querySelector<HTMLButtonElement>("[data-action]"),
    "composed action",
  );
  const checkbox = requireValue(
    menu.querySelector<HTMLButtonElement>("[data-check]"),
    "composed checkbox",
  );
  expect(action.tagName).toBe("BUTTON");
  expect(action.classList.contains("available")).toBe(true);
  act(() => {
    action.click();
    checkbox.click();
  });
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onCheckedChange).toHaveBeenCalledWith(
    true,
    expect.objectContaining({ reason: "item-press" }),
  );
  expect(checkbox.classList.contains("checked")).toBe(true);
  expect(menu.isConnected).toBe(true);
});

it("composes native placement inside a caller-owned portal with explicit return focus", async () => {
  const container = createRef<HTMLDivElement>();
  const returnTarget = createRef<HTMLButtonElement>();
  const view = render(
    <div ref={container}>
      <button ref={returnTarget}>Return here</button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger data-menu-trigger render={<button />}>
          Actions
        </DropdownMenuTrigger>
        <DropdownMenuPortal container={container}>
          <DropdownMenuPositioner align="start" side="top">
            <DropdownMenuPopup finalFocus={returnTarget}>
              <DropdownMenuItem>Open</DropdownMenuItem>
            </DropdownMenuPopup>
          </DropdownMenuPositioner>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>,
  );
  const trigger = requireValue(
    view.queryBySelector("[data-menu-trigger]"),
    "composed menu trigger",
  );
  await openMenu(trigger);
  const menu = requireValue(
    container.current?.querySelector('[role="menu"]'),
    "window-owned menu",
  );
  await act(async () => {
    requireValue(
      menu.querySelector<HTMLElement>('[role="menuitem"]'),
      "composed menu item",
    ).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(document.activeElement).toBe(returnTarget.current);
});

it("exposes native close-animation lifetime without copying change details", async () => {
  const actions = createRef<{ close(): void; unmount(): void }>();
  const view = render(
    <DropdownMenu
      actionsRef={actions}
      onOpenChange={(open, details) => {
        if (!open) details.preventUnmountOnClose();
      }}
    >
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Open</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const menu = await openMenu(
    requireValue(view.queryBySelector("button"), "animation menu trigger"),
  );
  await act(async () => {
    requireValue(
      menu.querySelector<HTMLElement>('[role="menuitem"]'),
      "animation menu item",
    ).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
  act(() => {
    requireValue(actions.current, "native menu actions").unmount();
  });
  expect(document.querySelector('[role="menu"]')).toBeNull();
});

async function openMenu(trigger: HTMLElement): Promise<HTMLElement> {
  await act(async () => {
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return requireValue(
    document.body.querySelector<HTMLElement>('[role="menu"]'),
    "open DropdownMenu",
  );
}

it("names a group of items so assistive technology announces them together", async () => {
  const view = render(
    <DropdownMenu>
      <DropdownMenuTrigger>More</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Developer</DropdownMenuLabel>
          <DropdownMenuItem>Team keys</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const menu = await openMenu(
    requireValue(view.queryBySelector("button"), "group trigger"),
  );
  const group = requireValue(
    menu.querySelector<HTMLElement>('[role="group"]'),
    "menu group",
  );
  const label = requireValue(
    group.querySelector<HTMLElement>("[id]"),
    "group label",
  );
  expect(label.textContent).toBe("Developer");
  expect(group.getAttribute("aria-labelledby")).toBe(label.id);
  expect(group.textContent).toContain("Team keys");
});

it("visibly marks a caller's current page without taking over menu selection", async () => {
  const view = render(
    <DropdownMenu>
      <DropdownMenuTrigger>More</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          aria-current="page"
          nativeButton={false}
          render={<a href="/team" />}
        >
          Team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const menu = await openMenu(
    requireValue(view.queryBySelector("button"), "navigation trigger"),
  );
  const item = requireValue(
    menu.querySelector<HTMLElement>('[role="menuitem"]'),
    "current page item",
  );
  expect(item.getAttribute("aria-current")).toBe("page");
  expect(item.classList.contains("aria-[current=page]:bg-base-200")).toBe(true);
  expect(item.classList.contains("aria-[current=page]:font-semibold")).toBe(
    true,
  );
});

it("preserves the change event and exposes live cancellation flags", async () => {
  const onOpenChange = vi.fn(
    (_open: boolean, details: DropdownMenuChangeDetails) => {
      if (!details.isCanceled) details.cancel();
      details.allowPropagation();
    },
  );
  let triggerEvent: Event | undefined;
  const view = render(
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        onClick={(event) => {
          triggerEvent = event.nativeEvent;
        }}
      >
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Open</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const trigger = requireValue(
    view.queryBySelector("button"),
    "DropdownMenu trigger",
  );
  await act(async () => {
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  const [, details] = requireValue(
    onOpenChange.mock.calls[0],
    "DropdownMenu open-change call",
  );
  expect(details.event).toBe(triggerEvent);
  expect(details.trigger).toBe(trigger);
  expect(details.isCanceled).toBe(true);
  expect(details.isPropagationAllowed).toBe(true);
});

it("host Escape cancels Base UI close and suppresses the consumer callback", () => {
  const onOpenChange =
    vi.fn<(open: boolean, details: DropdownMenuChangeDetails) => void>();
  render(
    <DropdownMenu interactionOwner="host" onOpenChange={onOpenChange} open>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Open</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const content = requireValue(
    document.body.querySelector('[role="menu"]'),
    "host-owned DropdownMenu",
  );
  act(() => {
    fireKey(content, { key: "Escape" });
  });
  expect(onOpenChange).not.toHaveBeenCalled();
});

it("opens a floating menu, navigates locally, and returns focus after selection", async () => {
  const onClick = vi.fn();
  const onSelect = vi.fn();
  const triggerRef = createRef<HTMLButtonElement>();
  const view = render(
    <DropdownMenu>
      <DropdownMenuTrigger className="trigger-custom" ref={triggerRef}>
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent className="content-custom">
        <DropdownMenuItem onClick={onClick} onSelect={onSelect}>
          Open
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
        <DropdownMenuCheckboxItem checked>Checked</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const trigger = requireValue(
    view.container.querySelector<HTMLButtonElement>(".trigger-custom"),
    "floating DropdownMenu trigger",
  );
  expect(triggerRef.current).toBe(trigger);
  const content = await openMenu(trigger);
  expect(content).not.toBeNull();
  expect(content.hasAttribute("data-open")).toBe(true);
  expect(content.querySelector('[role="menuitemcheckbox"]')).not.toBeNull();
  expect(content.querySelector('[role="separator"]')).not.toBeNull();
  expect(content.querySelector('[aria-disabled="true"]')).not.toBeNull();

  const first = requireValue(
    content.querySelector<HTMLElement>('[role="menuitem"]'),
    "first DropdownMenu item",
  );
  act(() => {
    first.focus();
    fireKey(first, { key: "ArrowDown" });
  });
  expect(document.activeElement?.textContent).toBe("Disabled");
  act(() => {
    fireKey(requireValue(document.activeElement, "active menu item"), {
      key: "ArrowUp",
    });
  });
  expect(document.activeElement?.textContent).toBe("Open");
  act(() => {
    fireKey(requireValue(document.activeElement, "active menu item"), {
      key: "End",
    });
  });
  expect(document.activeElement?.textContent).toBe("Delete");
  act(() => {
    fireKey(requireValue(document.activeElement, "active menu item"), {
      key: "Home",
    });
  });
  expect(document.activeElement?.textContent).toBe("Open");
  act(() => {
    fireKey(content, { key: "Escape" });
  });
  expect(document.body.querySelector('[role="menu"]')).toBeNull();

  act(() => {
    trigger.click();
  });
  const open = requireValue(
    document.body.querySelector<HTMLElement>('[role="menuitem"]'),
    "reopened DropdownMenu item",
  );
  await act(async () => {
    open.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(trigger);
});

it("reports controlled Escape close details", () => {
  const onOpenChange =
    vi.fn<(open: boolean, details: DropdownMenuChangeDetails) => void>();
  const view = render(
    <dialog open>
      <DropdownMenu onOpenChange={onOpenChange} open>
        <DropdownMenuTrigger id="custom-trigger">Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Open</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </dialog>,
  );
  expect(view.container.querySelector("#custom-trigger")).not.toBeNull();
  const content = requireValue(
    document.body.querySelector('[role="menu"]'),
    "controlled DropdownMenu",
  );
  act(() => {
    fireKey(content, { key: "Escape" });
  });
  expect(onOpenChange).toHaveBeenCalledWith(
    false,
    expect.objectContaining({ reason: "escape-key" }),
  );
  expect(onOpenChange).toHaveBeenCalledTimes(1);
});
