import type { StandardSchemaV1 } from "@tanstack/react-form";
import { Option, Schema, SchemaAST } from "effect";
import type { ReactNode } from "react";
import * as z from "zod";

/**
 * The raw input one field holds: text, a number (or empty), a flag, or a set
 * of chosen values or files. The schema turns it into the domain value at submit.
 */
export type FieldInput =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]
  | readonly File[];

/** The raw values a schema form holds: one entry per field name. */
export type FormValues = Readonly<Record<string, FieldInput>>;

/** Every control a schema field can render as. */
export type FieldKind =
  | "text"
  | "email"
  | "url"
  | "tel"
  | "textarea"
  | "secret"
  | "money"
  | "date"
  | "number"
  | "select"
  | "combobox"
  | "file"
  | "radio"
  | "icon-radio"
  | "checkbox"
  | "switch"
  | "checkboxes"
  | "icon-checkboxes";

/** One choice's presentation, keyed by its value in `options`. */
export type OptionAnnotation = {
  readonly label?: string;
  /** A sentence under the label; radio options with one render as cards. */
  readonly description?: string;
  /** A short readout on a radio card's trailing edge, such as a price. */
  readonly meta?: string;
  /** A Sigil or App icon: choices with icons render as icon keys. */
  readonly icon?: ReactNode;
  /** The short legend on an icon key; `label` stays the accessible name. */
  readonly caption?: string;
  readonly disabled?: boolean;
};

/** What a `render` annotation receives: the same wiring every built-in kind gets. */
export type FieldRenderProps<T extends FieldInput = FieldInput> = {
  readonly name: string;
  readonly label: string;
  readonly help: ReactNode;
  readonly value: T;
  /** Set the field's raw value; validation runs as it would for a built-in kind. */
  onChange(value: T): void;
  /** Mark the field visited, so its error shows. */
  readonly onBlur: () => void;
  /** The visible error, after the person leaves the field or submits. */
  readonly error: string | undefined;
  readonly disabled: boolean;
  /** Put these on the control so the Field's label, help and error name it. */
  readonly id: string;
  readonly "aria-describedby": string | undefined;
  readonly "aria-invalid": boolean;
};

/** Presentation for one schema field. The schema stays the single source. */
export type FieldAnnotation<T extends FieldInput = FieldInput> = {
  /** The visible label and accessible name; defaults to the humanized key. */
  readonly label?: string;
  readonly help?: string;
  /** Overrides the kind inferred from the schema type. */
  readonly kind?: FieldKind;
  readonly placeholder?: string;
  /** The `sections` key this field sits in; unsectioned fields come first. */
  readonly section?: string;
  /** Sort position within its section; fields keep schema order otherwise. */
  readonly order?: number;
  /** `row` puts the control opposite its label (a settings row). */
  readonly layout?: "stacked" | "row";
  readonly required?: boolean;
  /** Marks an optional field in a mostly required form. */
  readonly optional?: boolean;
  /** A decorative Sigil or App icon before the label. */
  readonly icon?: ReactNode;
  /** Labels, help and icons for literal choices, keyed by value. */
  readonly options?: Readonly<Record<string, string | OptionAnnotation>>;
  readonly currency?: string;
  readonly unit?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly wrap?: boolean;
  readonly rows?: number;
  readonly maxLength?: number;
  readonly autoComplete?: string;
  /** Native file-picker filter; the schema owns file-type validation. */
  readonly accept?: string;
  readonly multiple?: boolean;
  /** Per-file byte limit, enforced by the field's schema check. */
  readonly maxBytes?: number;
  readonly readOnly?: boolean;
  /** Show the field only while this holds for the current raw values. */
  when?(values: FormValues): boolean;
  /**
   * The bailout: draw this field's control yourself. Caps still owns the
   * label, help, error, layout, validation and save bar.
   */
  render?(field: FieldRenderProps<T>): ReactNode;
};

/** A titled group of fields, declared on the struct. */
export type SectionAnnotation = {
  readonly title: string;
  readonly description?: string;
};

/** Holds a field annotation inside schema annotations (Effect or Zod). */
export class FieldMeta {
  constructor(readonly annotation: FieldAnnotation) {}
}

/** Holds the section list inside a struct's annotations. */
export class SectionsMeta {
  constructor(readonly sections: Readonly<Record<string, SectionAnnotation>>) {}
}

const formKey = "caps/form";
/**
 * Each `field()` call gets its own key, because both libraries replace an
 * annotation key wholesale; reading merges every form key in order.
 */
let fieldCalls = 0;

/** Schema annotations for one field: Effect `.annotate()` or Zod `.meta()`. */
export type FieldAnnotations = Record<`caps/form:${number}`, FieldMeta> & {
  title?: string;
  description?: string;
};

/** Schema annotations for a struct's sections. */
export type SectionAnnotations = { readonly [formKey]: SectionsMeta };

/**
 * Annotate a schema field for forms. Works with Effect
 * (`Schema.String.annotate(field({ … }))`) and Zod (`z.string().meta(field({ … }))`).
 * `label` and `help` also become the schema's `title` and `description`.
 */
export function field<T extends FieldInput = FieldInput>(
  annotation: FieldAnnotation<T>,
): FieldAnnotations {
  fieldCalls += 1;
  const annotations: FieldAnnotations = {
    [`${formKey}:${String(fieldCalls)}`]: new FieldMeta(annotation),
  };
  if (annotation.label !== undefined) annotations.title = annotation.label;
  if (annotation.help !== undefined) annotations.description = annotation.help;
  return annotations;
}

/** Annotate a struct with its sections, in display order. */
export function sections(
  list: Readonly<Record<string, SectionAnnotation>>,
): SectionAnnotations {
  return { [formKey]: new SectionsMeta(list) };
}

/** A key or token: masked, never autofilled, with a reveal key. */
export const Secret = Schema.String.annotate(field({ kind: "secret" })).pipe(
  Schema.brand("Secret"),
);

/** One choice, resolved for rendering. */
export type ResolvedOption = {
  readonly value: string;
  readonly label: string;
  readonly description: string | undefined;
  readonly meta: string | undefined;
  readonly icon: ReactNode;
  readonly caption: string | undefined;
  readonly disabled: boolean;
};

/** One field, resolved from the schema for rendering. */
export type ResolvedField = Omit<
  FieldAnnotation,
  "options" | "kind" | "help"
> & {
  readonly help: string | undefined;
  readonly name: string;
  readonly label: string;
  readonly kind: FieldKind;
  readonly options: readonly ResolvedOption[];
  readonly optionalInSchema: boolean;
  readonly index: number;
};

/** A section and its fields, in display order. */
export type ResolvedSection = {
  readonly id: string | null;
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly fields: readonly ResolvedField[];
};

/** Everything a form needs from its schema. */
export type FormDescription = {
  readonly sections: readonly ResolvedSection[];
  readonly fields: readonly ResolvedField[];
  readonly defaults: FormValues;
};

/** The type a field's raw value has, as read from the schema. */
type ValueType =
  | { readonly type: "string"; readonly literals: readonly string[] }
  | { readonly type: "number"; readonly nullable: boolean }
  | { readonly type: "boolean" }
  | { readonly type: "files" }
  | { readonly type: "strings"; readonly literals: readonly string[] };

type RawField = {
  readonly name: string;
  readonly valueType: ValueType;
  readonly optional: boolean;
  readonly annotation: FieldAnnotation;
  readonly title: string | undefined;
  readonly description: string | undefined;
};

/** The raw fields and declared sections read from a schema. */
type SchemaFields = {
  fields: RawField[];
  sections: Readonly<Record<string, SectionAnnotation>>;
};

const humanize = (key: string): string => {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Both libraries keep annotations in an open record; ours sit under form keys. */
type AnnotationRecord =
  Schema.Annotations.Annotations | z.core.GlobalMeta | undefined;

function annotationOf(record: AnnotationRecord): FieldAnnotation {
  return Object.values(record ?? {}).reduce<FieldAnnotation>(
    (merged, value) =>
      value instanceof FieldMeta ? { ...merged, ...value.annotation } : merged,
    {},
  );
}

/** Later annotations win key by key, so `Secret.annotate(field({ label }))` stays a secret. */
function mergeAnnotations(
  records: readonly AnnotationRecord[],
): FieldAnnotation {
  return records.reduce<FieldAnnotation>(
    (merged, record) => ({ ...merged, ...annotationOf(record) }),
    {},
  );
}

function sectionsOf(
  record: AnnotationRecord,
): Readonly<Record<string, SectionAnnotation>> {
  const value = record?.[formKey];
  return value instanceof SectionsMeta ? value.sections : {};
}

// ---- Effect -------------------------------------------------------------

const readLiteral = Schema.decodeUnknownOption(Schema.String);

function effectLiterals(ast: SchemaAST.AST): readonly string[] | null {
  if (SchemaAST.isLiteral(ast))
    return Option.match(readLiteral(ast.literal), {
      onNone: () => null,
      onSome: (literal) => [literal],
    });
  if (!SchemaAST.isUnion(ast)) return null;
  const literals: string[] = [];
  for (const member of ast.types) {
    if (SchemaAST.isUndefined(member)) continue;
    const inner = effectLiterals(member);
    if (inner === null) return null;
    literals.push(...inner);
  }
  return literals;
}

function effectValueType(ast: SchemaAST.AST): ValueType | null {
  if (SchemaAST.isString(ast)) return { type: "string", literals: [] };
  if (SchemaAST.isNumber(ast)) return { type: "number", nullable: false };
  if (SchemaAST.isBoolean(ast)) return { type: "boolean" };
  const literals = effectLiterals(ast);
  if (literals !== null) return { type: "string", literals };
  if (SchemaAST.isArrays(ast)) {
    const [item] = ast.rest;
    if (item === undefined) return null;
    if (SchemaAST.isString(item)) return { type: "strings", literals: [] };
    const options = effectLiterals(item);
    return options === null ? null : { type: "strings", literals: options };
  }
  if (SchemaAST.isUnion(ast)) {
    const present = ast.types.filter(
      (member) => !SchemaAST.isUndefined(member) && !SchemaAST.isNull(member),
    );
    const nullable = ast.types.some((member) => SchemaAST.isNull(member));
    const [only] = present;
    if (present.length !== 1 || only === undefined) return null;
    const inner = effectValueType(only);
    if (inner?.type === "number") return { type: "number", nullable };
    return nullable ? null : inner;
  }
  return null;
}

function effectFields(schema: Schema.Top): SchemaFields {
  const ast = schema.ast;
  if (!SchemaAST.isObjects(ast))
    throw new Error("A schema form needs a Schema.Struct.");
  const fields = ast.propertySignatures.map((property): RawField => {
    const name = String(property.name);
    const encoded = SchemaAST.toEncoded(property.type);
    // File declarations are opaque to inference; the annotation names the input.
    // `.check()` moves later annotations onto the check; read them all.
    const annotation = mergeAnnotations([
      property.type.annotations,
      ...(property.type.checks ?? []).map((check) => check.annotations),
    ]);
    const valueType: ValueType | null =
      annotation.kind === "file" ? { type: "files" } : effectValueType(encoded);
    if (valueType === null)
      throw new Error(
        `Schema field "${name}" has no form control. Annotate it with field({ render }) or a kind.`,
      );
    return {
      name,
      valueType,
      optional: property.type.context?.isOptional === true,
      annotation,
      title: SchemaAST.resolveTitle(property.type),
      description: SchemaAST.resolveDescription(property.type),
    };
  });
  return {
    fields,
    sections: sectionsOf(SchemaAST.resolve(ast)),
  };
}

// ---- Zod ----------------------------------------------------------------

type ZodNode = z.core.$ZodType;

/** A Zod node with its optional/nullable/default/pipe wrappers removed. */
type ZodCore = { node: ZodNode; optional: boolean; nullable: boolean };

function zodUnwrap(node: ZodNode): ZodCore {
  let current = node;
  let optional = false;
  let nullable = false;
  for (;;) {
    if (current instanceof z.ZodOptional) {
      optional = true;
      current = current.unwrap();
    } else if (current instanceof z.ZodNullable) {
      nullable = true;
      current = current.unwrap();
    } else if (current instanceof z.ZodDefault) {
      current = current.unwrap();
    } else if (current instanceof z.ZodPipe) {
      current = current.in;
    } else return { node: current, optional, nullable };
  }
}

function zodLiterals(node: ZodNode): readonly string[] | null {
  if (node instanceof z.ZodUnion) {
    const members = node.options.map((option) => zodLiterals(option));
    return members.some((member) => member === null)
      ? null
      : members.flatMap((member) => member ?? []);
  }
  const values =
    node instanceof z.ZodEnum
      ? node.options
      : node instanceof z.ZodLiteral
        ? [...node.values]
        : null;
  if (values === null) return null;
  const literals = values.map((value) => readLiteral(value));
  return literals.every(Option.isSome)
    ? literals.map((literal) => literal.value)
    : null;
}

function zodValueType(node: ZodNode): ValueType | null {
  const { node: inner, nullable } = zodUnwrap(node);
  if (inner instanceof z.ZodString) return { type: "string", literals: [] };
  if (inner instanceof z.ZodNumber) return { type: "number", nullable };
  if (inner instanceof z.ZodBoolean) return { type: "boolean" };
  const literals = zodLiterals(inner);
  if (literals !== null) return { type: "string", literals };
  if (inner instanceof z.ZodArray) {
    const item = zodUnwrap(inner.element).node;
    if (item instanceof z.ZodString) return { type: "strings", literals: [] };
    const options = zodLiterals(item);
    return options === null ? null : { type: "strings", literals: options };
  }
  return null;
}

/** Zod keeps `.meta()` on the node it was called on: collect inner to outer. */
function zodMetas(node: ZodNode) {
  const chain: ZodNode[] = [node];
  for (;;) {
    const last = chain[chain.length - 1];
    if (last === undefined) break;
    const next: ZodNode =
      last instanceof z.ZodOptional ||
      last instanceof z.ZodNullable ||
      last instanceof z.ZodDefault
        ? last.unwrap()
        : last instanceof z.ZodPipe
          ? last.in
          : last;
    if (next === last) break;
    chain.push(next);
  }
  return chain.reverse().map((entry) => z.globalRegistry.get(entry));
}

function zodMeta(node: ZodNode): z.core.GlobalMeta {
  return zodMetas(node).reduce<z.core.GlobalMeta>(
    (merged, meta) => ({ ...merged, ...meta }),
    {},
  );
}

function zodEntries(
  object: z.ZodObject<z.core.$ZodShape>,
): (readonly [string, ZodNode])[] {
  return Object.entries(object.shape);
}

function zodFields(schema: z.ZodType): SchemaFields {
  const root = zodUnwrap(schema).node;
  if (!(root instanceof z.ZodObject))
    throw new Error("A schema form needs a z.object.");
  const fields = zodEntries(root).map(([name, node]): RawField => {
    const metas = zodMetas(node);
    const annotation = mergeAnnotations(metas);
    const valueType: ValueType | null =
      annotation.kind === "file" ? { type: "files" } : zodValueType(node);
    if (valueType === null)
      throw new Error(
        `Schema field "${name}" has no form control. Annotate it with field({ render }) or a kind.`,
      );
    const meta = zodMeta(node);
    return {
      name,
      valueType,
      optional: zodUnwrap(node).optional,
      annotation,
      title: meta.title,
      description: meta.description,
    };
  });
  return {
    fields,
    sections: sectionsOf(zodMeta(schema)),
  };
}

// ---- Resolution ---------------------------------------------------------

function resolveOptions(
  values: readonly string[],
  annotation: FieldAnnotation,
): ResolvedOption[] {
  const labels = annotation.options ?? {};
  const keys = values.length > 0 ? values : Object.keys(labels);
  return keys.map((value) => {
    const entry = labels[value];
    const option: OptionAnnotation =
      entry === undefined
        ? {}
        : entry instanceof Object
          ? entry
          : { label: entry };
    return {
      value,
      label: option.label ?? humanize(value),
      description: option.description,
      meta: option.meta,
      icon: option.icon,
      caption: option.caption,
      disabled: option.disabled === true,
    };
  });
}

/** The kind a field renders as: its annotation wins, then the schema type. */
function inferKind(
  valueType: ValueType,
  options: readonly ResolvedOption[],
): FieldKind {
  const icons = options.some((option) => option.icon !== undefined);
  switch (valueType.type) {
    case "boolean":
      return "switch";
    case "number":
      return "number";
    case "strings":
      return icons ? "icon-checkboxes" : "checkboxes";
    case "files":
      return "file";
    case "string": {
      if (options.length === 0) return "text";
      if (options.length > 12) return "combobox";
      if (icons) return "icon-radio";
      const cards = options.some(
        (option) =>
          option.description !== undefined || option.meta !== undefined,
      );
      return cards || options.length <= 3 ? "radio" : "select";
    }
  }
}

function emptyValue(
  valueType: ValueType,
  options: readonly ResolvedOption[],
): FieldInput {
  switch (valueType.type) {
    case "boolean":
      return false;
    case "number":
      return valueType.nullable ? null : 0;
    case "strings":
    case "files":
      return [];
    case "string":
      return options[0]?.value ?? "";
  }
}

/** Read a form's fields, sections and empty defaults from its schema. */
export function describeSchema(
  schema: Schema.Top | z.ZodType,
): FormDescription {
  const raw =
    schema instanceof z.ZodType ? zodFields(schema) : effectFields(schema);
  const fields = raw.fields.map((entry, index): ResolvedField => {
    const { kind: annotatedKind, ...annotation } = entry.annotation;
    const options = resolveOptions(
      entry.valueType.type === "string" || entry.valueType.type === "strings"
        ? entry.valueType.literals
        : [],
      entry.annotation,
    );
    const help = annotation.help ?? entry.description;
    return {
      ...annotation,
      name: entry.name,
      label: annotation.label ?? entry.title ?? humanize(entry.name),
      help,
      kind: annotatedKind ?? inferKind(entry.valueType, options),
      options,
      optionalInSchema: entry.optional,
      index,
    };
  });
  const defaults: Record<string, FieldInput> = {};
  raw.fields.forEach((entry, index) => {
    const resolved = fields[index];
    if (resolved)
      defaults[entry.name] = emptyValue(entry.valueType, resolved.options);
  });
  const order = (field: ResolvedField) => field.order ?? field.index;
  // A section the struct doesn't declare (a field reused from another
  // schema) falls back to the untitled group rather than disappearing.
  const sectionOf = (field: ResolvedField) =>
    field.section !== undefined && Object.hasOwn(raw.sections, field.section)
      ? field.section
      : null;
  const grouped = (id: string | null) =>
    fields
      .filter((field) => sectionOf(field) === id)
      .sort((left, right) => order(left) - order(right));
  const declared = Object.entries(raw.sections).map(
    ([id, section]): ResolvedSection => ({
      id,
      title: section.title,
      description: section.description,
      fields: grouped(id),
    }),
  );
  const loose: ResolvedSection = {
    id: null,
    title: undefined,
    description: undefined,
    fields: grouped(null),
  };
  return {
    fields,
    sections: [loose, ...declared].filter(
      (section) => section.fields.length > 0,
    ),
    defaults,
  };
}

/**
 * A form schema: an Effect `Schema.Struct` (the house path) or a Zod object.
 * `V` is the raw input the controls hold; `Out` is what the submit receives.
 */
export type FormSchema<V extends FormValues = FormValues, Out = unknown> =
  Schema.Codec<Out, V> | z.ZodType<Out, V>;

/** The schema as a Standard Schema validator for TanStack Form. */
export function standardSchema<V extends FormValues, Out>(
  schema: FormSchema<V, Out>,
): StandardSchemaV1<V, Out> {
  const validator =
    schema instanceof z.ZodType ? schema : Schema.toStandardSchemaV1(schema);
  return {
    "~standard": {
      ...validator["~standard"],
      validate: (value) => {
        const result = validator["~standard"].validate(value);
        return result instanceof Promise
          ? result.then((validated) => formIssues<Out>(validated))
          : formIssues<Out>(result);
      },
    },
  };
}

type ValidationResult<Out> = Awaited<
  ReturnType<StandardSchemaV1<FormValues, Out>["~standard"]["validate"]>
>;

/** Flat form controls own their array-item errors, such as one oversized file. */
function formIssues<Out>(result: ValidationResult<Out>): ValidationResult<Out> {
  return result.issues === undefined
    ? result
    : {
        issues: result.issues.map((issue) =>
          issue.path === undefined
            ? issue
            : {
                ...issue,
                path: issue.path.slice(0, 1),
              },
        ),
      };
}
