import {
  Combobox,
  ComboboxTrigger,
  type ComboboxItemState,
  type ComboboxProps,
} from "@fungi.computer/caps/components/combobox";
import {
  ResourceSelect,
  type ResourceOption,
  type ResourceSelectProps,
} from "@fungi.computer/caps/blocks/resource-select";
import { createRef, type ReactElement } from "react";
import { expectTypeOf, it } from "vitest";

type Choice = { id: string; label: string; computerId: string };
type Props = ComboboxProps<Choice>;
type Single = Exclude<Props, { multiple: true }>;
type Multiple = Extract<Props, { multiple: true }>;
type Inline = Extract<Props, { trigger?: never }>;
type Popup = Extract<Props, { trigger: ReactElement }>;
type Controlled = Extract<Single, { value: string | null }>;
type Uncontrolled = Extract<Single, { value?: never }>;

const choice: Choice = {
  id: "home",
  label: "Home",
  computerId: "computer-home",
};
const base = {
  items: [choice],
  getKey: (item: Choice) => item.id,
  getLabel: (item: Choice) => item.label,
};

it("extracts selection modes and reusable callbacks from built public props", () => {
  const onSingleChange: NonNullable<Single["onValueChange"]> = (key, item) => {
    expectTypeOf(key).toEqualTypeOf<string | null>();
    expectTypeOf(item).toEqualTypeOf<Choice | null>();
  };
  const onMultipleChange: NonNullable<Multiple["onValueChange"]> = (
    keys,
    items,
  ) => {
    expectTypeOf(keys).toEqualTypeOf<string[]>();
    expectTypeOf(items).toEqualTypeOf<Choice[]>();
  };
  const inline = {
    ...base,
    defaultValue: "home",
    onValueChange: onSingleChange,
  } satisfies Inline;
  const controlled = {
    ...base,
    value: null,
    onValueChange: onSingleChange,
  } satisfies Controlled;
  const uncontrolled = { ...base, defaultValue: null } satisfies Uncontrolled;
  const popup = {
    ...base,
    trigger: <ComboboxTrigger>Choose</ComboboxTrigger>,
    defaultOpen: true,
    onOpenChange: (open) => expectTypeOf(open).toEqualTypeOf<boolean>(),
  } satisfies Popup;
  const controlledPopup = {
    ...base,
    trigger: <button>Choose</button>,
    open: false,
  } satisfies Popup;
  const multiple = {
    ...base,
    multiple: true,
    value: ["home"],
    onValueChange: onMultipleChange,
  } satisfies Multiple;
  void [inline, controlled, uncontrolled, popup, controlledPopup, multiple];

  function narrow(props: Props) {
    if (props.multiple) {
      expectTypeOf(props.value).toEqualTypeOf<readonly string[]>();
      expectTypeOf(props.onValueChange).toEqualTypeOf<
        Multiple["onValueChange"]
      >();
    } else {
      expectTypeOf(props.value).toEqualTypeOf<string | null | undefined>();
      expectTypeOf(props.onValueChange).toEqualTypeOf<
        Single["onValueChange"]
      >();
    }
    if (props.trigger) {
      expectTypeOf(props).toExtend<Popup>();
    } else {
      expectTypeOf(props).toExtend<Inline>();
    }
  }
  narrow(inline);
  narrow(popup);
  narrow(multiple);
});

it("rejects incompatible opening and value contracts without suppressions", () => {
  expectTypeOf<typeof base & { open: true }>().not.toExtend<Props>();
  expectTypeOf<typeof base & { defaultOpen: true }>().not.toExtend<Props>();
  expectTypeOf<
    typeof base & { onOpenChange: (open: boolean) => void }
  >().not.toExtend<Props>();
  expectTypeOf<
    typeof base & { trigger: ReactElement; open: true; defaultOpen: true }
  >().not.toExtend<Props>();
  expectTypeOf<
    typeof base & { value: string; defaultValue: string }
  >().not.toExtend<Props>();
  expectTypeOf<typeof base & { value: string[] }>().not.toExtend<Props>();
  expectTypeOf<
    typeof base & { multiple: true; value: string }
  >().not.toExtend<Props>();
  expectTypeOf<
    typeof base & { multiple: true; defaultValue: string[] }
  >().not.toExtend<Props>();
  expectTypeOf<typeof base & { multiple: true }>().not.toExtend<Props>();
  expectTypeOf<
    typeof base & { onValueChange: (key: number, item: Choice) => void }
  >().not.toExtend<Props>();
});

it("infers item callbacks and preserves native refs through public components", () => {
  const inputRef = createRef<HTMLInputElement>();
  const triggerRef = createRef<HTMLButtonElement>();
  const rootRef = createRef<HTMLDivElement>();
  const single = (
    <Combobox
      items={[choice]}
      getKey={(item) => {
        expectTypeOf(item).toEqualTypeOf<Choice>();
        return item.id;
      }}
      getLabel={(item) => item.label}
      getSearchText={(item) => item.computerId}
      renderItem={(item, active, state) => {
        expectTypeOf(item).toEqualTypeOf<Choice>();
        expectTypeOf(active).toEqualTypeOf<boolean>();
        expectTypeOf(state).toEqualTypeOf<ComboboxItemState>();
        return item.label;
      }}
      onValueChange={(key, item) => {
        expectTypeOf(key).toEqualTypeOf<string | null>();
        expectTypeOf(item).toEqualTypeOf<Choice | null>();
      }}
      value={null}
      rootRef={rootRef}
      inputRef={inputRef}
      triggerRef={triggerRef}
      trigger={<ComboboxTrigger ref={triggerRef}>Choose</ComboboxTrigger>}
    />
  );
  const multiple = (
    <Combobox
      {...base}
      multiple
      value={["home"]}
      onValueChange={(keys, items) => {
        expectTypeOf(keys).toEqualTypeOf<string[]>();
        expectTypeOf(items).toEqualTypeOf<Choice[]>();
      }}
    />
  );
  void [single, multiple];
  expectTypeOf<{ triggerRef: typeof inputRef }>().not.toExtend<
    Pick<Popup, "triggerRef">
  >();
  expectTypeOf<{ inputRef: typeof triggerRef }>().not.toExtend<
    Pick<Props, "inputRef">
  >();
});

it("extracts ResourceSelect trigger metadata and forwards native button types", () => {
  type TriggerProps = NonNullable<ResourceSelectProps["triggerProps"]>;
  const triggerProps = {
    "aria-label": "Choose resource",
    "data-conformance": "resource-select",
    "data-count": 2,
    "data-ready": true,
    "data-optional": undefined,
    disabled: false,
    onClick: (event) => {
      expectTypeOf(event.currentTarget).toExtend<HTMLButtonElement>();
    },
  } satisfies TriggerProps;
  const onSelect: ResourceSelectProps["onSelect"] = (option) => {
    expectTypeOf(option).toEqualTypeOf<ResourceOption>();
  };
  const ref = createRef<HTMLButtonElement>();
  const resource = (
    <ResourceSelect
      options={[choice]}
      onSelect={onSelect}
      triggerProps={triggerProps}
      ref={ref}
    />
  );
  void resource;
  expectTypeOf<{
    "data-invalid": { value: string };
  }>().not.toExtend<TriggerProps>();
  expectTypeOf<{ disabled: string }>().not.toExtend<TriggerProps>();
});
