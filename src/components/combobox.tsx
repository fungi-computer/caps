import { isImeComposing } from "../lib/ime.js";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";

import { cn } from "../lib/cn.js";
import { useGlide } from "../lib/glide.js";
import { Check, ChevronDown } from "lucide-react";
import { useOverlayRoot, useOverlayDismiss } from "./overlay-root.js";
import { Input } from "./input.js";
import { useSelectableCollection } from "./selectable.js";

/** The same molded field face as Select, for caller-owned selection summaries. */
export const ComboboxTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(function ComboboxTrigger(
  { children, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={cn(
        "select caps-select caps-combobox-trigger w-full",
        className,
      )}
    >
      <span>{children}</span>
      <ChevronDown className="caps-select-chevron" aria-hidden="true" />
    </button>
  );
});

/** Intrinsic focus and selection state supplied when rendering a Combobox item. */
export type ComboboxItemState = {
  active: boolean;
  disabled: boolean;
  selected: boolean;
};
/** Props accepted by Combobox. */
export type ComboboxProps<T> = ComboboxBaseProps<T> &
  (ComboboxInlineProps | ComboboxPopupProps) &
  ComboboxValueProps<T>;
/** Props shared by every Combobox mode: item shape, rendering, and field wiring. */
export type ComboboxBaseProps<T> = {
  /** Color intent for the locally active option. */
  activeTone?: "neutral" | "primary";
  /** Native portal destination. Use an unclipped themed container for nested themes. */
  container?: BasePopover.Portal.Props["container"];
  contentClassName?: string;
  emptyMessage?: ReactNode;
  /** Returns the stable identity used to track and compare items. */
  getKey: (item: T) => string;
  /** Returns the text shown for an item in the trigger and the list. */
  getLabel: (item: T) => string;
  /** Returns the text matched against caller input; defaults to the item's label. */
  getSearchText?: (item: T) => string;
  /** Returns the heading an item is grouped under in the list. */
  groupBy?: (item: T) => string;
  /** Identifies the popup trigger or inline input for native label association. */
  id?: string;
  inputProps?: Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "defaultValue" | "value"
  >;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Receives the selection control's root div. */
  rootRef?: React.Ref<HTMLDivElement>;
  /** Returns whether an item is unselectable. */
  isDisabled?: (item: T) => boolean;
  items: readonly T[];
  placeholder?: string;
  /** Renders one item's content; defaults to its label. */
  renderItem?: (
    item: T,
    active: boolean,
    state: ComboboxItemState,
  ) => ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "value">;

/** Combobox mode flags for the inline (always-expanded, no popup trigger) layout. */
export type ComboboxInlineProps = {
  defaultOpen?: never;
  /** Popup visibility callbacks do not apply to inline choices. */
  onOpenChange?: never;
  open?: never;
  trigger?: never;
  triggerRef?: never;
};

/** Combobox mode flags for the popup layout, either caller-controlled or uncontrolled open state. */
export type ComboboxPopupProps =
  | {
      defaultOpen?: boolean;
      /** Called after the popup's open state changes. */
      onOpenChange?: (open: boolean) => void;
      open?: never;
      trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
      triggerRef?: React.Ref<HTMLButtonElement>;
    }
  | {
      defaultOpen?: never;
      /** Called after the popup's open state changes. */
      onOpenChange?: (open: boolean) => void;
      open: boolean;
      trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
      triggerRef?: React.Ref<HTMLButtonElement>;
    };

/** Combobox selection shape: single or multiple, controlled or uncontrolled. */
export type ComboboxValueProps<T> =
  | ((
      | {
          defaultValue?: never;
          value: null | string;
        }
      | {
          defaultValue?: null | string;
          value?: never;
        }
    ) & {
      multiple?: false;
      /** Called with the newly selected key and item, or null when cleared. */
      onValueChange?: (value: null | string, item: null | T) => void;
    })
  | {
      multiple: true;
      value: readonly string[];
      defaultValue?: never;
      /** Called with the newly selected keys and items. */
      onValueChange?: (value: string[], items: T[]) => void;
    };

type ComboboxControllerOptions<T> = {
  defaultOpen: boolean;
  defaultValue: null | string;
  /** Stable identity used to track an item across renders. */
  getKey: (item: T) => string;
  getSearchText: (item: T) => string;
  groupBy: ((item: T) => string) | undefined;
  id: string;
  isDisabled: (item: T) => boolean;
  items: readonly T[];
  onOpenChange: ((open: boolean) => void) | undefined;
  onCommit: (item: T) => void;
  multiple: boolean;
  controlledOpen: boolean | undefined;
  controlledKeys: readonly string[] | undefined;
  trigger: ReactElement | undefined;
};

type ComboboxGroup<T> = {
  label: string;
  items: readonly T[];
};

function useComboboxController<T>({
  defaultOpen,
  defaultValue,
  getKey,
  getSearchText,
  groupBy,
  id,
  isDisabled,
  items,
  onOpenChange,
  onCommit,
  multiple,
  controlledOpen,
  controlledKeys,
  trigger,
}: ComboboxControllerOptions<T>) {
  const listboxId = `${id}-listbox`;
  const [query, setQuery] = useState("");
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState<null | string>(
    defaultValue,
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const selectedKeys =
    controlledKeys ?? (uncontrolledValue === null ? [] : [uncontrolledValue]);
  const open = trigger ? (controlledOpen ?? uncontrolledOpen) : true;
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? items.filter((item) =>
          getSearchText(item).toLowerCase().includes(normalizedQuery),
        )
      : items;
  }, [getSearchText, items, query]);
  const collection = useSelectableCollection({
    getKey,
    isDisabled,
    items: filtered,
  });

  useEffect(() => {
    if (collection.activeKey !== null) return;
    const initial =
      collection.enabledItems.find((item) =>
        selectedKeys.includes(getKey(item)),
      ) ?? collection.enabledItems[0];
    if (initial) collection.setActiveKey(getKey(initial));
  }, [
    collection.activeKey,
    collection.enabledItems,
    collection.setActiveKey,
    getKey,
    selectedKeys,
  ]);

  const setOpen = (next: boolean) => {
    setKeyboardNavigation(false);
    if (!next) setQuery("");
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const optionId = (key: string) =>
    `${listboxId}-option-${encodeURIComponent(key)}`;
  const commit = (item: T) => {
    const next = getKey(item);
    if (controlledKeys === undefined) setUncontrolledValue(next);
    onCommit(item);
    if (trigger && !multiple) setOpen(false);
  };
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyboardNavigation(true);
    setQuery(event.target.value);
    collection.setActiveKey(null);
  };
  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isImeComposing(event)) return;
    let move: readonly [-1 | 1, "end" | "start" | undefined] | undefined;
    switch (event.key) {
      case "ArrowDown":
        move = [1, undefined];
        break;
      case "ArrowUp":
        move = [-1, undefined];
        break;
      case "End":
        move = [1, "end"];
        break;
      case "Home":
        move = [-1, "start"];
        break;
    }
    if (move) {
      setKeyboardNavigation(true);
      event.preventDefault();
      collection.move(move[0], move[1]);
    } else if (event.key === "Enter" && collection.activeItem) {
      event.preventDefault();
      commit(collection.activeItem);
    }
  };
  const groups = useMemo<readonly ComboboxGroup<T>[]>(() => {
    if (!groupBy) return [{ label: "", items: filtered }];
    const grouped = new Map<string, T[]>();
    for (const item of filtered) {
      const label = groupBy(item);
      const group = grouped.get(label);
      if (group) group.push(item);
      else grouped.set(label, [item]);
    }
    return [...grouped].map(([label, groupItems]) => ({
      label,
      items: groupItems,
    }));
  }, [filtered, groupBy]);

  return {
    keyboardNavigation,
    onPointerMove: () => {
      setKeyboardNavigation(false);
    },
    activeKey: collection.activeKey,
    activeItem: collection.activeItem,
    groups,
    inputValue: query,
    listboxId,
    onInputChange,
    onInputKeyDown,
    optionId,
    open,
    commit,
    selectedKeys,
    setOpen,
  };
}

/** A searchable selection primitive with caller-owned values and intrinsic keyboard navigation. */
export function Combobox<T>(props: ComboboxProps<T>) {
  const {
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-required": required,
    activeTone = "neutral",
    container,
    contentClassName,
    defaultOpen = false,
    defaultValue = null,
    emptyMessage = "No matches",
    getKey,
    getLabel,
    getSearchText = getLabel,
    groupBy,
    id: providedId,
    inputProps,
    inputRef,
    isDisabled = () => false,
    items,
    onOpenChange,
    onValueChange,
    multiple,
    open: controlledOpen,
    placeholder = "Search…",
    renderItem,
    rootRef,
    trigger,
    triggerRef,
    value: controlledValue,
    ...rootProps
  } = props;
  // Keep the public single/multiple callback types correlated at this boundary.
  const onCommit = (item: T) => {
    const key = getKey(item);
    if (multiple) {
      const next = controlledValue.includes(key)
        ? controlledValue.filter((value) => value !== key)
        : [...controlledValue, key];
      onValueChange?.(
        next,
        items.filter((entry) => next.includes(getKey(entry))),
      );
    } else {
      onValueChange?.(key, item);
    }
  };
  let controlledKeys: readonly string[] | undefined;
  if (multiple) controlledKeys = controlledValue;
  else if (controlledValue !== undefined)
    controlledKeys = controlledValue === null ? [] : [controlledValue];
  const generatedId = useId();
  const controlProps = trigger?.props ?? inputProps;
  const id = providedId ?? controlProps?.id ?? generatedId;
  const selectionControlProps = {
    id,
    "aria-describedby":
      [describedBy, controlProps?.["aria-describedby"]]
        .filter(Boolean)
        .join(" ") || undefined,
    "aria-invalid": invalid ?? controlProps?.["aria-invalid"],
    "aria-label": controlProps?.["aria-label"] ?? label,
    "aria-labelledby": controlProps?.["aria-labelledby"] ?? labelledBy,
    "aria-required": required ?? controlProps?.["aria-required"],
  };
  const controller = useComboboxController({
    defaultOpen,
    defaultValue,
    getKey,
    getSearchText,
    groupBy,
    id,
    isDisabled,
    items,
    onOpenChange,
    onCommit,
    multiple: multiple ?? false,
    controlledOpen,
    controlledKeys,
    trigger,
  });
  const {
    keyboardNavigation,
    onPointerMove,
    activeItem,
    activeKey,
    commit,
    groups,
    inputValue,
    listboxId,
    onInputChange,
    onInputKeyDown,
    open,
    optionId,
    selectedKeys,
    setOpen,
  } = controller;
  useOverlayDismiss(() => {
    if (trigger) setOpen(false);
  });
  const overlay = useOverlayRoot("popover");
  const portalContainer = container === undefined ? overlay : container;
  const listRef = useGlide(
    '.caps-combobox-option[data-active="true"]:not(:disabled), [data-navigation="pointer"] .caps-combobox-option:hover:not(:disabled)',
  );
  const input = (
    <Input
      {...inputProps}
      {...(trigger ? {} : selectionControlProps)}
      aria-activedescendant={
        activeItem ? optionId(getKey(activeItem)) : undefined
      }
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-expanded={true}
      className={cn("input-sm", inputProps?.className)}
      id={trigger ? (inputProps?.id ?? `${id}-input`) : id}
      onChange={(event) => {
        inputProps?.onChange?.(event);
        onInputChange(event);
      }}
      onKeyDown={(event) => {
        inputProps?.onKeyDown?.(event);
        if (!event.defaultPrevented) onInputKeyDown(event);
      }}
      placeholder={inputProps?.placeholder ?? placeholder}
      ref={inputRef}
      role="combobox"
      value={inputValue}
    />
  );
  const list = (
    <div
      id={listboxId}
      ref={listRef}
      className="caps-combobox-list"
      data-navigation={keyboardNavigation ? "keyboard" : "pointer"}
      onPointerMove={onPointerMove}
      role="listbox"
      aria-multiselectable={multiple ?? undefined}
    >
      {groups.every((group) => group.items.length === 0) ? (
        <div className="px-md py-md text-sm text-base-content">
          {emptyMessage}
        </div>
      ) : (
        groups.map((group) => (
          <div
            aria-label={group.label || undefined}
            key={group.label}
            role={group.label ? "group" : undefined}
          >
            {group.label ? (
              <div className="px-md pb-xs pt-sm text-xs text-base-content uppercase tracking-wider">
                {group.label}
              </div>
            ) : null}
            {group.items.map((item) => {
              const key = getKey(item);
              const disabled = isDisabled(item);
              const active = activeKey === key;
              const state = {
                active,
                disabled,
                selected: selectedKeys.includes(key),
              };
              return (
                <button
                  aria-disabled={disabled || undefined}
                  aria-selected={state.selected}
                  className="caps-combobox-option"
                  data-active={active && keyboardNavigation}
                  disabled={disabled}
                  id={optionId(key)}
                  key={key}
                  onClick={() => {
                    commit(item);
                  }}
                  onMouseDown={(event) => {
                    // Keep typing in the search field after a pointer selection.
                    event.preventDefault();
                  }}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  <span aria-hidden="true" className="caps-combobox-check">
                    {state.selected ? <Check /> : null}
                  </span>
                  {renderItem?.(item, active, state) ?? getLabel(item)}
                </button>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
  if (!trigger)
    return (
      <div {...rootProps} className={cn(rootProps.className)} ref={rootRef}>
        <div
          className={cn("caps-combobox-panel", contentClassName)}
          data-active-tone={activeTone}
        >
          <div className="caps-combobox-search">{input}</div>
          {list}
        </div>
      </div>
    );
  return (
    <div {...rootProps} className={cn(rootProps.className)} ref={rootRef}>
      <BasePopover.Root modal onOpenChange={setOpen} open={open}>
        <BasePopover.Trigger
          {...selectionControlProps}
          aria-haspopup="dialog"
          className="btn"
          ref={triggerRef}
          render={trigger}
        />
        {portalContainer !== null ? (
          <BasePopover.Portal container={portalContainer}>
            <BasePopover.Positioner align="start" side="bottom" sideOffset={4}>
              <BasePopover.Popup
                data-active-tone={activeTone}
                className={cn(
                  "min-w-40 rounded-box border border-base-300 bg-base-100 p-xs shadow-lg outline-none caps-combobox-panel caps-combobox-popup",
                  contentClassName,
                )}
              >
                <div className="caps-combobox-search">{input}</div>
                {list}
              </BasePopover.Popup>
            </BasePopover.Positioner>
          </BasePopover.Portal>
        ) : null}
      </BasePopover.Root>
    </div>
  );
}
