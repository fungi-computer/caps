import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { cn } from "../lib/cn.js";
import { useGlide } from "../lib/glide.js";
import { useSelectableCollection } from "./selectable.js";

/** Intrinsic focus and selection state supplied when rendering a Listbox item. */
export type ListboxItemState = {
  active: boolean;
  disabled: boolean;
  selected: boolean;
};

/** Props accepted by Listbox. */
export type ListboxProps<T, Multiple extends boolean = false> = {
  emptyMessage?: ReactNode;
  /** Returns the stable key used for focus and selection. */
  getKey: (item: T) => string;
  /** Returns the accessible label used for an item. */
  getLabel: (item: T) => string;
  /** Determines whether an item can receive focus or selection. */
  isDisabled?: (item: T) => boolean;
  items: readonly T[];
  /** Receives the selection control's root div. */
  rootRef?: React.Ref<HTMLDivElement>;
  /** Renders an item with its intrinsic focus and selection state. */
  renderItem?: (item: T, active: boolean, state: ListboxItemState) => ReactNode;
} & Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "onSelect" | "value"
> &
  (Multiple extends true
    ? {
        defaultValue?: ListboxValue<true>;
        multiple: true;
        /** Receives the next value and selected item after local interaction. */
        onValueChange?: (value: ListboxValue<true>, item: T[]) => void;
        value?: ListboxValue<true>;
      }
    : Multiple extends false
      ? {
          defaultValue?: ListboxValue;
          multiple?: false;
          /** Receives the next value and selected item after local interaction. */
          onValueChange?: (value: ListboxValue, item: null | T) => void;
          value?: ListboxValue;
        }
      : | {
            defaultValue?: ListboxValue;
            multiple?: false;
            /** Receives the next value and selected item after local interaction. */
            onValueChange?: (value: ListboxValue, item: null | T) => void;
            value?: ListboxValue;
          }
        | {
            defaultValue?: ListboxValue<true>;
            multiple: true;
            /** Receives the next value and selected item after local interaction. */
            onValueChange?: (value: ListboxValue<true>, item: T[]) => void;
            value?: ListboxValue<true>;
          });

/** Supported ListboxValue values. */
export type ListboxValue<Multiple extends boolean = false> =
  Multiple extends true ? string[] : null | string;

/** A selection primitive with caller-owned values and intrinsic keyboard navigation. */
export function Listbox<T>(input: ListboxProps<T, boolean>) {
  const {
    className,
    defaultValue,
    emptyMessage = "No options",
    getKey,
    getLabel,
    id: providedId,
    isDisabled = () => false,
    items,
    multiple,
    onClick,
    onKeyDown,
    renderItem,
    rootRef,
    value: controlledValue,
    ...props
  } = input;
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const root = useRef<HTMLDivElement | null>(null);
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    rootRef,
    () => root.current,
  );
  const glide = useGlide('[role="option"][data-active]');
  const attach = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      glide(node);
    },
    [glide],
  );
  const isMultiple = multiple === true;
  const initialValue: ListboxValue<boolean> = isMultiple ? [] : null;
  const [uncontrolledValue, setUncontrolledValue] = useState<
    ListboxValue<boolean>
  >(() => defaultValue ?? initialValue);
  const selectedValue = optionalValueOr(controlledValue, uncontrolledValue);
  const selectedKeys = selectedKeysFor(selectedValue, isMultiple);
  const collection = useSelectableCollection({ getKey, isDisabled, items });
  const { enabledItems } = collection;
  const firstSelected = items.find((item) =>
    selectedKeys.includes(getKey(item)),
  );
  const { activeKey, activeItem, setActiveKey } = collection;
  const activeEnabled = activeItem;
  const controlledSelection =
    controlledValue === undefined
      ? undefined
      : JSON.stringify(
          isMultiple ? [...new Set(selectedKeys)].sort() : selectedKeys,
        );
  const previousControlledSelection = useRef(controlledSelection);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || activeKey !== null) return;
    const initial = firstSelected ?? enabledItems[0];
    if (initial) {
      initialized.current = true;
      setActiveKey(getKey(initial));
    }
  }, [activeKey, enabledItems, firstSelected, getKey, setActiveKey]);
  useEffect(() => {
    if (
      controlledSelection !== undefined &&
      controlledSelection !== previousControlledSelection.current
    ) {
      const selectedItem = items.find(
        (item) => selectedKeys.includes(getKey(item)) && !isDisabled(item),
      );
      setActiveKey(selectedItem ? getKey(selectedItem) : null);
    }
    previousControlledSelection.current = controlledSelection;
  }, [controlledSelection, getKey, isDisabled, items, selectedKeys]);

  const commit = (item: T | undefined) => {
    if (!item || isDisabled(item)) return;
    const key = getKey(item);
    let nextKeys: string[];
    if (isMultiple) {
      nextKeys = selectedKeys.includes(key)
        ? selectedKeys.filter((selectedKey) => selectedKey !== key)
        : [...selectedKeys, key];
    } else {
      nextKeys = [key];
    }
    if (input.multiple) {
      if (controlledValue === undefined) setUncontrolledValue(nextKeys);
      input.onValueChange?.(
        nextKeys,
        items.filter((candidate) => nextKeys.includes(getKey(candidate))),
      );
    } else {
      const nextValue = nextKeys[0] ?? null;
      if (controlledValue === undefined) setUncontrolledValue(nextValue);
      input.onValueChange?.(nextValue, item);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(activeEnabled);
      return;
    }
    if (enabledItems.length === 0) return;
    if (event.key === "ArrowDown") collection.move(1);
    else if (event.key === "ArrowUp") collection.move(-1);
    else if (event.key === "Home") collection.move(-1, "start");
    else if (event.key === "End") collection.move(1, "end");
    else return;
    event.preventDefault();
  };

  return (
    <div
      {...props}
      aria-activedescendant={
        activeEnabled
          ? `${id}-option-${encodeURIComponent(getKey(activeEnabled))}`
          : undefined
      }
      aria-multiselectable={isMultiple ? true : undefined}
      className={cn(
        "max-h-72 w-full overflow-auto rounded-box border border-base-300 bg-base-100 p-xs shadow-lg focus-visible:outline-none focus-visible:ring-2 caps-focus-color",
        className,
      )}
      id={id}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      ref={attach}
      role="listbox"
      tabIndex={props.tabIndex ?? 0}
    >
      {items.length === 0 ? (
        <div className="px-md py-sm text-sm text-base-content">
          {emptyMessage}
        </div>
      ) : (
        items.map((item) => {
          const key = getKey(item);
          const disabled = isDisabled(item);
          const selected = selectedKeys.includes(key);
          const active = activeEnabled ? getKey(activeEnabled) === key : false;
          const state = { active, disabled, selected };
          return (
            <div
              aria-disabled={disabled || undefined}
              aria-selected={selected}
              data-active={(active && !disabled) || undefined}
              className={cn(
                "cursor-pointer rounded-field px-md py-sm text-sm outline-none",
                active && "bg-base-200",
                selected && "font-medium",
                disabled &&
                  "cursor-not-allowed bg-base-200 text-base-content outline outline-1 outline-dashed outline-base-300",
              )}
              id={`${id}-option-${encodeURIComponent(key)}`}
              key={key}
              onClick={(event) => {
                if (disabled) {
                  event.preventDefault();
                  return;
                }
                setActiveKey(key);
                commit(item);
              }}
              role="option"
            >
              {renderItem?.(item, active, state) ?? getLabel(item)}
            </div>
          );
        })
      )}
    </div>
  );
}

function selectedKeysFor(
  value: ListboxValue<boolean> | undefined,
  multiple: boolean,
): string[] {
  if (multiple) return Array.isArray(value) ? value.slice() : [];
  if (value === null || value === undefined || Array.isArray(value)) return [];
  return [value];
}

function optionalValueOr<Value>(
  value: Value | undefined,
  fallback: Value,
): Value {
  switch (value) {
    case undefined:
      return fallback;
    default:
      return value;
  }
}
