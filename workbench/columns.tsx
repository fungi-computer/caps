import { Card, CardContent } from "../src/components/card.js";
import { SchemaForm, field } from "../src/form.js";
import * as z from "zod";
import { settingsDefaults, settingsSchema } from "./form-library.js";
import "./columns.css";

const server = z.object({
  name: z
    .string()
    .min(1)
    .meta(field({ label: "Name", help: "Tools become env.mcp.notion." })),
  url: z
    .string()
    .startsWith("https://", "Use the server's https:// address.")
    .pipe(z.url())
    .meta(field({ label: "Server URL", kind: "url" })),
  token: z.string().meta(
    field({
      label: "Token",
      kind: "secret",
      optional: true,
      help: "Only if the server asks for one.",
    }),
  ),
});

const computer = z.object({
  name: z
    .string()
    .min(1)
    .meta(field({ label: "Computer name" })),
});

const remainingKinds = z.object({
  phone: z
    .string()
    .meta(
      field({ label: "Phone", kind: "tel", help: "Optional contact number." }),
    ),
  access: z.array(z.enum(["read", "write"])).meta(
    field({
      label: "Document access",
      kind: "checkboxes",
      help: "Choose the rights this form may grant.",
      options: { read: "Read", write: "Write" },
    }),
  ),
});

/** Opt-in label columns beside the existing default form rhythm. */
export function Columns() {
  return (
    <main className="caps-columns-stage mx-auto flex w-full flex-col gap-xl px-lg py-2xl">
      <h1 className="text-lg font-semibold">Settings forms · label columns</h1>
      <Card>
        <CardContent className="flex flex-col gap-lg">
          <h2 className="text-sm font-semibold">Add MCP server to Enoki</h2>
          <SchemaForm
            schema={server}
            defaultValues={{
              name: "notion",
              url: "http://mcp.notion.com/mcp",
              token: "",
            }}
            onSubmit={() => ({ kind: "saved" })}
            onCancel={() => undefined}
            submitLabel="Add server"
            layout="columns"
          />
        </CardContent>
      </Card>
      <div className="caps-columns-narrow">
        <Card className="w-full">
          <CardContent className="flex flex-col gap-lg">
            <h2 className="text-sm font-semibold">
              Every declared field kind · 30rem
            </h2>
            <SchemaForm
              schema={settingsSchema}
              defaultValues={settingsDefaults}
              onSubmit={() => ({ kind: "saved" })}
              onCancel={() => undefined}
              submitLabel="Save settings"
              layout="columns"
            />
          </CardContent>
        </Card>
      </div>
      <div className="caps-columns-narrow">
        <Card className="w-full">
          <CardContent className="flex flex-col gap-lg">
            <h2 className="text-sm font-semibold">
              Phone and plain choices · 30rem
            </h2>
            <SchemaForm
              schema={remainingKinds}
              defaultValues={{ phone: "", access: ["read"] }}
              onSubmit={() => ({ kind: "saved" })}
              onCancel={() => undefined}
              submitLabel="Save rights"
              layout="columns"
            />
          </CardContent>
        </Card>
      </div>
      <Card className="w-full">
        <CardContent className="flex flex-col gap-lg">
          <h2 className="text-sm font-semibold">New Computer · one row</h2>
          <SchemaForm
            schema={computer}
            defaultValues={{ name: "Render box" }}
            onSubmit={() => ({ kind: "saved" })}
            onCancel={() => undefined}
            submitLabel="Add Computer"
            layout="columns"
          />
        </CardContent>
      </Card>
    </main>
  );
}
