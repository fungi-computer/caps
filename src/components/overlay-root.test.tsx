// @vitest-environment jsdom
import { act, useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { OverlayRoot, type OverlayContainers } from "./overlay-root.js";
import { Dialog, DialogContent, DialogTitle } from "./dialog.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./dropdown-menu.js";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip.js";
import { Combobox, ComboboxTrigger } from "./combobox.js";
import { Toaster, toast } from "./toaster.js";

const roots: HTMLElement[] = [];
afterEach(() => {
  toast.dismiss();
  cleanup();
  for (const root of roots.splice(0)) root.remove();
});

function containers(): OverlayContainers {
  const make = () => {
    const root = document.createElement("section");
    document.body.append(root);
    roots.push(root);
    return root;
  };
  return { popover: make(), dialog: make(), toast: make(), tooltip: make() };
}

it("routes composed overlays to the nearest host roots without container props", async () => {
  const outer = containers();
  const inner = containers();
  render(
    <OverlayRoot containers={outer}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuContent>
          <DropdownMenuItem>Outer menu</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <OverlayRoot containers={inner}>
        <Dialog defaultOpen modal={false}>
          <DialogContent>
            <DialogTitle>Inner dialog</DialogTitle>
          </DialogContent>
        </Dialog>
        <Tooltip open>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>Inner help</TooltipContent>
        </Tooltip>
        <Toaster id="inner" />
      </OverlayRoot>
    </OverlayRoot>,
  );
  await act(async () => {
    toast("Inner notice", { toasterId: "inner" });
    await Promise.resolve();
  });
  expect(outer.popover?.querySelector('[role="menuitem"]')?.textContent).toBe(
    "Outer menu",
  );
  expect(inner.popover?.querySelector('[role="menuitem"]')).toBeNull();
  expect(inner.dialog?.querySelector('[role="dialog"]')?.textContent).toContain(
    "Inner dialog",
  );
  expect(inner.tooltip?.querySelector('[role="tooltip"]')?.textContent).toBe(
    "Inner help",
  );
  expect(
    inner.toast?.querySelector("[data-sonner-toast]")?.textContent,
  ).toContain("Inner notice");
});

it("waits for a shell root instead of briefly mounting into the document body", () => {
  const mounted = containers();
  let supplyRoots: (() => void) | undefined;
  function Shell() {
    const [ready, setReady] = useState(false);
    supplyRoots = () => {
      setReady(true);
    };
    return (
      <OverlayRoot
        containers={
          ready
            ? mounted
            : { popover: null, dialog: null, toast: null, tooltip: null }
        }
      >
        <Combobox
          defaultOpen
          items={[{ id: "grove", label: "Grove" }]}
          getKey={(item) => item.id}
          getLabel={(item) => item.label}
          trigger={<ComboboxTrigger>Choose App</ComboboxTrigger>}
        />
        <Tooltip open>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>Waiting help</TooltipContent>
        </Tooltip>
        <Toaster />
      </OverlayRoot>
    );
  }
  render(<Shell />);
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
  expect(document.querySelector('[role="option"]')).toBeNull();
  act(() => {
    requireValue(supplyRoots, "mounted shell")();
  });
  expect(mounted.popover?.querySelector('[role="option"]')?.textContent).toBe(
    "Grove",
  );
  expect(mounted.tooltip?.querySelector('[role="tooltip"]')?.textContent).toBe(
    "Waiting help",
  );
});

it("routes a searchable popup to the nearest host popover root", () => {
  const host = containers();
  render(
    <OverlayRoot containers={host}>
      <Combobox
        defaultOpen
        items={[{ id: "grove", label: "Grove" }]}
        getKey={(item) => item.id}
        getLabel={(item) => item.label}
        trigger={<ComboboxTrigger>Choose App</ComboboxTrigger>}
      />
    </OverlayRoot>,
  );
  expect(host.popover?.querySelector('[role="option"]')?.textContent).toBe(
    "Grove",
  );
});

it("dismisses transient overlays on the host's shared dismissal without retiring a dialog", () => {
  const host = containers();
  const listeners = new Set<() => void>();
  const subscribeDismiss = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  render(
    <OverlayRoot containers={host} subscribeDismiss={subscribeDismiss}>
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuContent>
          <DropdownMenuItem>Dismiss menu</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip defaultOpen>
        <TooltipTrigger>Help</TooltipTrigger>
        <TooltipContent>Dismiss help</TooltipContent>
      </Tooltip>
      <Dialog defaultOpen modal={false}>
        <DialogContent>
          <DialogTitle>Keep dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    </OverlayRoot>,
  );
  expect(host.popover?.querySelector('[role="menu"]')).not.toBeNull();
  expect(host.tooltip?.querySelector('[role="tooltip"]')).not.toBeNull();
  act(() => {
    for (const listener of listeners) listener();
  });
  expect(host.popover?.querySelector('[role="menu"]')).toBeNull();
  expect(host.tooltip?.querySelector('[role="tooltip"]')).toBeNull();
  expect(host.dialog?.querySelector('[role="dialog"]')?.textContent).toContain(
    "Keep dialog",
  );
  cleanup();
  expect(listeners.size).toBe(0);
});
