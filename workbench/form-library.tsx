import type { Story } from "@ladle/react";
import { Sigil } from "@fungi.computer/sigils";
import { Schema } from "effect";
import { useEffect, type ReactNode } from "react";

import { Card, CardContent } from "../src/components/card.js";
import { IconLamp, IconLamps } from "../src/components/icon-lamp.js";
import { PixelNumber } from "../src/components/pixel-number.js";
import { Slider } from "../src/components/slider.js";
import { Status } from "../src/components/status.js";
import {
  Display,
  ScreenCell,
  ScreenCells,
  ScreenHeader,
} from "../src/components/surface.js";
import {
  FormFields,
  SaveBar,
  SchemaForm,
  Secret,
  field,
  sections,
  useSchemaForm,
} from "../src/form.js";

/** One reading column on the 8px grid; phones keep a 16px gutter. */
function Stage({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <main
      className={
        wide
          ? "mx-auto flex w-full max-w-(--container-3xl) flex-col gap-xl px-lg py-2xl"
          : "mx-auto flex w-full max-w-(--container-lg) flex-col gap-xl px-lg py-2xl"
      }
    >
      {children}
    </main>
  );
}

const pause = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const rights = {
  list: { label: "List files", caption: "LIST", icon: <Sigil name="list" /> },
  read: { label: "Read files", caption: "READ", icon: <Sigil name="read" /> },
  write: {
    label: "Write files",
    caption: "WRITE",
    icon: <Sigil name="write" />,
  },
  run: { label: "Run commands", caption: "RUN", icon: <Sigil name="run" /> },
};

const apps = {
  prints: { label: "Prints", caption: "PRINTS", icon: <Sigil name="prints" /> },
  inkcap: { label: "Inkcap", caption: "INKCAP", icon: <Sigil name="inkcap" /> },
  vishnu: { label: "Vishnu", caption: "VISHNU", icon: <Sigil name="vishnu" /> },
};

const maxAttachmentBytes = 1_048_576;

/**
 * The single source: types, validation, labels, kinds, help, options, order
 * and sections all live on the schema. Kinds the type implies are inferred
 * (Boolean → switch, Number → number, literals → radio, select or combobox).
 */
export const settingsSchema = Schema.Struct({
  name: Schema.Trim.check(
    Schema.isMinLength(1, { message: "Give the Computer a name." }),
  ).annotate(field({ required: true, section: "identity" })),
  contact: Schema.Trim.check(
    Schema.isPattern(/^[^\s@]+@[^\s@]+$/, {
      message: "Enter an email address, like you@example.com.",
    }),
  ).annotate(
    field({
      kind: "email",
      label: "Contact email",
      help: "Where we send notices about this Computer.",
      autoComplete: "email",
      section: "identity",
    }),
  ),
  notes: Schema.String.annotate(
    field({
      kind: "textarea",
      optional: true,
      placeholder: "What this Computer is for",
      section: "identity",
    }),
  ),
  computer: Schema.String.check(Schema.isMinLength(1)).annotate(
    field({
      kind: "combobox",
      label: "Computer",
      section: "identity",
      placeholder: "Search Computers…",
      options: { workbench: "Workbench", studio: "Studio", archive: "Archive" },
    }),
  ),
  files: Schema.Array(Schema.instanceOf(File))
    .check(
      Schema.makeFilter(
        (files) => files.every((file) => file.size <= maxAttachmentBytes),
        {
          message: "Choose files of 1 MiB or less.",
        },
      ),
    )
    .annotate(
      field({
        kind: "file",
        label: "Attachments",
        help: "Text files, up to 1 MiB each.",
        accept: ".txt,text/plain",
        multiple: true,
        maxBytes: maxAttachmentBytes,
        section: "identity",
      }),
    ),
  token: Secret.check(
    Schema.isMinLength(8, { message: "Enter at least 8 characters." }),
  ).annotate(
    field({
      label: "Deploy token",
      help: "Checked once, stored encrypted, never shown again.",
      section: "access",
    }),
  ),
  rights: Schema.Array(
    Schema.Literals(["list", "read", "write", "run"]),
  ).annotate(field({ label: "Shed may", options: rights, section: "access" })),
  opens: Schema.Literals(["prints", "inkcap", "vishnu"]).annotate(
    field({ label: "Opens in", options: apps, section: "access" }),
  ),
  region: Schema.Literals(["eu", "us", "ap", "sa"]).annotate(
    field({
      layout: "row",
      section: "machine",
      options: {
        eu: "Europe (Helsinki)",
        us: "United States (Virginia)",
        ap: "Asia Pacific (Singapore)",
        sa: "South America (São Paulo)",
      },
    }),
  ),
  size: Schema.Literals(["small", "standard", "large"]).annotate(
    field({
      section: "machine",
      options: {
        small: { label: "Small", description: "2 cores, 4 GB", meta: "$9" },
        standard: {
          label: "Standard",
          description: "4 cores, 8 GB",
          meta: "$18",
        },
        large: { label: "Large", description: "8 cores, 16 GB", meta: "$36" },
      },
    }),
  ),
  sleep: Schema.Number.annotate(
    field({
      label: "Sleep after",
      layout: "row",
      min: 5,
      max: 120,
      step: 5,
      unit: "min",
      section: "machine",
    }),
  ),
  share: Schema.Number.annotate(
    field<number>({
      label: "CPU share",
      section: "machine",
      // The bailout: a control the kinds don't cover, with the same wiring.
      render: (control) => (
        <Slider
          id={control.id}
          aria-describedby={control["aria-describedby"]}
          name={control.name}
          min={0}
          max={100}
          step={5}
          value={control.value}
          aria-valuetext={`${String(control.value)} percent`}
          disabled={control.disabled}
          onBlur={control.onBlur}
          onChange={(event) => {
            control.onChange(event.currentTarget.valueAsNumber);
          }}
        />
      ),
    }),
  ),
  internet: Schema.Boolean.annotate(
    field({ label: "Internet access", section: "machine" }),
  ),
  backups: Schema.Boolean.annotate(
    field({
      kind: "checkbox",
      label: "Nightly backups",
      help: "Kept for 7 days.",
      section: "machine",
    }),
  ),
  budget: Schema.NumberFromString.check(
    Schema.isGreaterThanOrEqualTo(0, { message: "Use zero or more." }),
  ).annotate(
    field({
      kind: "money",
      label: "Monthly budget",
      currency: "USD",
      layout: "row",
      section: "billing",
    }),
  ),
  renews: Schema.String.annotate(
    field({
      kind: "date",
      label: "Renews on",
      layout: "row",
      section: "billing",
    }),
  ),
}).annotate(
  sections({
    identity: { title: "Identity", description: "How your Team sees it." },
    access: { title: "Access" },
    machine: { title: "Machine" },
    billing: { title: "Billing" },
  }),
);
export const settingsDefaults: (typeof settingsSchema)["Encoded"] = {
  name: "Workbench",
  contact: "levi@example.com",
  notes: "",
  computer: "workbench",
  files: [],
  token: "",
  rights: ["list", "read"],
  opens: "prints",
  region: "eu",
  size: "standard",
  sleep: 30,
  share: 60,
  internet: true,
  backups: false,
  budget: "25.00",
  renews: "2026-11-01",
};

/** The whole form from its schema: no field list, no wiring. */
export const DeclaredForm: Story = () => (
  <Stage>
    <Card>
      <CardContent>
        <SchemaForm
          schema={settingsSchema}
          defaultValues={settingsDefaults}
          onSubmit={() => pause(700)}
          discardLabel="Discard"
          aria-label="Computer settings"
        />
      </CardContent>
    </Card>
  </Stage>
);

/** Submit an invalid form once so every error shows, as after a failed save. */
function SubmitOnMount({ submit }: { submit: () => Promise<void> }) {
  useEffect(() => {
    void submit();
  }, [submit]);
  return null;
}

const errorsSchema = Schema.Struct({
  name: settingsSchema.fields.name,
  contact: settingsSchema.fields.contact,
  budget: settingsSchema.fields.budget,
  renews: settingsSchema.fields.renews,
});

const tokenSchema = Schema.Struct({ token: settingsSchema.fields.token });

const lockedSchema = Schema.Struct({
  name: Schema.String.annotate(field({ readOnly: true })),
  internet: Schema.Boolean.annotate(field({ label: "Internet access" })),
  sleep: settingsSchema.fields.sleep,
});

/** Field errors after a submit, a refused save with server messages, and read-only. */
export const DeclaredFormStates: Story = () => {
  const invalid = useSchemaForm({
    schema: errorsSchema,
    defaultValues: {
      name: "",
      contact: "levi",
      budget: "-4",
      renews: "2026-11-01",
    },
    onSubmit: () => undefined,
  });
  return (
    <Stage wide>
      <Card>
        <CardContent>
          <SchemaForm
            model={invalid}
            aria-label="Invalid"
            footer={
              <>
                <SubmitOnMount submit={invalid.submit} />
                <SaveBar model={invalid} label="Save changes" allowClean />
              </>
            }
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <SchemaForm
            schema={tokenSchema}
            defaultValues={{ token: "" }}
            aria-label="Refused"
            submitLabel="Check and save token"
            onSubmit={async () => {
              await pause(600);
              return {
                kind: "refused",
                error: "The provider rejected this token. Nothing was saved.",
                fields: { token: "This token has expired." },
              };
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <SchemaForm
            schema={lockedSchema}
            defaultValues={{ name: "Workbench", internet: true, sleep: 30 }}
            onSubmit={() => undefined}
            aria-label="Read only"
            disabled
            footer={null}
          />
        </CardContent>
      </Card>
    </Stage>
  );
};

/** Read-only icon states: lit in colour with a lamp, off as a grey silhouette. */
export const IconLamps_: Story = () => (
  <Stage>
    <IconLamps
      aria-label="Shed may"
      stateLabels={["allowed", "not allowed"]}
      items={Object.entries(rights).map(([id, right]) => ({
        id,
        ...right,
        on: id !== "write",
      }))}
    />
    <IconLamp label="Agent" caption="AGENT" icon={<Sigil name="agent" />} on />
  </Stage>
);
IconLamps_.storyName = "Icon lamps";

const instrumentSchema = Schema.Struct({
  opens: settingsSchema.fields.opens,
  rights: Schema.Array(
    Schema.Literals(["list", "read", "write", "run"]),
  ).annotate(field({ label: "Access", options: rights })),
  internet: Schema.Boolean.annotate(field({ label: "Internet" })),
  sleep: settingsSchema.fields.sleep.annotate(field({ layout: "stacked" })),
});

/**
 * The approved screen form controls on real parts: the same schema fields
 * placed in ScreenCells on a Display. The Screen supplies the context;
 * Sigils keep their colour; the Save key sits under the glass.
 */
export const ScreenInstrument: Story = () => {
  const model = useSchemaForm({
    schema: instrumentSchema,
    defaultValues: {
      opens: "prints",
      rights: ["list", "read"],
      internet: true,
      sleep: 30,
    },
    onSubmit: () => pause(600),
  });
  return (
    <Stage>
      <SchemaForm
        model={model}
        aria-label="Computer instrument"
        footer={<SaveBar model={model} label="Save" divider={false} />}
      >
        <Display size="md">
          <ScreenHeader
            icon={<Sigil name="computer" />}
            title="Workbench"
            status={
              <Status
                glyph="dot"
                tone="success"
                size="compact"
                label="Running"
              />
            }
          />
          <ScreenCells>
            <ScreenCell wide>
              <FormFields model={model} names={["opens"]} />
            </ScreenCell>
            <ScreenCell wide>
              <FormFields model={model} names={["rights"]} />
            </ScreenCell>
            <ScreenCell>
              <FormFields model={model} names={["internet"]} />
            </ScreenCell>
            <ScreenCell>
              <FormFields model={model} names={["sleep"]} />
            </ScreenCell>
            <ScreenCell legend="Disk" readout="/ 32 GB">
              <PixelNumber text="12.4" size="md" />
            </ScreenCell>
            <ScreenCell legend="Processes">
              <PixelNumber value={7} pad={2} size="md" />
            </ScreenCell>
          </ScreenCells>
        </Display>
      </SchemaForm>
    </Stage>
  );
};
