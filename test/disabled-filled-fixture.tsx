import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { KeycapButton } from "../src/components/keycap.js";
import { Button } from "../src/components/button.js";
import { Form } from "../src/components/field.js";
import { Input } from "../src/components/input.js";
import { InputGroup } from "../src/components/input-group.js";
import { Composer } from "../src/blocks/composer.js";
import { effectValidator, FormField, SubmitFooter } from "../src/form.js";
import "../dist/styles.css";

const schema = Schema.Struct({
  name: Schema.String.check(
    Schema.isMinLength(1, { message: "Enter a name." }),
  ),
});

function Example() {
  const finish = useRef<(() => void) | undefined>(undefined);
  const [saved, setSaved] = useState(0);
  const form = useForm({
    defaultValues: { name: "Levi" },
    validators: {
      onChange: effectValidator(schema),
      onSubmit: effectValidator(schema),
    },
    onSubmit: async () => {
      await new Promise<void>((resolve) => {
        finish.current = resolve;
      });
      finish.current = undefined;
      setSaved((count) => count + 1);
    },
  });
  return (
    <main className="mx-auto grid max-w-(--container-lg) gap-xl p-lg">
      <Form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.state.isSubmitting) void form.handleSubmit();
        }}
      >
        <FormField form={form} name="name" label="Name">
          {(field) => (
            <Input
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => {
                field.handleChange(event.currentTarget.value);
              }}
            />
          )}
        </FormField>
        <SubmitFooter form={form} label="Save" />
      </Form>
      <Button variant="outline" onClick={() => finish.current?.()}>
        Finish save
      </Button>
      <output aria-label="Saved count">{saved}</output>
      <section aria-label="Molded primary key" className="grid gap-sm">
        <KeycapButton tone="primary" label="Ready" />
        <KeycapButton tone="primary" label="Disabled" disabled />
        <KeycapButton
          tone="primary"
          label="Unavailable key"
          aria-disabled="true"
        />
      </section>
      <section aria-label="Joined action" className="grid gap-sm">
        <InputGroup>
          <Input aria-label="Ready handle" defaultValue="weekend-ideas" />
          <Button>Ready</Button>
        </InputGroup>
        <InputGroup>
          <Input aria-label="Disabled handle" defaultValue="weekend-ideas" />
          <Button disabled>Disabled</Button>
        </InputGroup>
      </section>
      <section aria-label="Nested Composer action" className="grid gap-sm">
        {[false, true].map((disabled) => (
          <Composer
            key={String(disabled)}
            input={
              <Input aria-label={disabled ? "Queued prompt" : "Ready prompt"} />
            }
            toolbar={<span>Model</span>}
            action={
              <Button disabled={disabled}>
                {disabled ? "Disabled" : "Ready"}
              </Button>
            }
          />
        ))}
      </section>
      {(["primary", "secondary", "accent", "destructive"] as const).map(
        (variant) => (
          <section key={variant} aria-label={variant} className="grid gap-sm">
            <h2>{variant}</h2>
            <Button variant={variant}>Ready</Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} asChild disabled>
              <a href="#disabled">Unavailable link</a>
            </Button>
          </section>
        ),
      )}
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(<Example />);
