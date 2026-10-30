// @vitest-environment jsdom
import { Schema } from "effect";
import { act, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as z from "zod";

import {
  SchemaForm,
  Secret,
  describeSchema,
  field,
  sections,
  type SubmitResult,
} from "./form.js";
import {
  cleanup,
  fireInput,
  fireKey,
  render,
  requireValue,
} from "./test-utils/index.js";

afterEach(cleanup);

const keySchema = Schema.Struct({
  label: Schema.Trim.check(
    Schema.isMinLength(1, { message: "Give this key a name." }),
  ).annotate(field({ label: "Name", required: true, section: "key" })),
  apiKey: Secret.check(
    Schema.isMinLength(8, { message: "Enter at least 8 characters." }),
  ).annotate(field({ label: "API key", section: "key" })),
  seats: Schema.Number.annotate(field({ min: 1, max: 5 })),
  internet: Schema.Boolean,
  scope: Schema.Literals(["user", "team"]).annotate(
    field({
      options: {
        user: { label: "Just me", description: "Only you." },
        team: { label: "The whole Team", description: "Everyone." },
      },
    }),
  ),
  region: Schema.Literals(["eu", "us", "ap", "sa"]),
  access: Schema.Array(Schema.Literals(["read", "write"])),
  note: Schema.String.annotate(field({ when: (values) => !values.internet })),
}).annotate(sections({ key: { title: "Key", description: "The secret." } }));
type KeyValues = (typeof keySchema)["Encoded"];
type Parsed = (typeof keySchema)["Type"];

const defaults: KeyValues = {
  label: "",
  apiKey: "",
  seats: 1,
  internet: true,
  scope: "user",
  region: "eu",
  access: ["read"],
  note: "",
};

function KeyForm({
  save,
}: {
  save: (value: Parsed) => Promise<SubmitResult<KeyValues> | undefined>;
}) {
  return (
    <SchemaForm
      schema={keySchema}
      defaultValues={defaults}
      onSubmit={save}
      submitLabel="Save key"
      discardLabel="Discard"
      aria-label="Key"
    />
  );
}

const input = (container: HTMLElement, name: string) =>
  requireValue(
    container.querySelector<HTMLInputElement>(`input[name="${name}"]`),
    name,
  );
const button = (container: HTMLElement, text: string) =>
  requireValue(
    [...container.querySelectorAll("button")].find((element) =>
      element.textContent.includes(text),
    ),
    text,
  );
const submit = async (container: HTMLElement) => {
  await act(async () => {
    container.querySelector("form")?.requestSubmit();
    await Promise.resolve();
  });
};

describe("schema description", () => {
  it("infers kinds from the schema type and lets annotations win", () => {
    const kinds = Object.fromEntries(
      describeSchema(keySchema).fields.map((entry) => [entry.name, entry.kind]),
    );
    expect(kinds).toEqual({
      label: "text",
      apiKey: "secret",
      seats: "number",
      internet: "switch",
      scope: "radio",
      region: "select",
      access: "checkboxes",
      note: "text",
    });
  });

  it("orders unsectioned fields first, then declared sections", () => {
    const description = describeSchema(keySchema);
    expect(description.sections.map((section) => section.title)).toEqual([
      undefined,
      "Key",
    ]);
    expect(description.sections[1]?.fields.map((entry) => entry.name)).toEqual([
      "label",
      "apiKey",
    ]);
    expect(description.fields[2]?.label).toBe("Seats");
  });

  it("keeps fields whose section the struct does not declare", () => {
    const schema = Schema.Struct({ label: keySchema.fields.label });
    expect(describeSchema(schema).sections[0]?.fields).toHaveLength(1);
  });

  it("merges repeated annotations on one field instead of replacing them", () => {
    const schema = Schema.Struct({
      sleep: Schema.Number.annotate(field({ min: 5, unit: "min" })).annotate(
        field({ layout: "stacked" }),
      ),
    });
    const [sleep] = describeSchema(schema).fields;
    expect(sleep).toMatchObject({ min: 5, unit: "min", layout: "stacked" });
  });

  it("reads Zod objects and their .meta() annotations", () => {
    const schema = z
      .object({
        provider: z.enum(["anthropic", "openai"]),
        key: z.string().meta(field({ kind: "secret", label: "API key" })),
        team: z.boolean().optional(),
        count: z.number().nullable(),
      })
      .refine(() => true);
    const fields = describeSchema(schema).fields;
    expect(
      fields.map((entry) => [entry.name, entry.kind, entry.label]),
    ).toEqual([
      ["provider", "radio", "Provider"],
      ["key", "secret", "API key"],
      ["team", "switch", "Team"],
      ["count", "number", "Count"],
    ]);
    expect(fields[2]?.optionalInSchema).toBe(true);
  });
});

describe("schema forms", () => {
  it("renders the whole form from the schema with labels wired", () => {
    const { container } = render(<KeyForm save={vi.fn()} />);
    const name = input(container, "label");
    expect(
      container.querySelector(`label[for="${name.id}"]`)?.textContent,
    ).toContain("Name");
    expect(input(container, "apiKey").type).toBe("password");
    expect(input(container, "seats").type).toBe("number");
    expect(input(container, "internet").getAttribute("role")).toBe("switch");
    expect(container.querySelector("select[name=region]")).not.toBeNull();
    expect(container.textContent).toContain("The whole Team");
    expect(container.querySelector("h3")?.textContent).toBe("Key");
    expect(container.querySelector('[name="note"]')).toBeNull();
  });

  it("keeps a clean form unsavable and offers Discard once dirty", async () => {
    const { container } = render(<KeyForm save={vi.fn()} />);
    expect(button(container, "Save key").disabled).toBe(true);
    expect(container.querySelector("form")?.hasAttribute("data-layout")).toBe(
      false,
    );
    expect(
      container
        .querySelector(".caps-form-section")
        ?.hasAttribute("data-layout"),
    ).toBe(false);
    await act(async () => {
      fireInput(input(container, "label"), "Research");
      await Promise.resolve();
    });
    expect(container.textContent).toContain("Unsaved changes");
    await act(async () => {
      button(container, "Discard").click();
      await Promise.resolve();
    });
    expect(input(container, "label").value).toBe("");
  });

  it("shows schema errors after a submit and hands the parsed value over", async () => {
    const save = vi.fn<(value: Parsed) => Promise<undefined>>(() =>
      Promise.resolve(undefined),
    );
    const { container } = render(<KeyForm save={save} />);
    await act(async () => {
      fireInput(input(container, "label"), "  ");
      await Promise.resolve();
    });
    await submit(container);
    expect(save).not.toHaveBeenCalled();
    expect(input(container, "apiKey").getAttribute("aria-invalid")).toBe(
      "true",
    );
    await act(async () => {
      fireInput(input(container, "label"), "  Research  ");
      fireInput(input(container, "apiKey"), "sk-12345678");
      await Promise.resolve();
    });
    await submit(container);
    expect(save.mock.calls[0]?.[0]).toMatchObject({
      label: "Research",
      apiKey: "sk-12345678",
    });
    expect(container.textContent).toContain("Saved");
  });

  it("puts refused field messages on their fields and clears them on change", async () => {
    const save = vi.fn(() =>
      Promise.resolve<SubmitResult<KeyValues>>({
        kind: "refused",
        error: "The provider said no.",
        fields: { apiKey: "The provider rejected this key." },
      }),
    );
    const { container } = render(<KeyForm save={save} />);
    await act(async () => {
      fireInput(input(container, "label"), "Research");
      fireInput(input(container, "apiKey"), "sk-12345678");
      await Promise.resolve();
    });
    await submit(container);
    const key = input(container, "apiKey");
    expect(key.getAttribute("aria-invalid")).toBe("true");
    expect(container.textContent).toContain("The provider rejected this key.");
    await act(async () => {
      fireInput(key, "sk-87654321");
      await Promise.resolve();
    });
    expect(key.hasAttribute("aria-invalid")).toBe(false);
  });

  it("shows a safe failure and logs the cause when a submit throws", async () => {
    const cause = new Error("private provider detail");
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const { container } = render(
        <SchemaForm
          schema={z.object({ name: z.string() })}
          defaultValues={{ name: "old" }}
          onSubmit={(): Promise<void> => Promise.reject(cause)}
          failure="Couldn't add the server. Try again."
        />,
      );
      await act(async () => {
        fireInput(input(container, "name"), "new");
        await Promise.resolve();
      });
      await submit(container);
      expect(container.textContent).toContain(
        "Couldn't add the server. Try again.",
      );
      expect(container.textContent).not.toContain("private provider detail");
      expect(log).toHaveBeenCalledWith("SchemaForm submit failed", cause);
      expect(input(container, "name").value).toBe("new");
    } finally {
      log.mockRestore();
    }
  });

  it("cancels without submitting and calls onSaved with the new baseline", async () => {
    const onCancel = vi.fn();
    const onSaved = vi.fn();
    const save = vi.fn(() => ({
      kind: "saved" as const,
      values: { name: "Stored" },
    }));
    const { container } = render(
      <SchemaForm
        schema={z.object({ name: z.string() })}
        defaultValues={{ name: "old" }}
        onSubmit={save}
        onCancel={onCancel}
        onSaved={onSaved}
      />,
    );
    expect(
      container
        .querySelector(".caps-form-footer")
        ?.getAttribute("data-divider"),
    ).toBe("false");
    await act(async () => {
      button(container, "Cancel").click();
      await Promise.resolve();
    });
    expect(onCancel).toHaveBeenCalledOnce();
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      fireInput(input(container, "name"), "Draft");
      await Promise.resolve();
    });
    await submit(container);
    expect(onSaved).toHaveBeenCalledExactlyOnceWith({ name: "Stored" });
    expect(input(container, "name").value).toBe("Stored");
  });

  it("lets an invalid inline add submit so it can show and focus its first error", async () => {
    const save = vi.fn();
    const { container } = render(
      <SchemaForm
        schema={z.object({
          name: z.string().min(1, "Name is required."),
          url: z
            .string()
            .pipe(z.url())
            .meta(field({ kind: "url" })),
        })}
        defaultValues={{ name: "", url: "" }}
        onCancel={() => undefined}
        onSubmit={save}
        submitLabel="Add server"
      />,
    );
    expect(button(container, "Add server").disabled).toBe(false);
    await submit(container);
    expect(save).not.toHaveBeenCalled();
    expect(input(container, "name").getAttribute("aria-invalid")).toBe("true");
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(input(container, "name"));
    });
    expect(container.textContent).toContain("Name is required.");
  });

  it("opts columns in for only its own form, sections and groups", () => {
    const { container } = render(
      <SchemaForm
        schema={keySchema}
        defaultValues={defaults}
        onSubmit={() => undefined}
        layout="columns"
      />,
    );
    expect(container.querySelector("form")?.getAttribute("data-layout")).toBe(
      "columns",
    );
    expect(
      container
        .querySelector(".caps-form-section")
        ?.getAttribute("data-layout"),
    ).toBe("columns");
    expect(
      container.querySelector(".caps-fieldset")?.getAttribute("data-layout"),
    ).toBe("columns");
  });

  it("uses the form's columns rhythm instead of mixing field layout hints", () => {
    const schema = Schema.Struct({
      name: Schema.String.annotate(
        field({ label: "A very long settings label", layout: "stacked" }),
      ),
      budget: Schema.Number.annotate(
        field({ label: "Monthly budget", layout: "row" }),
      ),
      internet: Schema.Boolean.annotate(field({ label: "Internet access" })),
      backups: Schema.Boolean.annotate(
        field({ label: "Nightly backups", kind: "checkbox" }),
      ),
    });
    const { container } = render(
      <SchemaForm
        schema={schema}
        defaultValues={{ name: "", budget: 25, internet: true, backups: false }}
        onSubmit={() => undefined}
        layout="columns"
      />,
    );
    expect(
      [...container.querySelectorAll(".caps-form-body > .caps-field")].map(
        (entry) => entry.getAttribute("data-orientation"),
      ),
    ).toEqual(["vertical", "vertical", "horizontal", "horizontal"]);
    expect(
      container
        .querySelector(".caps-field-copy > label")
        ?.getAttribute("title"),
    ).toBe("A very long settings label");
  });

  it("adopts the saved baseline so secrets clear after a save", async () => {
    const save = vi.fn((value: Parsed) =>
      Promise.resolve<SubmitResult<KeyValues>>({
        kind: "saved",
        values: { ...defaults, label: value.label },
        message: "Key saved.",
      }),
    );
    const { container } = render(<KeyForm save={save} />);
    await act(async () => {
      fireInput(input(container, "label"), "Research");
      fireInput(input(container, "apiKey"), "sk-12345678");
      await Promise.resolve();
    });
    await submit(container);
    expect(input(container, "apiKey").value).toBe("");
    expect(input(container, "label").value).toBe("Research");
    expect(container.textContent).toContain("Key saved.");
  });

  it("lets a render annotation draw the control with full wiring", async () => {
    const schema = Schema.Struct({
      color: Schema.String.check(
        Schema.isMinLength(1, { message: "Pick a colour." }),
      ).annotate(
        field<string>({
          label: "Colour",
          help: "Shown on the desktop.",
          render: (props) => (
            <input
              id={props.id}
              aria-describedby={props["aria-describedby"]}
              aria-invalid={props["aria-invalid"]}
              data-custom
              name={props.name}
              value={props.value}
              onBlur={props.onBlur}
              onChange={(event) => {
                props.onChange(event.currentTarget.value);
              }}
            />
          ),
        }),
      ),
    });
    const { container } = render(
      <SchemaForm
        schema={schema}
        defaultValues={{ color: "" }}
        onSubmit={() => undefined}
        allowClean
      />,
    );
    const custom = input(container, "color");
    expect(custom.hasAttribute("data-custom")).toBe(true);
    expect(
      container.querySelector(`label[for="${custom.id}"]`)?.textContent,
    ).toContain("Colour");
    expect(custom.getAttribute("aria-describedby")).toContain("description");
    await submit(container);
    expect(custom.getAttribute("aria-invalid")).toBe("true");
    expect(container.textContent).toContain("Pick a colour.");
  });
});

const choices = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
];
const attachmentSchema = Schema.Array(Schema.instanceOf(File)).annotate(
  field({ kind: "file", label: "Attachments", accept: ".txt", multiple: true }),
);

async function chooseFiles(picker: HTMLInputElement, files: readonly File[]) {
  await act(async () => {
    Object.defineProperty(picker, "files", {
      configurable: true,
      value: files,
    });
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
  });
}

it("infers searchable choices above twelve and respects explicit kinds", () => {
  for (const schema of [
    Schema.Struct({
      twelve: Schema.Literals(choices.slice(0, 12)),
      thirteen: Schema.Literals(choices),
      forced: Schema.Literals(["one", "two"]).annotate(
        field({ kind: "combobox" }),
      ),
      select: Schema.Literals(choices).annotate(field({ kind: "select" })),
      annotated: Schema.String.annotate(
        field({
          options: Object.fromEntries(choices.map((value) => [value, value])),
        }),
      ),
      files: attachmentSchema,
    }),
    z.object({
      twelve: z.enum(choices.slice(0, 12)),
      thirteen: z.enum(choices),
      forced: z.enum(["one", "two"]).meta(field({ kind: "combobox" })),
      select: z.enum(choices).meta(field({ kind: "select" })),
      annotated: z.string().meta(
        field({
          options: Object.fromEntries(choices.map((value) => [value, value])),
        }),
      ),
      files: z.array(z.file()).meta(field({ kind: "file" })),
    }),
  ]) {
    const description = describeSchema(schema);
    expect(description.fields.map((entry) => entry.kind)).toEqual([
      "select",
      "combobox",
      "combobox",
      "select",
      "combobox",
      "file",
    ]);
    expect(description.defaults.files).toEqual([]);
  }
  expect(
    describeSchema(
      z.object({ choice: z.union(choices.map((value) => z.literal(value))) }),
    ).fields[0]?.kind,
  ).toBe("combobox");
});

it("searches annotated combobox options, submits strings and shows field refusals", async () => {
  const schema = z.object({
    computer: z.string().meta(
      field({
        kind: "combobox",
        label: "Computer",
        help: "Where to run.",
        options: {
          studio: "Studio",
          archive: "Archive",
          locked: { label: "Locked", disabled: true },
        },
      }),
    ),
  });
  const save = vi.fn<
    (value: { computer: string }) => SubmitResult<{ computer: string }>
  >(
    () =>
      ({
        kind: "refused",
        fields: { computer: "That Computer is unavailable." },
      }) satisfies SubmitResult<{ computer: string }>,
  );
  const { container } = render(
    <SchemaForm
      schema={schema}
      defaultValues={{ computer: "studio" }}
      onSubmit={save}
    />,
  );
  const trigger = button(container, "Studio");
  expect(
    container.querySelector(`label[for="${trigger.id}"]`)?.textContent,
  ).toContain("Computer");
  expect(trigger.getAttribute("aria-describedby")).toContain("description");
  await act(async () => {
    trigger.click();
    await Promise.resolve();
  });
  const search = requireValue(
    document.querySelector<HTMLInputElement>('[role="combobox"]'),
    "search input",
  );
  expect(
    requireValue(
      document.querySelector<HTMLButtonElement>(
        '[role="option"][id$="locked"]',
      ),
      "disabled option",
    ).disabled,
  ).toBe(true);
  await act(async () => {
    fireInput(search, "arch");
    await Promise.resolve();
  });
  expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
  await act(async () => {
    fireKey(search, { key: "Enter" });
    await Promise.resolve();
  });
  expect(trigger.textContent).toContain("Archive");
  await submit(container);
  expect(save.mock.calls[0]?.[0]).toEqual({ computer: "archive" });
  expect(trigger.getAttribute("aria-invalid")).toBe("true");
  expect(container.textContent).toContain("That Computer is unavailable.");
});

it("submits chosen File objects, removes rows and discards the selection", async () => {
  const schema = Schema.Struct({
    files: attachmentSchema.annotate(field({ required: true })),
  });
  const save = vi.fn<(value: { readonly files: readonly File[] }) => undefined>(
    () => undefined,
  );
  const { container } = render(
    <SchemaForm
      schema={schema}
      defaultValues={{ files: [] }}
      onSubmit={save}
      discardLabel="Discard"
    />,
  );
  const picker = input(container, "files");
  expect(picker.type).toBe("file");
  expect(picker.accept).toBe(".txt");
  expect(picker.multiple).toBe(true);
  const choose = button(container, "Choose files");
  expect(choose.type).toBe("button");
  expect(choose.getAttribute("aria-describedby")).toBe(
    picker.getAttribute("aria-describedby"),
  );
  expect(picker.className).toContain("[clip:rect(0,0,0,0)]");
  expect(picker.tabIndex).toBe(-1);
  const openPicker = vi.spyOn(picker, "click");
  act(() => {
    choose.click();
  });
  expect(openPicker).toHaveBeenCalledOnce();
  expect(
    container.querySelector(`label[for="${picker.id}"]`)?.textContent,
  ).toContain("Attachments");
  const first = new File(["first"], "first.txt");
  const second = new File(["second"], "second.txt");
  await chooseFiles(picker, [first, second]);
  expect(container.querySelectorAll(".caps-upload-row")).toHaveLength(2);
  await act(async () => {
    requireValue(
      container.querySelector<HTMLButtonElement>(
        '[aria-label="Remove first.txt"]',
      ),
      "remove file",
    ).click();
    await Promise.resolve();
  });
  await submit(container);
  expect(save.mock.calls[0]?.[0].files).toHaveLength(1);
  expect(save.mock.calls[0]?.[0].files[0]).toBe(second);
  await chooseFiles(picker, [first]);
  await act(async () => {
    button(container, "Discard").click();
    await Promise.resolve();
  });
  expect(container.textContent).toContain("second.txt");
  expect(container.textContent).not.toContain("first.txt");
  expect(picker.value).toBe("");
});

it("leaves file size validation to Effect and Zod schemas", async () => {
  const maxBytes = 3;
  for (const schema of [
    Schema.Struct({
      files: attachmentSchema
        .check(
          Schema.makeFilter(
            (files) => files.every((file) => file.size <= maxBytes),
            { message: "Use files of 3 bytes or less." },
          ),
        )
        .annotate(field({ maxBytes })),
    }),
    z.object({
      files: z
        .array(z.file().max(maxBytes, "Use files of 3 bytes or less."))
        .meta(field({ kind: "file", maxBytes })),
    }),
  ]) {
    const save = vi.fn();
    const { container } = render(
      <SchemaForm
        schema={schema}
        defaultValues={{ files: [] }}
        onSubmit={save}
      />,
    );
    const picker = input(container, "files");
    await chooseFiles(picker, [new File(["large"], "large.txt")]);
    await submit(container);
    expect(save).not.toHaveBeenCalled();
    expect(picker.getAttribute("aria-invalid")).toBe("true");
    expect(container.textContent).toContain("Use files of 3 bytes or less.");
    await chooseFiles(picker, [new File(["ok"], "small.txt")]);
    await submit(container);
    expect(save).toHaveBeenCalledOnce();
    cleanup();
  }
});

it("preserves File objects for custom renderers and conditional fields", async () => {
  const isFiles = Schema.is(attachmentSchema);
  const chosen = new File(["ok"], "chosen.txt");
  const custom = vi.fn(
    (props: import("./form.js").FieldRenderProps<readonly File[]>) => (
      <button
        type="button"
        id={props.id}
        aria-describedby={props["aria-describedby"]}
        disabled={props.disabled}
        onBlur={props.onBlur}
        onClick={() => {
          props.onChange([chosen]);
          props.onBlur();
        }}
      >
        Choose custom file
      </button>
    ),
  );
  const schema = Schema.Struct({
    files: attachmentSchema.annotate(
      field<readonly File[]>({ help: "Custom picker.", render: custom }),
    ),
    note: Schema.String.annotate(
      field({
        when: (values) => isFiles(values.files) && values.files.length > 0,
      }),
    ),
  });
  const { container } = render(
    <SchemaForm
      schema={schema}
      defaultValues={{ files: [], note: "" }}
      onSubmit={() => undefined}
    />,
  );
  expect(container.querySelector('[name="note"]')).toBeNull();
  await act(async () => {
    button(container, "Choose custom file").click();
    await Promise.resolve();
  });
  const props = requireValue(
    custom.mock.calls.at(-1)?.[0],
    "custom render props",
  );
  expect(props.value[0]).toBe(chosen);
  expect(props["aria-describedby"]).toContain("description");
  expect(container.querySelector('[name="note"]')).not.toBeNull();
});

it("locks file picking and removal for read-only and disabled forms", () => {
  for (const readOnly of [true, false]) {
    const schema = Schema.Struct({
      files: attachmentSchema.annotate(field({ readOnly })),
    });
    const { container } = render(
      <SchemaForm
        schema={schema}
        defaultValues={{ files: [new File(["ok"], "chosen.txt")] }}
        disabled={!readOnly}
        onSubmit={() => undefined}
      />,
    );
    expect(input(container, "files").disabled).toBe(true);
    expect(button(container, "Choose files").disabled).toBe(true);
    expect(
      container.querySelector('[aria-label="Remove chosen.txt"]'),
    ).toBeNull();
    cleanup();
  }
});

it("recognizes replacement file defaults after saving without comparing file JSON", async () => {
  const first = new File(["one"], "same.txt");
  const replacement = new File(["two"], "same.txt");
  const schema = Schema.Struct({ files: attachmentSchema });
  const save = vi.fn<(value: { readonly files: readonly File[] }) => undefined>(
    () => undefined,
  );
  function ChangingDefaults() {
    const [files, setFiles] = useState<readonly File[]>([first]);
    return (
      <>
        <button
          onClick={() => {
            setFiles([replacement]);
          }}
        >
          Replace defaults
        </button>
        <SchemaForm
          schema={schema}
          defaultValues={{ files }}
          onSubmit={save}
          allowClean
        />
      </>
    );
  }
  const { container } = render(<ChangingDefaults />);
  await submit(container);
  await act(async () => {
    button(container, "Replace defaults").click();
    await Promise.resolve();
  });
  await submit(container);
  expect(save.mock.calls.at(-1)?.[0].files[0]).toBe(replacement);
});
