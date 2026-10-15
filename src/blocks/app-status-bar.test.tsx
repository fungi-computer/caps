import { act, createRef } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { AppStatusBar, StatusBarChip } from "./app-status-bar.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/dropdown-menu.js";

afterEach(cleanup);

const chip = (container: HTMLElement, name: string) =>
  requireValue(
    [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === name,
    ),
    name,
  );

it("runs an action chip and forwards its ref", () => {
  const onClick = vi.fn();
  const ref = createRef<HTMLButtonElement>();
  const view = render(
    <AppStatusBar>
      <StatusBarChip ref={ref} label="Ports" title="Ports" onClick={onClick} />
    </AppStatusBar>,
  );
  const ports = chip(view.container, "Ports");
  expect(ref.current).toBe(ports);
  expect(ports.getAttribute("type")).toBe("button");
  expect(ports.hasAttribute("aria-pressed")).toBe(false);
  act(() => {
    ports.click();
  });
  expect(onClick).toHaveBeenCalledOnce();
});

it("says a toggle chip's state and keeps an icon chip named by its label", () => {
  const view = render(
    <>
      <StatusBarChip label="Wrap" pressed />
      <StatusBarChip label="Follow" pressed={false} />
      <StatusBarChip label="Access" icon={<svg />} expanded={false} />
    </>,
  );
  expect(chip(view.container, "Wrap").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(chip(view.container, "Follow").getAttribute("aria-pressed")).toBe(
    "false",
  );
  const access = chip(view.container, "Access");
  expect(access.getAttribute("aria-expanded")).toBe("false");
  expect(
    access
      .querySelector(".caps-status-bar-chip-icon")
      ?.getAttribute("aria-hidden"),
  ).toBe("true");
});

it("serves as a menu trigger and reports the open menu", () => {
  const view = render(
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<StatusBarChip label="Branch" />} />
      <DropdownMenuContent>
        <DropdownMenuItem>main</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
  const branch = chip(view.container, "Branch");
  act(() => {
    branch.click();
  });
  expect(branch.getAttribute("aria-expanded")).toBe("true");
});
