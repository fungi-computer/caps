# Caps (`@fungi.computer/caps`)

Caps is a React component library: accessible primitives such as buttons,
fields, dialogs, menus and comboboxes, plus presentation blocks such as a chat
composer, an app bar, window frames, status trays, game HUD pieces and editorial
print furniture. It is built on daisyUI and themed by
[Stipe](../stipe/README.md), so every component picks up its look from the
active `data-theme` instead of from component props.

Caps renders and handles interaction. It does not fetch, navigate, check out,
pick a model or know your data model. Your app owns state, effects, copy, routes
and policy, and passes them in as props, slots and callbacks.

## Install or set up

```sh
npm install @fungi.computer/caps react react-dom
```

Caps works with React 18 or 19 and ships as ESM. It brings
`@fungi.computer/stipe` along as a dependency.

There is no root import. Import each component from its own subpath, for example
`@fungi.computer/caps/components/button` or
`@fungi.computer/caps/blocks/composer`. The `exports` map in `package.json` is
the complete list.

Pick one stylesheet route:

- `@fungi.computer/caps/styles.css` is precompiled CSS with Stipe's themes and
  every class Caps uses. Import it once in your app entry. You do not need
  Tailwind for this route.
- `@fungi.computer/caps/tailwind.css` is the Tailwind v4 source, for hosts that
  compile Tailwind themselves and want Caps classes and their own utilities in
  one build. Import it from your main stylesheet and point Tailwind at the
  compiled components, for example
  `@source "../node_modules/@fungi.computer/caps/dist";`.

With an asset bundler such as Vite, also import `@fungi.computer/caps/fonts.css`
to load the bundled Nunito, Maple Mono and display fonts.

## Quick start

A small notes form with a Caps button, the Composer block and a status bead.
Mount `NoteComposer` from any React root.

```tsx
import { useState, type FormEvent } from "react";
import { Button } from "@fungi.computer/caps/components/button";
import { Status } from "@fungi.computer/caps/components/status";
import { Composer } from "@fungi.computer/caps/blocks/composer";
import "@fungi.computer/caps/styles.css";

export function NoteComposer() {
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = draft.trim();
    if (!note) return;
    setNotes((current) => [...current, note]);
    setDraft("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-md p-lg">
      <Status
        label={`${notes.length} notes`}
        tone={notes.length > 0 ? "success" : "neutral"}
      />
      <Composer
        input={
          <input
            className="input join-item w-full"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Note"
          />
        }
        action={
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            Add
          </Button>
        }
      />
      <ul>
        {notes.map((note, index) => (
          <li key={index}>{note}</li>
        ))}
      </ul>
    </form>
  );
}
```

Set a theme on the page root, for example `<html data-theme="mocha">`. Without
one, the page follows the reader's light or dark setting.

## Core concepts

### Hosts own behaviour

Caps owns rendering plus the interaction, controlled or uncontrolled state,
focus, keyboard handling, teardown and accessibility that belong to a UI
primitive. Your app owns product data and state, authority, routes, persistence,
fetching, effects, commands, policy and copy. Blocks receive props, slots and
callbacks. They never fetch.

Components keep their native contracts. `Button` forwards native props and its
ref, adds `variant`, `size` and `loading`, and merges your `className` last.
`Checkbox`, `Switch` and `Progress` keep their native elements.

### Explicit subpaths

Every component, block, helper and stylesheet has its own subpath. There is no
barrel, alias or hidden provider, so you import exactly what you render and
nothing else ends up in your bundle.

### Overlay destinations

Menus, Combobox popups, dialogs, tooltips, notices and the AppBar dial portal
into the document body by default. A shell can provide `OverlayRoot` from
`@fungi.computer/caps/components/overlay-root` with `containers` for `popover`,
`dialog`, `toast` and `tooltip`. The shell owns their layout and paint order;
Caps owns interaction and chooses the semantic destination. A null destination
waits for the shell root to mount, including during server rendering. Base UI
menu, Combobox and dialog portals still accept explicit container overrides.

In body mode, isolate the App root so page controls cannot paint over portaled
dialogs. Agar's `mountApp` does this. Dialogs and menus rank by portal order;
tooltips and toasts use their Stipe layers.

A portaled menu opened from a dialog inside Tourtois is not covered by this
body-mode policy: its isolated popover layer ranks below the dialog layer. No
current consumer uses that combination. Such a consumer needs a Caps
portal-into-dialog composition, with its collision boundary kept separate from
its portal container.

A shell can also supply `subscribeDismiss` to `OverlayRoot`. When the host
reports blur or child-surface focus, menus, Combobox popups, App dials and
tooltips close together. Dialogs and notices stay mounted. The subscription
retires with the component; standalone components retain their ordinary
dismissal behavior.

### Themes and CSS

Stipe ships a curated theme list, including Daisy `light` and `dark`. Choose a
palette or finish with `data-theme`; hosts can add their own presets. `latte`,
`mocha`, `field-guide`, `field-guide-night`, `embed`, `embed-dark`, `phosphor`,
`codec`, `pirate-radio` and `pirate-radio-night` are Stipe's maintained presets.

```html
<html data-theme="mocha">
  ...
</html>
```

Your CSS can add a preset or local treatment by overriding daisyUI or Stipe
variables. Keep it CSS-only:

```css
[data-theme="workbench"] {
  --color-primary: #8b5cf6;
  --color-primary-content: #ffffff;
  --stipe-surface: var(--color-base-200);
  --stipe-fg-muted: #4c4f69;
}
```

Card variants describe structure and interaction (`surface`, `outline`,
`interactive`, `game`, `fit`). Use `featured` to emphasize an item or
`state="empty"` for absent content. The nested Stipe `vishnu` finish supplies
Vishnu's gradient faces, stage frames, hard shadows and hover motion while
retaining the host palette. An ordinary surface card inside that finish keeps
its normal face, so play controls remain independent of the stage.

`@fungi.computer/caps/blocks/game-share-card` composes a published game's
`heading`, optional `eyebrow` and `cover`, body children, and a primary `action`
element. The host supplies the link, cover alt text, data and copy behavior; the
block owns their layout. Set `data-theme="vishnu"` on the block for the Vishnu
finish.

Caps reads its material from the theme vocabulary below. Choose the look with
`data-theme`. Do not layer component CSS over Caps.

| Token                                                                                                                              | Caps material role                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| daisyUI `--depth`                                                                                                                  | Scales molded highlights, bevels, recesses, and elevation shadows. `1` preserves the molded latte/mocha material. `0` removes dimensional effects for flat linework. |
| daisyUI `--border`                                                                                                                 | Structural border and linework thickness.                                                                                                                            |
| daisyUI `--radius-field`, `--radius-selector`, `--radius-box`                                                                      | Caps control, selection, and container corner geometry.                                                                                                              |
| daisyUI `--color-base-*`, `--color-base-content`, `--color-neutral`, semantic colors                                               | Surface faces, ink, neutral controls, and state accents.                                                                                                             |
| Stipe `--stipe-linework`                                                                                                           | Structural line color. The default follows `--color-base-300`, while field-guide uses ink.                                                                           |
| Stipe `--card-paper`, `--card-rule`, `--card-ink`, `--card-rule-width`                                                             | Collector card faces, ruled borders, text, and frame weight.                                                                                                         |
| Stipe `--card-frame`, `--card-frame-ink`, `--card-accent`, `--card-window`, `--card-window-ink`, `--card-texture`, `--card-shadow` | Card frame band and its ink, the accent rule and series mark, the art window stock and its ink, paper grain, and the single drop shadow.                             |
| Stipe `--font-display`                                                                                                             | Fraunces, the self-hosted display serif for headlines, decks, card titles and flavor text.                                                                           |
| Stipe `--font-nameplate`                                                                                                           | Grenze Gotisch, the self-hosted blackletter for a Masthead's nameplate.                                                                                              |
| Stipe `--newsprint-column-rule`, `--marginalia-ink`                                                                                | Issue column separators and notes in the margin.                                                                                                                     |
| Stipe `--growth-spore`, `--growth-mycelium`, `--growth-fruiting`                                                                   | Growth-stage badge colors.                                                                                                                                           |

Caps adds no parallel material vocabulary, because daisyUI already supplies
depth, border weight, radii and semantic colors. `field-guide` sets
`--depth: 0`, thin borders, small radii, cream paper colors and muted naturalist
accents. `field-guide-night` keeps the same material on dark blue-green paper
with cream ink.

`Screen` supplies display material and keeps the inherited interface font. Use
`font-mono` on machine values, identifiers and code, not on a whole screen. Use
opaque semantic tokens for text hierarchy and ordinary surfaces. Keep opacity
for real compositing such as scrims, overlays and visual effects.

Filled and outline buttons read finish tokens: `--caps-button-border-width`
(length), `--caps-button-weight` (font weight), `--caps-button-press` (active
travel), `--caps-button-drop` and `--caps-button-drop-active` (complete shadow
lists), and `--caps-button-cut` (a CSS clip path, `none` keeps the uncut
silhouette). A disabled filled button reads `--caps-button-disabled-opacity`,
`--caps-button-disabled-face`, `--caps-button-disabled-ink`,
`--caps-button-disabled-edge`, and `--caps-button-disabled-drop`. Unset tokens
keep the default rendering. Roles still choose the colour. Joined input actions
keep their shared seam.

### Class merging

`@fungi.computer/caps/lib/cn` merges classes with `cn@0.2.6` and Stipe's
[named spacing scale](https://stipe.shiit.app/concepts/#named-spacing). It
accepts conditional strings, arrays and objects and keeps caller-last Tailwind
overrides, so `cn("text-xs px-xs py-sm", "px-md")` gives
`"text-xs py-sm px-md"`. The helper keeps typography and spacing names apart.

### Forms

Every product form is built from the Caps form layer; Apps never hand-roll
labels, help text, errors, spacing or action rows. All parts live in
`@fungi.computer/caps/components/field` (plus `RadioGroupCard` in
`components/radio-group`). Validation stays with the caller (TanStack Form or
local state); Caps only presents it.

| Part             | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Form`           | The `<form>` with the field rhythm (16px between fields). `busy` disables every control through one fieldset and sets `aria-busy`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `FormSection`    | A titled group (`title`, `description`, `level`). Consecutive sections sit 32px apart with one quiet rule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `Field`          | Label, then help, then control, then error. Wires `id`, `htmlFor`, `aria-describedby` (keeping the caller's own ids), `aria-invalid` and `required`. `orientation="horizontal"` puts a switch opposite its copy (settings rows); `orientation="inline"` puts a checkbox before its copy. `icon` leads the copy with a decorative Sigil or App icon (hidden from assistive tech). A horizontal Field bounds a Select to 16rem, and at 480px and under drops a Select, Input or Textarea under its label. `readout` names a row whose child is a read-only Status rather than a control.                   |
| `FieldSet`       | A legend-named group of related choices (a list of inline checkbox `Field`s). `disabled` disables every choice. Use it, not a hand-rolled `<fieldset><legend>`.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `Label`          | `required` adds the asterisk; `optional` adds a quiet mono "Optional" readout. Mark whichever is rarer in the form.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `FieldError`     | The announced, collapsing error line. `Field` and `FormFooter` already render one.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `FormFooter`     | Exactly one primary `Button`, last; every other action is `ghost` or `outline`. `error` shows the submit error above the actions, `status` seats a quiet readout (a `Status` LED plus "Saved") opposite them, `layout="stretch"` stacks full-width actions for single-column cards, and `divider={false}` drops the rule on short inline forms. Under 24rem the actions share the row equally.                                                                                                                                                                                                           |
| `NumberField`    | A spinbutton: a native `input type="number"` between − and + keys (which stay on touch), with the value as a mono readout and an optional `unit`. `value`/`onValueChange` (committed values are clamped to `min`/`max`), `step`, `wrap`. Arrows step, Page Up/Down move ten steps, Home/End jump to min/max; typing commits on blur or Enter. Field wires label, description and error to the input. Stable parts (`caps-number-field`, `-decrement`, `-readout`, `-input`, `-unit`, `-increment`, plus `data-at-min`/`data-at-max`/`data-disabled`) let a context such as a Screen redraw it as a dial. |
| `RadioGroupCard` | A radio choice that needs a sentence or a readout (`title`, `description`, `meta`). Selection is ink, never the accent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

`IconCheckbox` (`components/icon-checkbox`) and `IconRadio`
(`components/icon-radio`, inside `RadioGroup`) accept an `icon` slot, a required
full `label`, and an optional short `caption`. Their native inputs retain refs,
Field descriptions/errors, keyboard selection, form submission and reset.
Selection shows the icon in colour and adds an ink lamp; off is a grey
silhouette. Caps does not depend on an icon library. Use the standard LIST, READ
(book-eye), WRITE (pencil), and RUN Sigils for Computer rights.

Rules:

- Controls share the field height (Daisy `--size-field`: 40px by default), so
  inputs, selects and the buttons beside them line up.
- Show a field's error inline once the person has left it or submitted; show
  server and network failures in `FormFooter error`.
- While submitting, set `Form busy` and the primary `Button loading`; never swap
  its label for "Please wait…".

```tsx
<Form aria-label="Computer settings" busy={saving} onSubmit={submit}>
  <FormSection title="Computer" description="How your Team sees it.">
    <Field label="Name" required error={nameError}>
      <Input value={name} onChange={onName} />
    </Field>
    <Field label="Notes" optional>
      <Textarea rows={3} />
    </Field>
  </FormSection>
  <FormFooter
    error={saveError}
    status={
      saved ? <Status tone="success" size="compact" label="Saved" /> : null
    }
  >
    <Button type="reset" variant="ghost">
      Cancel
    </Button>
    <Button type="submit" loading={saving}>
      Save changes
    </Button>
  </FormFooter>
</Form>
```

### TanStack Form bindings

The opt-in [`@fungi.computer/caps/form`](docs/api/form.md) subpath uses
`@tanstack/react-form` (1.33.2 in this workspace) and Effect 4 as optional
peers. Install both when using this subpath. The presentational components keep
their existing API.

`FormField` accepts TanStack's field options (`form`, typed nested `name`,
`validators`, listeners) plus Caps `label`, `description`, `required`,
`optional`, `orientation` and `className`. Its child receives the native field
API: bind the control's value, change and blur handlers there. Caps connects the
label, description and first readable error to that control. Errors appear after
blur or a submission attempt; TanStack retains validation timing.

`fieldError(meta)` reads the first nonempty string or Standard Schema issue
message, returning `undefined` when there is none. `effectValidator(schema)`
uses Effect's maintained `Schema.toStandardSchemaV1`, preserving nested issue
paths and decoded values. TanStack validates with that schema; submission values
remain TanStack's input values, so decode separately when saving transformed
data.

`SubmitFooter` subscribes to `canSubmit` and `isSubmitting`, renders a native
submit button, and keeps it disabled and busy until the submit promise settles.
It accepts `FormFooter` presentation props, a `label`, an additional `disabled`
condition and `buttonProps` for appearance. Keep mutation errors in its `error`
prop and await the actual mutation in `onSubmit`.

```tsx
import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { Form } from "@fungi.computer/caps/components/field";
import { Input } from "@fungi.computer/caps/components/input";
import {
  FormField,
  SubmitFooter,
  effectValidator,
} from "@fungi.computer/caps/form";

function Settings({ save }: { save: (name: string) => Promise<void> }) {
  const validator = effectValidator(
    Schema.Struct({ name: Schema.String.check(Schema.isMinLength(1)) }),
  );
  const form = useForm({
    defaultValues: { name: "" },
    validators: { onBlur: validator, onSubmit: validator },
    onSubmit: async ({ value }) => save(value.name),
  });
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(busy) => (
        <Form
          busy={busy}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.state.isSubmitting) void form.handleSubmit();
          }}
        >
          <FormField form={form} name="name" label="Name" required>
            {(field) => (
              <Input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(event.currentTarget.value)
                }
              />
            )}
          </FormField>
          <SubmitFooter form={form} label="Save" />
        </Form>
      )}
    </form.Subscribe>
  );
}
```

Workbench: `forms--form-anatomy`, `forms--number-field`, `forms--form-states`,
`forms--choice-cards`, `forms--form-footers`, `forms--field`, and
`forms--settings-rows` (settings as compact `DataList` rows of icon Fields).

### Schema forms

Forms are schema-first. The schema is the single source: it validates the raw
input, parses what the submit receives, and its annotations give each field's
label, kind, help, placeholder, options, order and section.
`<SchemaForm schema={…} />` renders the whole form; there is no field list.

```tsx
import { Schema } from "effect";
import { SchemaForm, Secret, field, sections } from "@fungi.computer/caps/form";

const computer = Schema.Struct({
  name: Schema.Trim.check(Schema.isMinLength(1)).annotate(
    field({ required: true, section: "identity" }),
  ),
  token: Secret.annotate(field({ label: "Deploy token", section: "access" })),
  region: Schema.Literals(["eu", "us"]).annotate(
    field({ options: { eu: "Europe (Helsinki)", us: "United States" } }),
  ),
  internet: Schema.Boolean.annotate(field({ label: "Internet access" })),
}).annotate(
  sections({ identity: { title: "Identity" }, access: { title: "Access" } }),
);

<SchemaForm
  schema={computer}
  defaultValues={{ name: "", token: "", region: "eu", internet: true }}
  onSubmit={async (value) =>
    (await save(value))
      ? undefined
      : { kind: "refused", fields: { name: "Taken." } }
  }
  discardLabel="Discard"
  aria-label="Computer"
/>;
```

- **Schemas:** an Effect `Schema.Struct` (house path; annotate with
  `.annotate(field({ … }))`) or a Zod object (annotate with
  `.meta(field({ … }))`). The form holds the schema's encoded (raw) values;
  `onSubmit` gets only the parsed value and returns nothing (saved),
  `{ kind: "saved", values?, message? }` or
  `{ kind: "refused", error?, fields? }`. Field refusals land on their fields
  and clear when the field changes.
- **Kinds are inferred, annotations win:** String → text; Number (or
  `NullOr(Number)`) → number; Boolean → switch; a literal union → radio (≤ 3
  options, or options with a `description`/`meta` → choice cards), select
  (4–12), or searchable `combobox` (more than 12); options with an `icon` → icon
  keys; an array of literals → checkboxes (icon keys with icons); `Secret` →
  secret. `kind` overrides: `email`, `url`, `tel`, `textarea`, `secret`, `money`
  (`currency`), `date`, `select`, `combobox`, `radio`, `checkbox`, `switch`,
  `file`, and the icon variants. `combobox` uses literal choices or annotated
  `options` and keeps a string value.
- **Files:** annotate `Schema.Array(Schema.instanceOf(File))` (or
  `z.array(z.file())`) with `kind: "file"`, `accept`, `multiple` and `maxBytes`.
  The raw value is `readonly File[]`; a Caps “Choose files” button opens the
  visually hidden, accessible native picker and feeds UploadQueue rows. The
  schema enforces size (Effect `.check()` or Zod `.max()` on each file), using
  the same byte limit as `maxBytes`; `accept` is a picker hint. Caps reads
  metadata only; the submit handler receives the File objects.
- **Annotations:** `label` (else the humanized key), `help`, `placeholder`,
  `section` + `order`, `layout: "row"` (settings row), `required`/`optional`,
  `icon`, `options` (labels, descriptions, meta, icons, captions), number
  `min`/`max`/`step`/`unit`, `readOnly`, `when(values)` for conditional fields.
  `sections({ … })` on the struct titles the groups, in order.
- **The bailout is `render`:** `field<number>({ render: (control) => … })` draws
  the control yourself and gets `value`, `onChange`, `onBlur`, `error`,
  `disabled`, `id` and `aria-*`; Caps still owns the label, help, error,
  validation and save bar. Precedence: `render` > `kind` > inferred kind.
- **Page state, not schema:** `SchemaForm` takes `submitLabel`, `discardLabel`,
  `allowClean`, `disabled` (lock every field), `footer` (replace the SaveBar;
  `null` drops it) and `children` (a custom layout: place fields with
  `<FormFields model names={["…"]} />`). Use `useSchemaForm(options)` and pass
  `model` when the page needs `useSchemaFormStatus(model)` (dirty, submitting)
  for a leave guard.

`FormField` / `SubmitFooter` remain the hand-wired path for forms that are not a
struct.

**Controls on a screen.** Inside a `Screen`/`Display` the same controls take the
screen context (tokens only, no new props): labels become tiny mono legends,
Switch/Checkbox/Slider go flat and calm, icon keys get a hairline and faint ink
tint so their colour Sigil is the only colour, and `NumberField` becomes an
encoder dial between hairline − / + keys. Lay an instrument out with
`ScreenHeader`, `ScreenCells` and `ScreenCell` (`components/surface`), and show
read-only rights with `IconLamp` / `IconLamps` (`components/icon-lamp`). Keep
the Save key under the glass. Workbench: `forms--declared-form`,
`forms--declared-form-states`, `forms--screen-instrument`, `forms--icon-lamps`.

### Destructive confirmations

`ConfirmAction` (`components/confirm-action`) owns confirmation, pending and
failure feedback. Use `mode="hold"` with `label`, `confirmLabel` (the spoken
hold instruction), and `onConfirm: () => Promise<void>`; use `mode="type"` with
a nonempty `phrase` and a destructive `confirmLabel`. Type mode opens a Dialog;
only an exact match enables submission. Escape or Cancel clears the phrase and
returns focus to the trigger. Pending actions cannot be dismissed or submitted
again. Resolve to finish (and close the Dialog); reject to keep it available for
retry. Optional `error` supplies safe failure copy; rejection details are never
rendered. The host still owns the request, idempotency and resource removal.
Workbench: `forms--confirm-actions` (choose Complete or Refuse).

### Button finish tokens

Filled and outline buttons inherit `--caps-button-border-width` (length),
`--caps-button-weight` (font weight), `--caps-button-press` (active travel),
`--caps-button-drop` and `--caps-button-drop-active` (complete shadow lists),
and `--caps-button-cut` (a CSS clip path; `none` keeps the uncut silhouette). A
disabled filled button also reads `--caps-button-disabled-opacity`,
`--caps-button-disabled-face`, `--caps-button-disabled-ink`,
`--caps-button-disabled-edge`, and `--caps-button-disabled-drop`, so a theme can
show a flat disabled plate instead of a dimmed key. Unset tokens keep the
existing button rendering and native state behaviour. Roles still choose the
colour; a nested Stipe finish chooses these material values. Joined input
actions retain their stationary shared seam.

### Dialogs and menus

`Dialog` and `DropdownMenu` use Base UI's event details, focus management and
open state. Their styled parts accept Base UI's `render` composition and
state-based `className` callbacks. You can place the portal inside a window and
choose focus targets. When the container mounts with the overlay, pass the
mounted element through a React callback ref. Passing `null` keeps the portal
waiting for that element.

`DialogContent` is the convenient portal, backdrop and popup composition. It
keeps child state across closes by default. Its backdrop follows Base UI's full
modal mode. `modal={false}` and `modal="trap-focus"` have no backdrop. For a
different composition, use `DialogPortal`, `DialogBackdrop` and `DialogPopup`
directly. The raw portal keeps Base UI's default mount lifetime. You can retain
closing content with `details.preventUnmountOnClose()` and finish its animation
with the native `actionsRef.current.unmount()`.

`DropdownMenuContent` exposes placement and portal-container options. Use
`DropdownMenuPortal`, `DropdownMenuPositioner` and `DropdownMenuPopup` directly
for custom anchors or collision boundaries. Both overlays support
`interactionOwner="host"`: your app receives Escape and owns focus restoration.
Local overlays use Base UI's normal closing behaviour.

CSS inherits through the DOM, not through React portals. For a nested theme,
render popups into an unclipped container inside that theme.

### Selection contracts

Use `rootRef` to receive the root div of a generic `Combobox` or `Listbox`.
`Combobox` also exposes `inputRef` and `triggerRef` for its input and popup
trigger.

Import `ComboboxProps<T>` from `@fungi.computer/caps/components/combobox` and
`ResourceSelectProps` from `@fungi.computer/caps/blocks/resource-select`. Use
`Extract` or `Exclude` to select a mode, and indexed access to declare reusable
callbacks or native trigger metadata. The public props keep the inline or popup,
controlled or uncontrolled, and single or multiple constraints, so you need no
private aliases. The [selection contract notes](docs/selection-contract.md) have
worked examples.

### Windows

`WindowFrame`, `WindowHeader`, `WindowActions` and `WindowBody` draw a rounded
application window. Caps owns presentation, not a window manager. Your app
supplies positioning, active and floating state, drag-handle events and
lifecycle commands, and owns tiling, floating geometry and layout focus.
`GameWindowContent` adds padded reading rhythm for a game's headings, readouts
and action keys inside `WindowBody`.

Only the callbacks you pass produce action buttons. Omit `handleProps` for a
static title. Otherwise the title is a native button, separate from the actions.
Name the frame with `aria-label` or `aria-labelledby`. A window is a non-modal
section, not a dialog or focus trap. `WindowFrame data-theme="paper"` draws it
in an ink line with a hard offset shadow, for windows over a game world.

### Editorial and print components

Some components serve long-form, magazine-style pages. They read Stipe's card,
marginalia, growth and type tokens, so they look right in `field-guide`,
`field-guide-night` and the other editorial themes.

- `@fungi.computer/caps/components/field-guide`: `Keycap` (a native keyboard
  key), `StatusLed` (a static labelled light), `CartridgeLabel` (a ruled
  cartridge face) and `SpecimenLabel` (plate annotation, catalogue metadata,
  title and summary).
- `@fungi.computer/caps/components/technonomicon`: `CigaretteCard`, `Masthead`,
  `SectionBar`, `Folio`, `IssueMasthead`, `Spread` and related editorial pieces.

`CigaretteCard` is a framed collector card at the playing-card ratio 63:88. Its
content scales and clamps to fit instead of stretching the card: a display-serif
title and type line, a hexagonal series mark, an inset art window, a stat plate
on an accent rule, a flavor line and a collector line with an optional set
symbol. The reverse keeps the same frame around a ruled measurement ledger with
sources. `finish="full-art"` runs the drawing under paper panels inside an
accent border. A `null` stat value prints "not measured". Caps never invents a
number. Give a card `href` to make it a preview: a link to the card's own page
that shows only its face. The card on its own page is a pressed button that
turns over.

`Masthead` sets a nameplate in `--font-nameplate` blackletter with an optional
printed `mark`, a `tagline`, an `edition` line between a hairline and a double
rule, and two ears (`startEar`, `endEar`) that flank the nameplate on wide pages
and sit under it on phones. `size="front"` prints the large front-page head and
`size="running"` the smaller inner-page head. `SectionBar` is its section
navigation: small capitals between rules, the `current` section printed in
reverse, an optional letter `marker`, a `shortcut` announced through
`aria-keyshortcuts`, and `tools` at the end. It scrolls sideways on narrow pages
instead of wrapping. `Folio` is the running foot. `IssueMasthead` names its
`publication` in the kicker. `Spread layout="lead"` opens its first teaser
paragraph on a drop cap.

Server-rendered pages without React hydration can opt in to two small browser
enhancements. `enhanceCigaretteCards()` from
`@fungi.computer/caps/enhance/cigarette-card` makes click, tap, Enter and Space
toggle a card's `aria-pressed`, and ignores clicks a hydrated card already
handled. `sketch()` from `@fungi.computer/caps/enhance/sketch` draws rough.js
pencil marks inside every `[data-sketch-root]`. Mark inline text with
`data-sketch="circle"` or `data-sketch="underline"`, and a note with
`data-sketch-leader-x/y` to draw a leader to the `data-sketch-target` inside the
same `data-sketch-item`. The layout turns leaders on with
`--caps-sketch-leader: on`. Strokes use `currentColor`, so theme switches need
no redraw. `SpecimenLabel sketch` marks its plate and detail, and its ruled CSS
marks stay until the pencil layer draws.

Static sites (for example Astro) can use plain-HTML class contracts from the
stylesheet without React:

- Journal: `caps-meta` (catalogue line), `caps-entry-row` (contents row,
  `data-thumb="none"` without a plate), `caps-toc`, `caps-backlinks`,
  `caps-tool-call`, `caps-collage` (specimen sketchbook with `--art-*` and
  `--note-*` placement variables), `caps-note-teaser`, `caps-inset`
  (`data-align="end"` floats a card beside prose), `caps-nav-link`,
  `caps-shortcuts`, `caps-skip-link` and `caps-pencil-reveal`.
- Print: `caps-headline` (`data-size="banner|lead|story|brief"`), `caps-deck`,
  `caps-byline`, `caps-jump` (the "continued on" line), `caps-story-head`,
  `caps-section-head` (`data-size="front"` for a section front), `caps-edition`
  (children `data-edition-slot="lead|aside|wide"`, the aside ruled beside the
  lead), `caps-column-grid` (one ruled column per topic, `--caps-columns`),
  `caps-column-head`, `caps-column-empty`, `caps-brief`, `caps-box`,
  `caps-numeral`, `caps-print-prose` (display headings, pull-quote blockquotes,
  an ornamental break and, with `data-dropcap`, a drop cap) and
  `caps-live-portrait` (a live avatar traced by a host SVG filter whose
  `caps-live-portrait-ink` flood reads `--card-ink`).
  `caps-note-teaser[data-size="lead"]` sets a teaser as a front-page lead.
- Page turns: keyframes `caps-page-out`, `caps-page-in`, `caps-page-back-out`
  and `caps-page-back-in` are for your view transitions. Drop them under reduced
  motion.

## API reference

The generated [API reference](docs/api/README.md) documents every subpath:
`components/*`, `blocks/*`, `molecules/*`, `enhance/*`, `lib/*` and the opt-in
[`form` bindings](docs/api/form.md), with each component's props.

## Examples

### Button

```tsx
import { useRef } from "react";
import { Button } from "@fungi.computer/caps/components/button";

export function SaveButton({
  pending,
  onSave,
}: {
  pending: boolean;
  onSave: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <Button
      ref={ref}
      type="submit"
      aria-label="Save changes"
      disabled={pending}
      loading={pending}
      variant="outline"
      size="sm"
      className="transition-none rounded-full"
      onClick={onSave}
    >
      Save
    </Button>
  );
}
```

The caller's `transition-none` replaces the base transition utility, and
`rounded-full` adds a local treatment. daisyUI's `btn-outline` and color classes
compose, so color belongs in `variant` or an extra daisyUI class.

### Composer with an async submit

`Composer` is a layout block. Its input and action are your controls, and so are
their labels, disabled state, keyboard behaviour and effects. An avatar or other
leading content goes in the `leading` slot as any React node.

```tsx
import { useState, type FormEvent } from "react";
import { Button } from "@fungi.computer/caps/components/button";
import { Composer } from "@fungi.computer/caps/blocks/composer";

export function PromptComposer({
  submit,
}: {
  submit: (value: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim() || pending) return;
    setPending(true);
    try {
      await submit(value);
      setValue("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Composer
        input={
          <input
            className="input join-item w-full"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-label="Prompt"
          />
        }
        action={
          <Button
            type="submit"
            size="sm"
            disabled={pending || !value.trim()}
            loading={pending}
          >
            Send
          </Button>
        }
      />
    </form>
  );
}
```

`submit` is your effect. It can call an API, enqueue work or do something local.
Caps only joins the controls.

### Window

```tsx
import type { ReactNode } from "react";
import {
  WindowActions,
  WindowBody,
  WindowFrame,
  WindowHeader,
} from "@fungi.computer/caps/components/window";

export function NotesWindow({
  active,
  close,
  children,
}: {
  active: boolean;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <WindowFrame aria-label="Notes" active={active}>
      <WindowHeader
        title="Notes"
        actions={<WindowActions title="Notes" onClose={close} />}
      />
      <WindowBody>{children}</WindowBody>
    </WindowFrame>
  );
}
```

### App bar

`AppBar` keeps running apps visible to the left of an anchored launcher.
Clicking the launcher reveals available apps to the right and an optional
primary action above. You own app identity, icons, selected state and callbacks.
Caps owns disclosure, Anime.js springs, overflow and keyboard focus.

```tsx
import { AppBar } from "@fungi.computer/caps/blocks/app-bar";

export function Dock({
  openWindow,
  openSettings,
  createChat,
}: {
  openWindow: (id: string) => void;
  openSettings: () => void;
  createChat: () => void;
}) {
  return (
    <AppBar
      windows={[
        {
          id: "editor",
          label: "Editor",
          active: true,
          onSelect: () => openWindow("editor"),
        },
      ]}
      launchers={[
        { id: "settings", label: "Settings", onSelect: openSettings },
      ]}
      launcher={{ label: "Open apps" }}
      primaryAction={{
        label: "New chat",
        icon: <span aria-hidden="true">+</span>,
        onSelect: createChat,
      }}
    />
  );
}
```

Icons are React nodes. Narrow screens keep the same two scrollable trays. Escape
closes the disclosure and returns focus to the launcher. Reduced motion settles
immediately. Available-app and primary-action buttons do not claim toggle state.
`alwaysExpanded` keeps the disclosure open for dock layouts.

### Status beads and dashboard controls

`Status` is a gooey SVG bead. Set `glyph` (`dot`, `pill` or `bang`), `tone`, and
optional `motion` (`none`, `pulse` or `bounce`). Shape changes animate from the
current geometry with Anime.js, and reduced motion settles immediately. You map
your state to these props. An optional `label` renders beside the decorative
bead.

```tsx
import { Status } from "@fungi.computer/caps/components/status";

export function InboxBead({
  unread,
  selected,
}: {
  unread: boolean;
  selected: boolean;
}) {
  return (
    <>
      <Status
        glyph={unread ? "bang" : selected ? "pill" : "dot"}
        tone="primary"
      />
      <Status label="Working" tone="success" motion="pulse" />
    </>
  );
}
```

`IconButton` defaults to the Dashboard's ghost, circular, extra-small control.
It keeps its grid size on phones and touch screens; an invisible hit area
reaches `--caps-touch-target` instead. A disabled ghost button stays faceless
and dims to `--caps-disabled-ink`. Disabled filled buttons retain their color,
material and shape at reduced opacity, including invalid and pending form
submits. `Checkbox`, `Switch`, and `Progress` keep their native elements and
existing animations. `ScrollToBottomBlob` stays mounted beside a supplied
scroller and owns its visibility: show beyond 48px from the end, hide below 8px.
It defaults to forward DOM order (`direction="reverse"` supports
column-reverse). The host owns `onJump` and the appended-message `unread` count.
`focusAfterJump` optionally returns keyboard focus to the composer; otherwise
the scroller receives focus. Motion reads Stipe's spring-duration, bounce,
stretch and fast tokens. Reduced motion uses short opacity fades with no moving
beads or stretch. The Feedback story provides real scroll, unread-arrival and
jump scenarios.

### Status tray

`@fungi.computer/caps/blocks/status-tray` exports `StatusTray`,
`StatusTrayList`, `StatusTrayRow` and `StatusTrayNote`. You supply readouts and
content, own `openId` and handle actions. One tray opens at a time. Escape and
the close control return focus to its chip. Outside pointer presses close it
without stealing focus. Disabled items never open, and zero counts stay hidden.

```tsx
import { useState } from "react";
import { StatusTray } from "@fungi.computer/caps/blocks/status-tray";

export function PortsTray({ ports }: { ports: readonly string[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <StatusTray
      openId={openId}
      onOpenChange={setOpenId}
      items={[
        {
          id: "ports",
          label: "Ports",
          count: ports.length,
          tone: "success",
          content: (
            <ul>
              {ports.map((port) => (
                <li key={port}>{port}</li>
              ))}
            </ul>
          ),
        },
      ]}
    />
  );
}
```

An open tray is a calm popover list, with nothing boxed:

- `StatusTrayRow` is one line: the App's own `icon` (a Sigil, a Lucide glyph or
  a `Status`), the `primary` title, a muted `secondary` detail that truncates,
  then `actions`.
- Actions are quiet text buttons: `<Button variant="ghost" size="xs">`. A
  destructive one such as Stop uses `variant="ghost-destructive"`, which turns
  red on hover or focus. Give a row one action where you can.
- Precede a `StatusTrayList` with a `DataListHeading` for a small group label.
- `StatusTrayNote` is the empty state. It reads "All caught up." unless you pass
  other text. For an unavailable feed, give it a `title`; unavailable is not a
  zero count.
- The tray's close control is a plain `IconButton`. The host owns capability
  checks.

`leading` and `trailing` seat adjacent controls, and an item's `after` places
controls right after its chip in DOM and keyboard order. `align` chooses the
panel edge; `placement="screen"` uses flat screen-native readouts instead of
housing chips. The block has no product data, persistence or appearance variant.

Themes can set these tokens:

- `--caps-status-tray-chip-*` and `--caps-status-tray-count-bg`
- `--caps-status-tray-title-{case,tracking}` and `--caps-status-tray-width`
- `--caps-status-tray-key-{face,tint,height}`, for KeycapButtons beside the
  chips
- `--caps-status-tray-row-{height,hover,wrap}` and
  `--caps-status-tray-icon-size`
- `--caps-status-tray-chips-display`
- `--caps-status-tray-note-tracking` and `--caps-status-tray-muted`
- `--caps-status-tray-screen-{bg,fg,bg-active,fg-active}`

Defaults use existing Stipe tokens. The Ladle Status tray stories show the
maintained themes and a nested finish using the same props.

### Game pieces

Game UI reads the enclosing theme's `--card-ink` and `--card-paper`. The nested
`paper` finish supplies window linework, hard shadows, and control depth while
retaining that palette.

```tsx
import { KeycapButton } from "@fungi.computer/caps/components/keycap";
import { GameMeter } from "@fungi.computer/caps/components/progress";
import { PixelNumber } from "@fungi.computer/caps/components/pixel-number";
import {
  ItemGrid,
  type ItemGridCell,
  type ItemGridGhost,
  type ItemGridItem,
} from "@fungi.computer/caps/components/item-grid";

export function Hud({
  building,
  toggleBuild,
  items,
  ghost,
  pickUpOrDrop,
  previewDrop,
}: {
  building: boolean;
  toggleBuild: () => void;
  items: readonly ItemGridItem[];
  ghost: ItemGridGhost | null;
  pickUpOrDrop: (cell: ItemGridCell) => void;
  previewDrop: (cell: ItemGridCell | null) => void;
}) {
  return (
    <>
      <KeycapButton
        label="Build"
        shortcut="B"
        pressed={building}
        onClick={toggleBuild}
      />
      <GameMeter label="Hull" value={7} max={10} tone="success" />
      <PixelNumber text="08:00" size="lg" tone="primary" />
      <PixelNumber value={3} signed outline tone="success" />
      <ItemGrid
        label="Backpack"
        columns={8}
        rows={6}
        items={items}
        ghost={ghost}
        onCellActivate={pickUpOrDrop}
        onCellHover={previewDrop}
      />
    </>
  );
}
```

- `Keycap` is a native `kbd`. `KeycapButton` is a native button whose `shortcut`
  only labels the key. Passing `pressed` makes it a toggle with a lamp and
  `aria-pressed`. Your app owns the key binding. `tone` is a role: `primary` and
  `accent` tint the face from the theme colour, `inverse` is the dark key, and
  `destructive` stays neutral until hovered or focused. `label={null}` makes an
  icon-only key that needs an `aria-label`. The molded lip, sheen and press
  travel scale with `--depth`. Themes set
  `--caps-keycap-{face,ink,edge,tint,width,min-width,height,justify,padding,font-size,font-weight}`.
- `GameMeter` pairs a labelled native progress bar with the current and maximum
  values. The game supplies both values and the tone.
- `PixelNumber` draws a 3×5 face as SVG at integer scales and keeps the plain
  text for assistive tech. `outline` rings the lit pixels in the ink line so the
  number reads over any world.
- `ItemGrid` is presentation. Cells carry the keyboard and pointer interface
  (arrows, Home and End, Enter and Space), and items and the drop ghost are
  drawn from your facts. It never moves, merges or validates an item. A refused
  ghost shows your reason under the tray and describes the grid with it.
  `ItemSlot` is one paper-doll pocket.

Game HUD pieces inherit their material and controls from a surrounding
`data-theme="paper"` boundary. Nest it inside `field-guide` or
`field-guide-night`, then optionally nest an `ember` or `tide` tint. Cards and
plates do not reskin descendant Buttons. A complete nested palette can choose
its own control finish.

### Editorial pieces

```tsx
import { Keycap, StatusLed } from "@fungi.computer/caps/components/field-guide";
import {
  Folio,
  Masthead,
  SectionBar,
} from "@fungi.computer/caps/components/technonomicon";

export function FrontPage() {
  return (
    <>
      <Masthead
        href="/"
        wordmark="The Spore Print"
        tagline="Notes from a very strange forest."
        edition={["Saturday, September 26, 2026", "Issue I"]}
        sections={
          <SectionBar
            aria-label="Sections"
            sections={[{ href: "/", label: "Front Page", current: true }]}
          />
        }
      />
      <p>
        Press <Keycap>J</Keycap> for the next story.{" "}
        <StatusLed active label="Online" />
      </p>
      <Folio items={["The Spore Print", "Page A1"]} />
    </>
  );
}
```

On a server-rendered page, turn on card flips and pencil marks once in the
browser:

```ts
import { enhanceCigaretteCards } from "@fungi.computer/caps/enhance/cigarette-card";
import { sketch } from "@fungi.computer/caps/enhance/sketch";

enhanceCigaretteCards();
sketch();
```

## Limits and errors

- Caps has no root export. Importing `@fungi.computer/caps` itself fails. Use
  the subpaths.
- Caps is not a widget SDK and has no data layer. It does not implement product
  behaviour, publish a registry or deploy anything.
- `PixelNumber` throws on a non-finite number or a character it cannot draw.
- `ItemGrid` throws when item or ghost geometry does not fit the grid.
- `CigaretteCard` prints "not measured" for a `null` stat and never makes up a
  value.
- Popups render into the document body by default and take its theme. Pass a
  portal container inside a nested theme to keep that theme.
- Load Stipe's CSS once, through one of the two Caps stylesheet routes. Do not
  import Tailwind a second time or copy Stipe's token sheet into your app.
- The editable-source registry in `registry/` is generated inside this
  repository and has no hosted endpoint.

## Contribute and license

When you change Caps:

- Inspect the existing source, tests and host before editing.
- Preserve native semantics, refs, keyboard behaviour, visible focus and ARIA.
- Primitives and blocks receive props, slots and callbacks. They do not fetch.
- Keep product vocabulary, models, routes, defaults and side effects in hosts.
- Use explicit imports. Do not add a root barrel, alias, shim or deprecated
  export.
- Add or update tests and an example for every new public seam.

The tests cover native props and refs, caller-last classes, labelled fields,
controlled values, focus and keyboard behaviour, disabled options, Escape,
tooltip teardown, SSR, state blocks, upload-row presentation and gooey-filter
identity. From the monorepo root, run:

```sh
pnpm --dir packages/caps run lint
pnpm --dir packages/caps run typecheck
pnpm --dir packages/caps run test
pnpm --dir packages/caps run build
pnpm --dir packages/caps run docs
pnpm check:package -- @fungi.computer/caps
```

`pack`, `smoke`, the package-level `stranger` and
`pnpm verify:package -- @fungi.computer/caps` are release checks. Skip them
during ordinary development.

The component workbench is a Ladle site. Run `pnpm workbench:serve` from the
monorepo root to browse every component in each maintained theme, including
interactive Status, window, overlay, game-piece and status-tray stories.

The editable-source registry copies Caps source into a consumer instead of
importing the runtime package. To add a registry item, author the source under
`src/` with tests and an example, then add its metadata to `registry-source/`
(files, dependencies, registry dependencies and the Stipe CSS import). Add its
maintained story ID to `registry-source/workbench-coverage.json` and its
introduction to `workbench/guide.ts`. Generate the payloads and coverage, then
run the checks:

```sh
pnpm --filter @fungi.computer/caps registry:generate
pnpm --filter @fungi.computer/caps registry:check
pnpm --filter @fungi.computer/caps registry:stranger
```

`registry/`, `registry.json` and `workbench/coverage.json` are generated by
`registry:generate`. Do not edit them by hand. The ordinary package test checks
coverage freshness and registry inventory equality before any workbench build.
The registry stranger check installs every generated item into an isolated
fixture, checks local imports and dependencies, type-checks it and builds it. It
proves that a consumer can own the copied source without a Caps runtime import.
Caps depends on the real `@fungi.computer/stipe` package. Copied styles or an
alias are not a substitute.

Caps is MIT licensed, as declared in its `package.json`.
