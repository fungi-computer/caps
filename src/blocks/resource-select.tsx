import { forwardRef, type ButtonHTMLAttributes, type JSX } from "react";

import { Combobox } from "../components/combobox.js";

/** Caller-provided resource option data. */
export type ResourceOption = {
  disabled?: boolean;
  id: string;
  label: string;
  searchText?: string;
};

/** Props accepted by ResourceSelect. */
export type ResourceSelectProps = {
  /** Called after an option is selected. */
  onSelect: (option: ResourceOption) => void;
  options: readonly ResourceOption[];
  placeholder?: string;
  /** Native caller metadata, including data-* attributes. */
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement> & DataAttributes;
  value?: string;
};

/** Native `data-*` attribute map accepted alongside typed props. */
export type DataAttributes = Record<
  `data-${string}`,
  boolean | number | string | undefined
>;

/** A resource-selection block with caller-owned options and selected value. */
export const ResourceSelect = forwardRef<
  HTMLButtonElement,
  ResourceSelectProps
>(function ResourceSelect(
  {
    onSelect,
    options,
    placeholder = "Select an option",
    triggerProps,
    value,
  }: ResourceSelectProps,
  ref,
): JSX.Element {
  const { className, ...nativeTriggerProps } = triggerProps ?? {};
  return (
    <Combobox
      triggerRef={ref}
      getKey={(item) => item.id}
      getLabel={(item) => item.label}
      getSearchText={(item) => item.searchText ?? item.label}
      isDisabled={(item) => item.disabled === true}
      items={options}
      onValueChange={(_next, item) => {
        if (item) onSelect(item);
      }}
      placeholder={placeholder}
      renderItem={(item) => <span>{item.label}</span>}
      value={value ?? null}
      trigger={
        <button
          {...nativeTriggerProps}
          className={[
            "btn btn-xs btn-ghost w-full justify-between text-left font-normal",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          type="button"
        >
          {options.find((item) => item.id === value)?.label ?? placeholder}
        </button>
      }
    />
  );
});
