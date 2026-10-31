// @vitest-environment jsdom
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { act, createRef, useState } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { cleanup, fireKey, render, requireValue } from "../test-utils/index.js";
import {
  Dialog,
  type DialogChangeDetails,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";

afterEach(cleanup);

it.each(
  ([undefined, "default", "fill"] as const).flatMap((size) =>
    [false, true].map((composed) => ({
      size,
      composed,
    })),
  ),
)("keeps size=$size geometry (composed=$composed)", ({ size, composed }) => {
  const content = <DialogTitle>Print preview</DialogTitle>;
  const props = size === undefined ? {} : { size };
  render(
    <Dialog open>
      {composed ? (
        <DialogContent {...props}>{content}</DialogContent>
      ) : (
        <DialogPortal>
          <DialogPopup {...props}>{content}</DialogPopup>
        </DialogPortal>
      )}
    </Dialog>,
  );
  const popup = requireValue(
    document.querySelector('[role="dialog"]'),
    "sized popup",
  );
  expect(popup.getAttribute("data-size")).toBe(size ?? "default");
  expect(popup.classList.contains("p-lg")).toBe(true);
  expect(popup.classList.contains("rounded-box")).toBe(true);
  expect(popup.classList.contains("bg-base-100")).toBe(true);
  if (size === "fill") {
    for (const token of [
      "fixed",
      "inset-0",
      "h-full",
      "w-full",
      "max-w-none",
    ]) {
      expect(popup.classList.contains(token)).toBe(true);
    }
    expect(popup.className).not.toMatch(/translate|left-1\/2|top-1\/2/);
    expect(popup.classList.contains("w-11/12")).toBe(false);
    expect(popup.classList.contains("max-w-(--container-lg)")).toBe(false);
  } else {
    expect(popup.classList.contains("max-h-screen")).toBe(true);
    expect(popup.classList.contains("w-11/12")).toBe(true);
    expect(popup.classList.contains("max-w-(--container-lg)")).toBe(true);
    expect(popup.classList.contains("inset-0")).toBe(false);
    expect(popup.classList.contains("-translate-x-1/2")).toBe(composed);
    expect(popup.classList.contains("-translate-y-1/2")).toBe(composed);
  }
});

it("leaves body dialogs ranked by portal recency", () => {
  render(
    <Dialog open>
      <DialogContent>
        <DialogTitle>Confirm</DialogTitle>
        <DialogDescription>Reply to this visitor</DialogDescription>
      </DialogContent>
    </Dialog>,
  );
  for (const selector of [".caps-dialog-popup", ".caps-dialog-backdrop"]) {
    const element = requireValue(document.querySelector(selector), selector);
    expect([...element.classList].some((name) => name.startsWith("z-"))).toBe(
      false,
    );
  }
});

it("appends a nested menu after its open dialog", async () => {
  render(
    <Dialog open>
      <DialogContent>
        <DialogTitle>Actions</DialogTitle>
        <DialogDescription>Choose an action</DialogDescription>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger render={<button />}>More</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DialogContent>
    </Dialog>,
  );
  const popup = requireValue(
    document.querySelector('[role="dialog"]'),
    "dialog",
  );
  const trigger = requireValue(
    popup.querySelector<HTMLButtonElement>("button"),
    "menu trigger",
  );
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await act(async () => {
    trigger.click();
    await Promise.resolve();
  });
  const menu = requireValue(
    document.querySelector('[role="menu"]'),
    "nested menu",
  );
  expect(
    popup.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).not.toBe(0);
});

it.each(
  [
    {
      name: "Caps",
      Root: Dialog,
      Trigger: DialogTrigger,
      Portal: DialogPortal,
      Popup: DialogPopup,
      Title: DialogTitle,
      Description: DialogDescription,
      Close: DialogClose,
    },
    {
      name: "Base UI",
      Root: BaseDialog.Root,
      Trigger: BaseDialog.Trigger,
      Portal: BaseDialog.Portal,
      Popup: BaseDialog.Popup,
      Title: BaseDialog.Title,
      Description: BaseDialog.Description,
      Close: BaseDialog.Close,
    },
  ].flatMap((parts) => [
    { ...parts, keepMounted: true },
    { ...parts, keepMounted: false },
  ]),
)(
  "$name keeps caller-selected portal, labels and focus targets (keepMounted=$keepMounted)",
  async ({
    Root,
    Trigger,
    Portal,
    Popup,
    Title,
    Description,
    Close,
    keepMounted,
  }) => {
    const onOpenChange =
      vi.fn<(open: boolean, details: DialogChangeDetails) => void>();
    const container = createRef<HTMLDivElement>();
    const field = createRef<HTMLInputElement>();
    const returnTarget = createRef<HTMLButtonElement>();
    function Window() {
      const [portalContainer, setPortalContainer] =
        useState<HTMLDivElement | null>(null);
      return (
        <div ref={container}>
          <div ref={setPortalContainer} />
          <button ref={returnTarget}>Return here</button>
          <Root modal={false} onOpenChange={onOpenChange}>
            <Trigger
              render={<button data-trigger="composed" />}
              className={({ open }) =>
                open ? "open-trigger" : "closed-trigger"
              }
            >
              Open
            </Trigger>
            <Portal container={portalContainer} keepMounted={keepMounted}>
              <Popup initialFocus={field} finalFocus={returnTarget}>
                <Title id="caller-title">Window details</Title>
                <Description id="caller-description">
                  An existing App window
                </Description>
                <input aria-label="Window name" ref={field} />
                <Close className="btn-ghost">Close</Close>
              </Popup>
            </Portal>
          </Root>
        </div>
      );
    }
    const view = render(<Window />);
    const trigger = requireValue(
      view.queryBySelector('[data-trigger="composed"]'),
      "composed trigger",
    );
    // Focus precedes activation as a separate browser event. Do not batch
    // trigger registration and opening into one synthetic React update.
    act(() => {
      trigger.focus();
    });
    act(() => {
      trigger.click();
    });
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    const popup = requireValue(
      container.current?.querySelector('[role="dialog"]'),
      "window-owned dialog",
    );
    expect(popup.getAttribute("aria-labelledby")).toBe("caller-title");
    expect(popup.getAttribute("aria-describedby")).toBe("caller-description");
    expect(
      container.current?.querySelector(".caps-dialog-backdrop"),
    ).toBeNull();
    const focusEvents = onOpenChange.mock.calls.map(([open, details]) => ({
      open,
      reason: details.reason,
      event: details.event.type,
      target:
        details.event.target instanceof Element
          ? details.event.target.outerHTML
          : null,
      relatedTarget:
        details.event instanceof FocusEvent &&
        details.event.relatedTarget instanceof Element
          ? details.event.relatedTarget.outerHTML
          : null,
    }));
    expect(
      onOpenChange.mock.calls.map(([open, details]) => ({
        open,
        reason: details.reason,
      })),
      JSON.stringify(focusEvents),
    ).toEqual([{ open: true, reason: "trigger-press" }]);
    expect(trigger.classList.contains("open-trigger")).toBe(true);
    expect(document.activeElement).toBe(field.current);
    const close = requireValue(
      popup.querySelector<HTMLButtonElement>(".btn-ghost"),
      "composed close",
    );
    await act(async () => {
      close.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(document.activeElement).toBe(returnTarget.current);
  },
);

it("lets a caller retain closing content until its own animation completes", async () => {
  const actions = createRef<{ close(): void; unmount(): void }>();
  const view = render(
    <Dialog
      actionsRef={actions}
      onOpenChange={(open, details) => {
        if (!open) details.preventUnmountOnClose();
      }}
    >
      <DialogTrigger>Open</DialogTrigger>
      <DialogPortal>
        <DialogPopup>
          <DialogTitle>Animated details</DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogPopup>
      </DialogPortal>
    </Dialog>,
  );
  await act(async () => {
    requireValue(view.queryBySelector("button"), "animation trigger").click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await act(async () => {
    requireValue(
      document.querySelector<HTMLButtonElement>(".btn-ghost"),
      "animation close",
    ).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(document.querySelector(".caps-dialog-popup")).not.toBeNull();
  act(() => {
    requireValue(actions.current, "native dialog actions").unmount();
  });
  expect(document.querySelector(".caps-dialog-popup")).toBeNull();
});

it("preserves event and trigger identity while exposing live flags", () => {
  const onOpenChange =
    vi.fn<(open: boolean, details: DialogChangeDetails) => void>();
  let triggerEvent: Event | undefined;
  const triggerRef = createRef<HTMLButtonElement>();
  const view = render(
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger
        onClick={(event) => {
          triggerEvent = event.nativeEvent;
        }}
        ref={triggerRef}
      >
        Open
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </Dialog>,
  );
  const trigger = requireValue(
    view.queryBySelector("button"),
    "Dialog trigger",
  );
  act(() => {
    trigger.click();
  });
  const close = requireValue(
    document.body.querySelector<HTMLButtonElement>(".btn-ghost"),
    "Dialog close button",
  );
  act(() => {
    close.click();
  });
  const [, details] = requireValue(
    onOpenChange.mock.calls[0],
    "Dialog open-change call",
  );
  expect(details.trigger).toBe(triggerRef.current);
  expect(details.event).toBe(triggerEvent);
  expect(details.isCanceled).toBe(false);
  expect(details.isPropagationAllowed).toBe(false);
  details.cancel();
  expect(details.isCanceled).toBe(true);
  details.allowPropagation();
  expect(details.isPropagationAllowed).toBe(true);
});

it.each(["default", "fill"] as const)(
  "local Escape closes size=%s once and restores the trigger focus",
  async (size) => {
    const onOpenChange =
      vi.fn<(open: boolean, details: DialogChangeDetails) => void>();
    const view = render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent size={size}>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const trigger = requireValue(
      view.queryBySelector("button"),
      "Escape-test Dialog trigger",
    );
    act(() => {
      trigger.click();
    });
    const dialog = requireValue(
      document.body.querySelector(".caps-dialog-popup"),
      "Escape-test Dialog panel",
    );
    let event: KeyboardEvent | undefined;
    await act(async () => {
      event = fireKey(dialog, { key: "Escape" });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(
      requireValue(event, "dispatched Escape event").defaultPrevented,
    ).toBe(true);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange.mock.calls.at(-1)?.[1].reason).toBe("escape-key");
    expect(document.activeElement).toBe(trigger);
  },
);

it.each(["default", "fill"] as const)(
  "size=%s respects finalFocus=false",
  async (size) => {
    const view = render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent size={size} finalFocus={false}>
          <DialogTitle>Print preview</DialogTitle>
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </Dialog>,
    );
    const trigger = requireValue(view.queryBySelector("button"), "trigger");
    act(() => {
      trigger.focus();
    });
    act(() => {
      trigger.click();
    });
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    const close = requireValue(
      document.querySelector<HTMLButtonElement>(".caps-dialog-popup button"),
      "close button",
    );
    await act(async () => {
      close.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(document.activeElement).not.toBe(trigger);
  },
);

it("host Escape suppresses the consumer close callback", async () => {
  const onOpenChange =
    vi.fn<(open: boolean, details: DialogChangeDetails) => void>();
  render(
    <Dialog interactionOwner="host" onOpenChange={onOpenChange} open>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
      </DialogContent>
    </Dialog>,
  );
  const dialog = requireValue(
    document.body.querySelector(".caps-dialog-popup"),
    "host-owned Dialog panel",
  );
  await act(async () => {
    fireKey(dialog, { key: "Escape" });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(onOpenChange).not.toHaveBeenCalled();
});
