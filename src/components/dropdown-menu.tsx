import { Menu as BaseMenu } from "@base-ui/react/menu";
import * as React from "react";
import {
  createContext,
  forwardRef,
  useContext,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";

import { cn, resolveClassName } from "../lib/cn.js";
import { useGlide } from "../lib/glide.js";
import { useOverlayRoot, useOverlayDismiss } from "./overlay-root.js";

/** Details supplied to a DropdownMenu open-change callback. */
export type DropdownMenuChangeDetails = BaseMenu.Root.ChangeEventDetails;
/** Supported DropdownMenuChangeReason values. */
export type DropdownMenuChangeReason = BaseMenu.Root.ChangeEventReason;
/** Supported DropdownMenuInteractionOwner values. */
export type DropdownMenuInteractionOwner = "host" | "local";

type MenuContextValue = {
  actionsRef: React.RefObject<BaseMenu.Root.Actions | null>;
  interactionOwner: DropdownMenuInteractionOwner;
};

const MenuContext = createContext<MenuContextValue | null>(null);
/** Props accepted by DropdownMenu. */
export type DropdownMenuProps<Payload = unknown> =
  BaseMenu.Root.Props<Payload> & {
    interactionOwner?: DropdownMenuInteractionOwner;
  };

/** A menu controller with explicit controlled or uncontrolled open state. */
export function DropdownMenu<Payload = unknown>({
  actionsRef: suppliedActionsRef,
  children,
  interactionOwner = "local",
  onOpenChange,
  ...props
}: DropdownMenuProps<Payload>) {
  const internalActionsRef = useRef<BaseMenu.Root.Actions>(null);
  const actionsRef = suppliedActionsRef ?? internalActionsRef;
  useOverlayDismiss(() => actionsRef.current?.close());
  return (
    <MenuContext.Provider value={{ actionsRef, interactionOwner }}>
      <BaseMenu.Root
        {...props}
        actionsRef={actionsRef}
        onOpenChange={(next, details) => {
          if (
            interactionOwner === "host" &&
            !next &&
            details.reason === "escape-key"
          ) {
            details.cancel();
            details.allowPropagation();
            return;
          }
          onOpenChange?.(next, details);
        }}
      >
        {children}
      </BaseMenu.Root>
    </MenuContext.Provider>
  );
}

/** Access the nearest DropdownMenu close operation. */
export function useDropdownMenu() {
  const menu = useMenu();
  return {
    /** Close the nearest menu, if it is mounted. */
    close: () => menu.actionsRef.current?.close(),
  };
}
function useMenu() {
  const value = useContext(MenuContext);
  if (!value)
    throw new Error("DropdownMenu parts must be used inside <DropdownMenu>");
  return value;
}

/** The trigger control for a DropdownMenu. */
export const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement,
  BaseMenu.Trigger.Props
>(function DropdownMenuTrigger(
  { className, render, type = "button", ...props },
  ref,
) {
  return (
    <BaseMenu.Trigger
      {...props}
      className={(state) =>
        cn("btn caps-dropdown-trigger", resolveClassName(className, state))
      }
      ref={ref}
      render={render}
      type={type}
    />
  );
});

/** Shell popover destination, with Base UI container and mount lifetime overrides. */
export const DropdownMenuPortal = forwardRef<
  HTMLDivElement,
  BaseMenu.Portal.Props
>(function DropdownMenuPortal({ container, ...props }, ref) {
  const root = useOverlayRoot("popover");
  if (container == null && root === null) return null;
  return <BaseMenu.Portal {...props} container={container ?? root} ref={ref} />;
});

/** Base UI owns placement; a shell's popover root supplies its collision boundary. */
export const DropdownMenuPositioner = forwardRef<
  HTMLDivElement,
  BaseMenu.Positioner.Props
>(function DropdownMenuPositioner({ collisionBoundary, ...props }, ref) {
  const root = useOverlayRoot("popover");
  return (
    <BaseMenu.Positioner
      {...props}
      collisionBoundary={
        collisionBoundary ?? (root && root !== document.body ? root : undefined)
      }
      ref={ref}
    />
  );
});

/** The styled popup for caller-composed menu placement and portal ownership. */
export const DropdownMenuPopup = forwardRef<
  HTMLDivElement,
  BaseMenu.Popup.Props
>(function DropdownMenuPopup({ className, finalFocus, ...props }, ref) {
  const { interactionOwner } = useMenu();
  const popup = useRef<HTMLDivElement | null>(null);
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    ref,
    () => popup.current,
  );
  const glide = useGlide(".caps-dropdown-item[data-highlighted]");
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      popup.current = node;
      glide(node);
    },
    [glide],
  );
  return (
    <BaseMenu.Popup
      {...props}
      className={(state) =>
        cn(
          "caps-dropdown-popup min-w-40 rounded-box border border-base-300 bg-base-100 p-xs shadow-lg outline-none",
          resolveClassName(className, state),
        )
      }
      finalFocus={interactionOwner === "host" ? false : (finalFocus ?? true)}
      ref={attach}
    />
  );
});

/** Props accepted by DropdownMenuContent. */
export type DropdownMenuContentProps = BaseMenu.Popup.Props &
  Pick<BaseMenu.Portal.Props, "container" | "keepMounted"> &
  Pick<
    BaseMenu.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >;
/** The positioned content region for a DropdownMenu. */
export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(function DropdownMenuContent(
  {
    align = "end",
    alignOffset,
    children,
    container,
    keepMounted,
    side = "bottom",
    sideOffset = 4,
    ...props
  },
  ref,
) {
  return (
    <DropdownMenuPortal container={container} keepMounted={keepMounted}>
      <DropdownMenuPositioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <DropdownMenuPopup {...props} ref={ref}>
          {children}
        </DropdownMenuPopup>
      </DropdownMenuPositioner>
    </DropdownMenuPortal>
  );
});

const itemClasses =
  "caps-dropdown-item flex w-full items-center gap-sm rounded-field px-md py-sm text-left text-sm outline-none transition-colors hover:bg-base-200 focus-visible:bg-base-200 aria-[current=page]:bg-base-200 aria-[current=page]:font-semibold disabled:cursor-not-allowed disabled:text-base-content/40 data-disabled:cursor-not-allowed data-disabled:text-base-content/40";
/** Props accepted by DropdownMenuItem. */
export type DropdownMenuItemProps = Omit<BaseMenu.Item.Props, "onSelect"> & {
  /** Called when this item is selected. */
  onSelect?: (event: React.SyntheticEvent<HTMLDivElement>) => void;
  variant?: "default" | "destructive";
};
/** An actionable item in a DropdownMenu. */
export const DropdownMenuItem = forwardRef<HTMLElement, DropdownMenuItemProps>(
  function DropdownMenuItem(
    { className, onClick, onSelect, variant = "default", ...props },
    ref,
  ) {
    return (
      <BaseMenu.Item
        {...props}
        className={(state) =>
          cn(
            itemClasses,
            variant === "destructive" &&
              "text-error hover:bg-error hover:text-error-content focus-visible:bg-error focus-visible:text-error-content",
            resolveClassName(className, state),
          )
        }
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onSelect?.(event);
        }}
        ref={ref}
      />
    );
  },
);

/** Props accepted by DropdownMenuCheckboxItem. */
export type DropdownMenuCheckboxItemProps = Omit<
  BaseMenu.CheckboxItem.Props,
  "onSelect"
> &
  Pick<DropdownMenuItemProps, "onSelect">;
/** A checkable item in a DropdownMenu. */
export const DropdownMenuCheckboxItem = forwardRef<
  HTMLElement,
  DropdownMenuCheckboxItemProps
>(function DropdownMenuCheckboxItem(
  { className, onClick, onSelect, ...props },
  ref,
) {
  return (
    <BaseMenu.CheckboxItem
      {...props}
      className={(state) => cn(itemClasses, resolveClassName(className, state))}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onSelect?.(event);
      }}
      ref={ref}
    />
  );
});

/** A visual separator in a DropdownMenu. */
export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  BaseMenu.Separator.Props
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <BaseMenu.Separator
      {...props}
      className={(state) =>
        cn("my-xs h-px bg-base-300", resolveClassName(className, state))
      }
      ref={ref}
    />
  );
});

/** A named set of related items; pair it with a DropdownMenuLabel. */
export const DropdownMenuGroup = BaseMenu.Group;

/** The visible name of a DropdownMenuGroup, announced with its items. */
export const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  BaseMenu.GroupLabel.Props
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <BaseMenu.GroupLabel
      {...props}
      className={(state) =>
        cn(
          "px-md pb-xs pt-sm text-xs font-semibold text-base-content/60",
          resolveClassName(className, state),
        )
      }
      ref={ref}
    />
  );
});
