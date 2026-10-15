# Selection contracts — PTL-1

The suspected published-contract weakness did not reproduce on Integration
`c45ec278f90911f3b7c71f8e5bf1a77810f5e480`. A consumer compiled against the
built package subpaths before any selection source or export changes. It could
name, extract and narrow the needed contracts using the existing public props.
No selection implementation or export change is justified by these findings.

## Use the public props

```ts
import type { ComboboxProps } from "@fungi.computer/caps/components/combobox";
import type { ResourceSelectProps } from "@fungi.computer/caps/blocks/resource-select";

type Computer = { computerId: string; name: string };
type Multiple = Extract<ComboboxProps<Computer>, { multiple: true }>;
type Single = Exclude<ComboboxProps<Computer>, { multiple: true }>;
type Controlled = Extract<Single, { value: string | null }>;
type Uncontrolled = Extract<Single, { value?: never }>;
type Inline = Extract<ComboboxProps<Computer>, { trigger?: never }>;
type TriggerProps = NonNullable<ResourceSelectProps["triggerProps"]>;

const onValueChange: NonNullable<Multiple["onValueChange"]> = (
  ids,
  computers,
) => {
  // ids: string[]; computers: Computer[]
};
```

For popup props, extract the branch with a required `trigger: ReactElement`.
`props.multiple` narrows values and callbacks; the presence of `props.trigger`
narrows inline versus popup props. Native input, root and button refs remain
part of the public component contract. `TriggerProps` keeps native button
attributes and `data-*` values of string, number, boolean or undefined.

Tourtois's `AppPermissionRow.tsx` uses an inferred multiple-selection callback
for Computers; `shell-commands.tsx` uses inline single selection for commands.
Caps' ResourceSelect workbench example supplies native ARIA and `data-*`
metadata. These callers need the published props, not the aliases used to
compose them. They were traced read-only.

## Disposition of the five finding pairs

| Public export         | Private alias         | Why it stays private                                                                                                            |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ComboboxProps`       | `ComboboxBaseProps`   | Shared item callbacks and native attributes are accessible through `ComboboxProps<T>`; no separate caller contract was missing. |
| `ComboboxProps`       | `ComboboxInlineProps` | `Extract` with an absent trigger selects the complete inline props, including item and value constraints.                       |
| `ComboboxProps`       | `ComboboxPopupProps`  | `Extract` with a required trigger selects the complete popup props and preserves controlled/uncontrolled opening constraints.   |
| `ComboboxProps`       | `ComboboxValueProps`  | `multiple` narrows the public union; `Extract`/`Exclude` and indexed access provide exact reusable value callbacks.             |
| `ResourceSelectProps` | `DataAttributes`      | Indexed access on `triggerProps` provides native metadata, including the existing `data-*` index signature.                     |

These are justified residual findings, not suppressions or exported aliases. The
focused private-type-leak scan remains **5 → 5**. All Caps findings remain **8 →
8**; the three excluded internal/workbench findings were not changed.
Private-type-leaks remain a supplementary inventory, outside G0.

## Contract proof

`src/components/selection-contract.test.tsx` imports only built public Caps
subpaths. TypeScript checks valid inline, popup, controlled, uncontrolled and
multiple examples, separately declared callbacks, JSX item inference, native
refs and trigger metadata. Negative type assertions reject incompatible opening
and value combinations, missing multiple values, incorrect callbacks/refs and
invalid metadata without suppression comments.

Build first, then check the consumer and declarations strictly:

```sh
pnpm turbo:run run build --filter=@fungi.computer/caps
pnpm --dir packages/caps run typecheck --skipLibCheck false
pnpm --dir packages/caps exec vitest run --config vitest.config.ts \
  src/components/selection-contract.test.tsx \
  src/components/combobox.test.tsx src/blocks/blocks.test.tsx
```

Vitest executes the fixture; the TypeScript command validates its type
assertions. This is a built-entrypoint contract proof, not a packed-publication
or browser proof. Selection source, generated registry payloads and styles stay
unchanged, so it claims no new visual behavior.
