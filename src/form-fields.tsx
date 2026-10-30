import {
  useField,
  useSelector,
  type AnyFieldApi,
  type AnyFormApi,
} from "@tanstack/react-form";
import { Option, Schema } from "effect";
import { Eye, EyeOff } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { Button } from "./components/button.js";
import { UploadQueue } from "./blocks/upload-queue.js";
import { Checkbox } from "./components/checkbox.js";
import { Combobox, ComboboxTrigger } from "./components/combobox.js";
import {
  Field,
  FieldSet,
  FormSection,
  NumberField,
} from "./components/field.js";
import { IconCheckbox } from "./components/icon-checkbox.js";
import { IconRadio } from "./components/icon-radio.js";
import { Input } from "./components/input.js";
import { InputGroup, InputGroupAddon } from "./components/input-group.js";
import {
  RadioGroup,
  RadioGroupCard,
  RadioGroupItem,
} from "./components/radio-group.js";
import { Select } from "./components/select.js";
import { Switch } from "./components/switch.js";
import { Textarea } from "./components/textarea.js";
import { VisuallyHidden } from "./components/visually-hidden.js";
import { fieldError } from "./form-error.js";
import type {
  FieldInput,
  FormValues,
  ResolvedField,
  ResolvedSection,
} from "./form-schema.js";
import type { SchemaFormModel } from "./schema-form.js";

// TanStack hands field values back untyped; each control reads its own kind.
const readText = Schema.decodeUnknownOption(Schema.String);
const readFlag = Schema.decodeUnknownOption(Schema.Boolean);
const readAmount = Schema.decodeUnknownOption(Schema.NullOr(Schema.Finite));
const readTexts = Schema.decodeUnknownOption(Schema.Array(Schema.String));
const filesSchema = Schema.Array(Schema.instanceOf(File));
const readFiles = Schema.decodeUnknownOption(filesSchema);
const inputSchema = Schema.Union([
  Schema.String,
  Schema.Finite,
  Schema.Boolean,
  Schema.Null,
  Schema.Undefined,
  Schema.Array(Schema.String),
  filesSchema,
]);
const readInput = Schema.decodeUnknownOption(inputSchema);
const text = (field: AnyFieldApi): string =>
  Option.getOrElse(readText(field.state.value), () => "");
const flag = (field: AnyFieldApi): boolean =>
  Option.getOrElse(readFlag(field.state.value), () => false);
const amount = (field: AnyFieldApi): number | null =>
  Option.getOrElse(readAmount(field.state.value), () => null);
const texts = (field: AnyFieldApi): readonly string[] =>
  Option.getOrElse(readTexts(field.state.value), (): readonly string[] => []);
const files = (field: AnyFieldApi): readonly File[] =>
  Option.getOrElse(readFiles(field.state.value), (): readonly File[] => []);
const input = (field: AnyFieldApi): FieldInput =>
  Option.getOrElse(readInput(field.state.value), (): FieldInput => null);

/** What Field wires onto its control: id, description, error and required. */
type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
  "aria-required"?: boolean | "true" | "false";
  required?: boolean;
};

type ControlState = {
  field: AnyFieldApi;
  spec: ResolvedField;
  locked: boolean;
};

function SecretInput({
  field,
  spec,
  locked,
  ...control
}: ControlState & ControlProps) {
  const [shown, setShown] = useState(false);
  return (
    <InputGroup>
      <Input
        {...control}
        name={spec.name}
        disabled={locked}
        type={shown ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        className="caps-field-secret"
        placeholder={spec.placeholder}
        readOnly={spec.readOnly}
        value={text(field)}
        onBlur={field.handleBlur}
        onChange={(event) => {
          field.handleChange(event.currentTarget.value);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={shown ? "Hide" : "Show"}
        aria-pressed={shown}
        disabled={locked}
        onClick={() => {
          setShown((current) => !current);
        }}
      >
        {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </InputGroup>
  );
}

const inputTypes = { text: "text", email: "email", url: "url", tel: "tel" };

/** The picker supplies File objects; queue rows use only their metadata. */
function FileInput({
  spec,
  field,
  locked,
  ...control
}: ControlState & ControlProps) {
  const selected = files(field);
  const disabled = locked || spec.readOnly === true;
  const picker = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-sm">
      <VisuallyHidden asChild>
        <input
          {...control}
          ref={picker}
          type="file"
          tabIndex={-1}
          required={control.required === true && selected.length === 0}
          name={spec.name}
          accept={spec.accept}
          multiple={spec.multiple}
          disabled={disabled}
          onBlur={field.handleBlur}
          onChange={(event) => {
            field.handleChange(Array.from(event.currentTarget.files ?? []));
            // The queue owns the selection display, including resets and removal.
            // Clear the native picker so choosing the same file fires another change.
            event.currentTarget.value = "";
          }}
        />
      </VisuallyHidden>
      <Button
        type="button"
        variant="outline"
        aria-label={`Choose files for ${spec.label}`}
        aria-describedby={control["aria-describedby"]}
        aria-invalid={control["aria-invalid"]}
        disabled={disabled}
        onBlur={field.handleBlur}
        onClick={() => {
          picker.current?.click();
        }}
      >
        Choose files
      </Button>
      <UploadQueue
        items={selected.map((file, index) => ({
          id: String(index),
          name: file.name,
          preview: { kind: "file" },
          progress: 0,
          progressLabel: `${String(file.size)} bytes`,
          statusLabel: "Selected",
          actions: disabled
            ? {}
            : {
                remove: {
                  label: "Remove",
                  accessibleLabel: `Remove ${file.name}`,
                },
              },
        }))}
        onRemove={(id) => {
          field.handleChange(
            selected.filter((_, index) => String(index) !== id),
          );
        }}
        onCancel={() => undefined}
        onRetry={() => undefined}
      />
    </div>
  );
}

/** One control, wired by the Field around it (Field clones these props in). */
function SpecControl({
  spec,
  field,
  locked,
  ...control
}: ControlState & ControlProps): ReactNode {
  const setText = (value: string) => {
    field.handleChange(value);
  };
  const shared = {
    ...control,
    name: spec.name,
    disabled: locked,
    onBlur: field.handleBlur,
  };
  switch (spec.kind) {
    case "text":
    case "email":
    case "url":
    case "tel":
      return (
        <Input
          {...shared}
          type={inputTypes[spec.kind]}
          inputMode={spec.kind === "text" ? undefined : spec.kind}
          autoComplete={spec.autoComplete}
          placeholder={spec.placeholder}
          maxLength={spec.maxLength}
          readOnly={spec.readOnly}
          value={text(field)}
          onChange={(event) => {
            setText(event.currentTarget.value);
          }}
        />
      );
    case "textarea":
      return (
        <Textarea
          {...shared}
          rows={spec.rows ?? 3}
          placeholder={spec.placeholder}
          maxLength={spec.maxLength}
          readOnly={spec.readOnly}
          value={text(field)}
          onChange={(event) => {
            setText(event.currentTarget.value);
          }}
        />
      );
    case "secret":
      return (
        <SecretInput {...control} field={field} spec={spec} locked={locked} />
      );
    case "money":
      return (
        <InputGroup>
          <InputGroupAddon className="caps-field-currency">
            {spec.currency ?? "USD"}
          </InputGroupAddon>
          <Input
            {...shared}
            inputMode="decimal"
            autoComplete="off"
            className="caps-field-amount"
            placeholder={spec.placeholder ?? "0.00"}
            readOnly={spec.readOnly}
            value={text(field)}
            onChange={(event) => {
              setText(event.currentTarget.value);
            }}
          />
        </InputGroup>
      );
    case "date":
      return (
        <Input
          {...shared}
          type="date"
          readOnly={spec.readOnly}
          value={text(field)}
          onChange={(event) => {
            setText(event.currentTarget.value);
          }}
        />
      );
    case "number":
      return (
        <NumberField
          {...shared}
          {...(spec.min === undefined ? {} : { min: spec.min })}
          {...(spec.max === undefined ? {} : { max: spec.max })}
          {...(spec.step === undefined ? {} : { step: spec.step })}
          {...(spec.unit === undefined ? {} : { unit: spec.unit })}
          {...(spec.wrap === undefined ? {} : { wrap: spec.wrap })}
          disabled={locked || spec.readOnly === true}
          decrementLabel={`Decrease ${spec.label}`}
          incrementLabel={`Increase ${spec.label}`}
          value={amount(field)}
          onValueChange={(value) => {
            field.handleChange(value);
          }}
        />
      );
    case "select":
      return (
        <Select
          {...shared}
          value={text(field)}
          onChange={(event) => {
            setText(event.currentTarget.value);
          }}
        >
          {spec.placeholder === undefined ? null : (
            <option value="" disabled>
              {spec.placeholder}
            </option>
          )}
          {spec.options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </Select>
      );
    case "combobox":
      return (
        <Combobox
          id={control.id ?? spec.name}
          aria-describedby={control["aria-describedby"]}
          aria-invalid={control["aria-invalid"]}
          aria-required={control["aria-required"]}
          items={spec.options}
          getKey={(option) => option.value}
          getLabel={(option) => option.label}
          isDisabled={(option) =>
            option.disabled || locked || spec.readOnly === true
          }
          value={text(field)}
          {...(spec.placeholder === undefined
            ? {}
            : { placeholder: spec.placeholder })}
          trigger={
            <ComboboxTrigger
              name={spec.name}
              disabled={locked || spec.readOnly === true}
              onBlur={field.handleBlur}
            >
              {spec.options.find((option) => option.value === text(field))
                ?.label ??
                spec.placeholder ??
                "Choose…"}
            </ComboboxTrigger>
          }
          inputProps={{
            "aria-label": `Search ${spec.label}`,
            disabled: locked || spec.readOnly === true,
          }}
          onValueChange={(value) => {
            setText(value ?? "");
            field.handleBlur();
          }}
        />
      );
    case "file":
      return (
        <FileInput {...control} spec={spec} field={field} locked={locked} />
      );
    case "checkbox":
      return (
        <Checkbox
          {...shared}
          disabled={locked || spec.readOnly === true}
          checked={flag(field)}
          onChange={(event) => {
            field.handleChange(event.currentTarget.checked);
          }}
        />
      );
    case "switch":
      return (
        <Switch
          {...shared}
          disabled={locked || spec.readOnly === true}
          checked={flag(field)}
          onCheckedChange={(checked) => {
            field.handleChange(checked);
          }}
        />
      );
    case "radio":
    case "icon-radio":
    case "checkboxes":
    case "icon-checkboxes":
      return null;
  }
}

const groupKinds = new Set([
  "radio",
  "icon-radio",
  "checkboxes",
  "icon-checkboxes",
]);

/** Choice groups: a legend names the group; each option names its input. */
function SpecGroup({
  spec,
  field,
  locked,
  error,
  layout,
}: ControlState & {
  error: string | undefined;
  layout?: "columns" | undefined;
}) {
  const disabled = locked || spec.readOnly === true;
  const legend = spec.label;
  if (spec.kind === "checkboxes" || spec.kind === "icon-checkboxes") {
    const selected = texts(field);
    const toggle = (value: string, on: boolean) => {
      field.handleChange(
        on
          ? [...selected, value]
          : selected.filter((current) => current !== value),
      );
    };
    return (
      <FieldSet
        legend={legend}
        layout={layout}
        {...(layout === "columns" ? { legendTitle: legend } : {})}
        description={spec.help}
        disabled={disabled}
        error={error ?? null}
      >
        {spec.kind === "icon-checkboxes" ? (
          <div className="caps-field-icon-choices">
            {spec.options.map((option) => (
              <IconCheckbox
                key={option.value}
                name={spec.name}
                value={option.value}
                label={option.label}
                {...(option.caption === undefined
                  ? {}
                  : { caption: option.caption })}
                icon={option.icon}
                disabled={option.disabled}
                checked={selected.includes(option.value)}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  toggle(option.value, event.currentTarget.checked);
                }}
              />
            ))}
          </div>
        ) : (
          spec.options.map((option) => (
            <Field
              key={option.value}
              label={option.label}
              description={option.description}
              orientation="inline"
            >
              <Checkbox
                name={spec.name}
                value={option.value}
                disabled={option.disabled}
                checked={selected.includes(option.value)}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  toggle(option.value, event.currentTarget.checked);
                }}
              />
            </Field>
          ))
        )}
      </FieldSet>
    );
  }
  const cards = spec.options.some(
    (option) => option.description !== undefined || option.meta !== undefined,
  );
  return (
    <FieldSet
      legend={legend}
      layout={layout}
      {...(layout === "columns" ? { legendTitle: legend } : {})}
      description={spec.help}
      disabled={disabled}
      error={error ?? null}
    >
      <RadioGroup
        name={spec.name}
        aria-label={legend}
        value={text(field)}
        onValueChange={(next) => {
          field.handleChange(next);
          field.handleBlur();
        }}
        // Icon keys and choice cards sit in a wrapping row.
        orientation={
          spec.kind === "icon-radio" || cards ? "horizontal" : "vertical"
        }
      >
        {spec.options.map((option) =>
          spec.kind === "icon-radio" ? (
            <IconRadio
              key={option.value}
              value={option.value}
              label={option.label}
              {...(option.caption === undefined
                ? {}
                : { caption: option.caption })}
              icon={option.icon}
              disabled={option.disabled}
            />
          ) : cards ? (
            <RadioGroupCard
              key={option.value}
              value={option.value}
              title={option.label}
              description={option.description}
              meta={option.meta}
              disabled={option.disabled}
            />
          ) : (
            <Field key={option.value} label={option.label} orientation="inline">
              <RadioGroupItem value={option.value} disabled={option.disabled} />
            </Field>
          ),
        )}
      </RadioGroup>
    </FieldSet>
  );
}

/** The `render` bailout: the caller's control with the built-in wiring. */
function RenderedControl({
  spec,
  field,
  locked,
  error,
  render,
  ...control
}: ControlState &
  ControlProps & {
    error: string | undefined;
    render: NonNullable<ResolvedField["render"]>;
  }) {
  return render({
    name: spec.name,
    label: spec.label,
    help: spec.help,
    value: input(field),
    onChange: (value) => {
      field.handleChange(value);
    },
    onBlur: field.handleBlur,
    error,
    disabled: locked,
    // Field clones the id and descriptions in, so its label names the control.
    id: control.id ?? spec.name,
    "aria-describedby": control["aria-describedby"],
    "aria-invalid": error !== undefined,
  });
}

function SchemaField({
  form,
  spec,
  locked,
  layout,
}: {
  form: AnyFormApi;
  spec: ResolvedField;
  locked: boolean;
  layout?: "columns" | undefined;
}) {
  const field = useField({ form, name: spec.name });
  const submitted = useSelector(
    form.store,
    (state) => state.submissionAttempts > 0,
  );
  const error =
    field.state.meta.isBlurred || submitted
      ? fieldError(field.state.meta)
      : undefined;
  if (spec.render === undefined && groupKinds.has(spec.kind))
    return (
      <SpecGroup
        spec={spec}
        field={field}
        locked={locked}
        error={error}
        layout={layout}
      />
    );
  // A columns form chooses one rhythm; per-field layout hints only govern
  // the unchanged default presentation.
  const orientation =
    layout === "columns"
      ? spec.kind === "switch" || spec.kind === "checkbox"
        ? "horizontal"
        : "vertical"
      : spec.kind === "checkbox"
        ? "inline"
        : (spec.layout ?? (spec.kind === "switch" ? "row" : "stacked")) ===
            "row"
          ? "horizontal"
          : "vertical";
  return (
    <Field
      label={spec.label}
      {...(layout === "columns" ? { labelTitle: spec.label } : {})}
      description={spec.help}
      icon={spec.icon}
      orientation={orientation}
      error={error}
      {...(spec.required === undefined ? {} : { required: spec.required })}
      {...(spec.optional === undefined ? {} : { optional: spec.optional })}
    >
      {spec.render === undefined ? (
        <SpecControl spec={spec} field={field} locked={locked} />
      ) : (
        <RenderedControl
          spec={spec}
          field={field}
          locked={locked}
          error={error}
          render={spec.render}
        />
      )}
    </Field>
  );
}

/** Props accepted by FormFields. */
export type FormFieldsProps<V extends FormValues> = {
  model: SchemaFormModel<V>;
  /** Opt-in label/control grid for generated sections and groups. */
  layout?: "columns" | undefined;
  /** Render only these fields, in this order, without section headings. */
  names?: readonly (keyof V & string)[];
  /** Disable every field, such as while an uncertain request is retried. */
  disabled?: boolean;
};

const readValues = Schema.decodeUnknownOption(
  Schema.Record(Schema.String, inputSchema),
);

function Visible({
  form,
  spec,
  locked,
  layout,
}: {
  form: AnyFormApi;
  spec: ResolvedField;
  locked: boolean;
  layout?: "columns" | undefined;
}) {
  const when = spec.when;
  const shown = useSelector(form.store, (state) =>
    when === undefined
      ? true
      : when(
          Option.getOrElse(readValues(state.values), (): FormValues => ({})),
        ),
  );
  if (!shown) return null;
  return (
    <SchemaField form={form} spec={spec} locked={locked} layout={layout} />
  );
}

function SectionFields({
  form,
  section,
  locked,
  layout,
}: {
  form: AnyFormApi;
  section: ResolvedSection;
  locked: boolean;
  layout?: "columns" | undefined;
}) {
  const fields = section.fields.map((spec) => (
    <Visible
      key={spec.name}
      form={form}
      spec={spec}
      locked={locked}
      layout={layout}
    />
  ));
  return section.title === undefined ? (
    fields
  ) : (
    <FormSection
      title={section.title}
      description={section.description}
      layout={layout}
    >
      {fields}
    </FormSection>
  );
}

/**
 * Render a schema form's fields from its schema: every section in order, or
 * only `names` (for placing fields in Screen cells or custom layouts).
 */
export function FormFields<V extends FormValues>({
  model,
  names,
  disabled = false,
  layout,
}: FormFieldsProps<V>) {
  const form: AnyFormApi = model.form;
  if (names !== undefined)
    return names.map((name) => {
      const spec = model.description.fields.find(
        (field) => field.name === name,
      );
      return spec === undefined ? null : (
        <Visible
          key={name}
          form={form}
          spec={spec}
          locked={disabled}
          layout={layout}
        />
      );
    });
  return model.description.sections.map((section) => (
    <SectionFields
      key={section.id ?? ""}
      form={form}
      section={section}
      locked={disabled}
      layout={layout}
    />
  ));
}
