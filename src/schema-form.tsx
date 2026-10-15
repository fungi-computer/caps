import {
  evaluate,
  useForm,
  useSelector,
  type AnyFieldApi,
  type AnyFormApi,
  type ReactFormExtendedApi,
  type StandardSchemaV1,
} from "@tanstack/react-form";
import { useMemo, useState, type ReactNode } from "react";

import { Button, type ButtonProps } from "./components/button.js";
import {
  Form,
  FormFooter,
  type FormFooterProps,
  type FormProps,
} from "./components/field.js";
import { Status } from "./components/status.js";
import { FormFields } from "./form-fields.js";
import {
  describeSchema,
  standardSchema,
  type FormDescription,
  type FormSchema,
  type FormValues,
} from "./form-schema.js";

/**
 * What a submit handler reports. Return nothing (or `saved`) when the change
 * landed; return `refused` with a form-level `error` and/or per-field `fields`
 * messages when the server said no. Field messages clear when that field
 * changes; the form message clears on the next change anywhere.
 */
export type SubmitResult<V extends FormValues> =
  | {
      readonly kind: "saved";
      /** The new baseline; defaults to the submitted values. Clear secrets here. */
      readonly values?: V;
      /** Replaces the default "Saved" readout. */
      readonly message?: string;
    }
  | {
      readonly kind: "refused";
      readonly error?: string;
      readonly fields?: Partial<Readonly<Record<keyof V & string, string>>>;
    };

/** Options accepted by useSchemaForm and an unbound SchemaForm. */
export type SchemaFormOptions<V extends FormValues, Out> = {
  /**
   * The single source: an Effect `Schema.Struct` (house path) or a Zod
   * object. It validates raw input, parses the submitted value, and its
   * annotations (`field`, `sections`) give labels, kinds, help, options,
   * order and grouping.
   */
  schema: FormSchema<V, Out>;
  /** The raw values to start from, such as the saved settings. */
  defaultValues: V;
  /** Receives the parsed value, never the raw input. */
  onSubmit: (
    value: Out,
    raw: V,
  ) =>
    | Promise<SubmitResult<V> | undefined>
    | Promise<void>
    | SubmitResult<V>
    | undefined;
};

/** The schema as TanStack validates it: raw values in, any output. */
export type Validator<V> = StandardSchemaV1<V, unknown>;

/** The TanStack form a schema form owns: typed values, schema validators. */
export type SchemaFormApi<V extends FormValues> = ReactFormExtendedApi<
  V,
  undefined,
  Validator<V>,
  undefined,
  undefined,
  undefined,
  Validator<V>,
  undefined,
  undefined,
  undefined,
  undefined,
  unknown
>;

/** The model returned by useSchemaForm and read by SchemaForm, FormFields and SaveBar. */
export type SchemaFormModel<V extends FormValues> = {
  /** The fields, kinds and sections read from the schema. */
  readonly description: FormDescription;
  /** TanStack's typed form: read values with `useSelector(model.form.store, …)`. */
  readonly form: SchemaFormApi<V>;
  /** The last refused submit's form-level message. */
  readonly error: string | null;
  /** The last landed submit's readout, until the next change. */
  readonly saved: string | null;
  /** Restore the baseline values and clear every message. */
  readonly discard: () => void;
  /** Submit through the schema; the same path as the native submit event. */
  readonly submit: () => Promise<void>;
};

const serverKey = "onServer";

function hasServerError(field: AnyFieldApi): boolean {
  return field.state.meta.errorMap.onServer !== undefined;
}

function clearServerError(field: AnyFieldApi) {
  field.setMeta((meta) => ({
    ...meta,
    errorMap: { ...meta.errorMap, [serverKey]: undefined },
  }));
}

function setServerError(form: AnyFormApi, name: string, message: string) {
  form.setFieldMeta(name, (meta) => ({
    ...meta,
    isBlurred: true,
    errorMap: { ...meta.errorMap, [serverKey]: message },
  }));
}

/**
 * One form, declared by its schema. TanStack owns field state and timing; the
 * schema owns validation and parses the submitted value; the handler only
 * sees parsed data and reports `saved` or `refused`.
 */
export function useSchemaForm<V extends FormValues, Out>(
  options: SchemaFormOptions<V, Out>,
): SchemaFormModel<V> {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  // The last saved values become the baseline until the caller's defaults
  // change; TanStack re-reads `defaultValues` on every render.
  const [source, setSource] = useState(options.defaultValues);
  const [savedBaseline, setSavedBaseline] = useState<V | null>(null);
  if (!evaluate(source, options.defaultValues)) {
    setSource(options.defaultValues);
    setSavedBaseline(null);
  }
  const { schema } = options;
  const description = useMemo(() => describeSchema(schema), [schema]);
  const validator: Validator<V> = useMemo(
    () => standardSchema(schema),
    [schema],
  );
  const form = useForm<
    V,
    undefined,
    Validator<V>,
    undefined,
    undefined,
    undefined,
    Validator<V>,
    undefined,
    undefined,
    undefined,
    undefined,
    unknown
  >({
    defaultValues: savedBaseline ?? source,
    validators: { onChange: validator, onSubmit: validator },
    listeners: {
      onChange: ({ fieldApi }) => {
        setError(null);
        setSaved(null);
        if (hasServerError(fieldApi)) clearServerError(fieldApi);
      },
    },
    onSubmit: async ({ value, formApi }) => {
      setError(null);
      setSaved(null);
      const parsed = await standardSchema(schema)["~standard"].validate(value);
      if (parsed.issues) {
        setError(parsed.issues[0]?.message ?? "Check the form and try again.");
        return;
      }
      const result = (await options.onSubmit(parsed.value, value)) ?? {
        kind: "saved",
      };
      if (result.kind === "refused") {
        setError(result.error ?? null);
        const wide: AnyFormApi = formApi;
        for (const [name, message] of Object.entries(result.fields ?? {}))
          if (message !== undefined && message.length > 0)
            setServerError(wide, name, message);
        return;
      }
      const baseline = result.values ?? value;
      setSavedBaseline(baseline);
      formApi.reset(baseline);
      setSaved(result.message ?? "Saved");
    },
  });
  return {
    description,
    form,
    error,
    saved,
    discard: () => {
      setError(null);
      setSaved(null);
      form.reset();
    },
    submit: () => form.handleSubmit(),
  };
}

/** Live status for leave guards and save bars. */
export type SchemaFormStatus = {
  /** Values differ from the baseline. */
  dirty: boolean;
  submitting: boolean;
  /** Validation allows a submit right now. */
  canSubmit: boolean;
};

/** Subscribe to a schema form's dirty and submitting state. */
export function useSchemaFormStatus<V extends FormValues>(
  model: SchemaFormModel<V>,
): SchemaFormStatus {
  const dirty = useSelector(model.form.store, (state) => !state.isDefaultValue);
  const submitting = useSelector(
    model.form.store,
    (state) => state.isSubmitting,
  );
  const canSubmit = useSelector(model.form.store, (state) => state.canSubmit);
  return { dirty, submitting, canSubmit };
}

/** How a SchemaForm presents its actions and state. */
export type SchemaFormPresentation = {
  /** The primary action's label; defaults to "Save changes". */
  submitLabel?: ReactNode;
  /** Show a Discard action while there are unsaved changes. */
  discardLabel?: ReactNode;
  /** Keep the primary action available on a clean form (create forms). */
  allowClean?: boolean;
  /** Replaces the SaveBar, such as a footer with a retry key; `null` drops it. */
  footer?: ReactNode;
  /**
   * Replaces the generated field list, for custom layouts such as Screen
   * cells: place fields with `<FormFields model names={[…]} />`.
   */
  children?: ReactNode;
  /** Disable every field, such as while an uncertain request is retried. */
  disabled?: boolean;
} & Omit<FormProps, "busy" | "onSubmit" | "noValidate" | "children">;

/** Props accepted by SchemaForm: a model from useSchemaForm, or its options. */
export type SchemaFormProps<
  V extends FormValues,
  Out,
> = SchemaFormPresentation &
  ({ model: SchemaFormModel<V> } | SchemaFormOptions<V, Out>);

function BoundSchemaForm<V extends FormValues>({
  model,
  submitLabel = "Save changes",
  discardLabel,
  allowClean,
  footer,
  children,
  disabled = false,
  ...props
}: SchemaFormPresentation & { model: SchemaFormModel<V> }) {
  const { submitting } = useSchemaFormStatus(model);
  return (
    <Form
      {...props}
      busy={submitting}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!model.form.state.isSubmitting) void model.submit();
      }}
    >
      {children ?? <FormFields model={model} disabled={disabled} />}
      {footer !== undefined ? (
        footer
      ) : (
        <SaveBar
          model={model}
          label={submitLabel}
          {...(discardLabel === undefined ? {} : { discardLabel })}
          {...(allowClean === undefined ? {} : { allowClean })}
        />
      )}
    </Form>
  );
}

function OwnedSchemaForm<V extends FormValues, Out>({
  schema,
  defaultValues,
  onSubmit,
  ...props
}: SchemaFormPresentation & SchemaFormOptions<V, Out>) {
  const model = useSchemaForm({ schema, defaultValues, onSubmit });
  return <BoundSchemaForm {...props} model={model} />;
}

/**
 * A whole form from its schema: fields, sections, validation, busy state and
 * the SaveBar. Pass `schema`, `defaultValues` and `onSubmit`, or a `model`
 * from useSchemaForm when the page needs its status or a custom layout.
 */
export function SchemaForm<V extends FormValues, Out>(
  props: SchemaFormProps<V, Out>,
) {
  return "model" in props ? (
    <BoundSchemaForm {...props} />
  ) : (
    <OwnedSchemaForm {...props} />
  );
}

/** Props accepted by SaveBar. */
export type SaveBarProps<V extends FormValues> = {
  model: SchemaFormModel<V>;
  /** The primary action, such as "Save changes" or "Create Team". */
  label: ReactNode;
  /** Show a Discard action while there are unsaved changes. */
  discardLabel?: ReactNode;
  /**
   * Keep the primary action available on a clean form (create forms that may
   * submit their defaults). By default a clean form has nothing to save.
   */
  allowClean?: boolean;
  /** The quiet readout while there are unsaved changes. */
  dirtyLabel?: ReactNode;
  buttonProps?: Omit<
    ButtonProps,
    "type" | "disabled" | "loading" | "children" | "onClick" | "asChild"
  >;
} & Omit<FormFooterProps, "children" | "error" | "status">;

/**
 * The form's action row: the refused-submit error, a quiet "Unsaved changes"
 * or "Saved" readout, an optional Discard, and the one primary submit.
 */
export function SaveBar<V extends FormValues>({
  model,
  label,
  discardLabel,
  allowClean = false,
  dirtyLabel = "Unsaved changes",
  buttonProps,
  ...props
}: SaveBarProps<V>) {
  const { dirty, submitting, canSubmit } = useSchemaFormStatus(model);
  const status = submitting ? null : model.saved && !dirty ? (
    <Status tone="success" size="compact" label={model.saved} />
  ) : dirty ? (
    <Status tone="neutral" size="compact" label={dirtyLabel} />
  ) : null;
  return (
    <FormFooter {...props} error={model.error} status={status}>
      {discardLabel && dirty ? (
        <Button
          type="button"
          variant="ghost"
          disabled={submitting}
          onClick={model.discard}
        >
          {discardLabel}
        </Button>
      ) : null}
      <Button
        {...buttonProps}
        type="submit"
        loading={submitting}
        disabled={submitting || !canSubmit || (!dirty && !allowClean)}
      >
        {label}
      </Button>
    </FormFooter>
  );
}
