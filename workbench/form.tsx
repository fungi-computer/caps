import type { Story } from "@ladle/react";
import { useState, type ReactNode } from "react";

import { Button } from "../src/components/button.js";
import { Card, CardContent } from "../src/components/card.js";
import { Checkbox } from "../src/components/checkbox.js";
import {
  Field,
  FieldSet,
  Form,
  FormFooter,
  FormSection,
} from "../src/components/field.js";
import { Input } from "../src/components/input.js";
import { InputGroup, InputGroupAddon } from "../src/components/input-group.js";
import { RadioGroup, RadioGroupCard } from "../src/components/radio-group.js";
import { Select } from "../src/components/select.js";
import { Status } from "../src/components/status.js";
import { Switch } from "../src/components/switch.js";
import { Textarea } from "../src/components/textarea.js";

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

/** Every form part in one settings form: sections, marks, help, errors, footer. */
export const FormAnatomy: Story = () => {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("weekend-ideas");
  const [plan, setPlan] = useState("standard");
  const nameError =
    name.trim() === ""
      ? "Enter a name."
      : /\s/.test(name)
        ? "Use letters, numbers and dashes, without spaces."
        : undefined;
  return (
    <Stage>
      <Card>
        <CardContent>
          <Form
            aria-label="Computer settings"
            busy={busy}
            onSubmit={(event) => {
              event.preventDefault();
              if (nameError) return;
              setBusy(true);
              setSaved(false);
              window.setTimeout(() => {
                setBusy(false);
                setSaved(true);
              }, 900);
            }}
          >
            <FormSection
              title="Computer"
              description="How this Computer appears to your Team."
            >
              <Field label="Name" required error={nameError}>
                <Input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                />
              </Field>
              <Field
                label="Notes"
                optional
                description="Only your Team sees these."
              >
                <Textarea rows={3} placeholder="What runs here" />
              </Field>
              <Field label="Region">
                <Select defaultValue="hel">
                  <option value="hel">Helsinki</option>
                  <option value="fsn">Falkenstein</option>
                </Select>
              </Field>
            </FormSection>
            <FormSection
              title="Size"
              description="You can resize later; running work restarts."
            >
              <RadioGroup
                aria-label="Size"
                orientation="horizontal"
                value={plan}
                onValueChange={setPlan}
              >
                <RadioGroupCard
                  value="small"
                  title="Small"
                  description="Scripts and light Apps."
                  meta="2 GB"
                />
                <RadioGroupCard
                  value="standard"
                  title="Standard"
                  description="Most Teams start here."
                  meta="8 GB"
                />
              </RadioGroup>
            </FormSection>
            <FormSection title="Access">
              <Field
                orientation="horizontal"
                label="Internet access"
                description="Let Agents on this Computer reach the web."
              >
                <Switch defaultChecked />
              </Field>
              <FieldSet
                legend="Rights"
                description="Shared by every Agent on this Computer."
              >
                <Field orientation="inline" label="Read files">
                  <Checkbox defaultChecked />
                </Field>
                <Field orientation="inline" label="Write files">
                  <Checkbox defaultChecked />
                </Field>
                <Field
                  orientation="inline"
                  label="Run commands"
                  description="Includes installing packages."
                >
                  <Checkbox />
                </Field>
              </FieldSet>
            </FormSection>
            <FormFooter
              status={
                saved ? (
                  <Status tone="success" size="compact" label="Saved" />
                ) : null
              }
            >
              <Button type="reset" variant="ghost">
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Save changes
              </Button>
            </FormFooter>
          </Form>
        </CardContent>
      </Card>
    </Stage>
  );
};

/** The states a field can be in, side by side at the same control height. */
export const FormStates: Story = () => (
  <Stage wide>
    <div className="grid gap-xl sm:grid-cols-2">
      <Field label="Default" description="Help sits under the label.">
        <Input placeholder="Placeholder" />
      </Field>
      <Field label="Required" required>
        <Input defaultValue="Filled" />
      </Field>
      <Field label="Optional" optional>
        <Input />
      </Field>
      <Field label="Invalid" error="Use at least 3 characters.">
        <Input defaultValue="ab" />
      </Field>
      <Field label="Disabled" description="Managed by your Team owner.">
        <Input defaultValue="Locked value" disabled />
      </Field>
      <Field label="Read only">
        <Input defaultValue="fungi.computer" readOnly />
      </Field>
      <Field label="Amount" description="Top-ups start at $5.00.">
        <InputGroup>
          <InputGroupAddon>$</InputGroupAddon>
          <Input inputMode="decimal" defaultValue="20.00" />
        </InputGroup>
      </Field>
      <Field label="Select" error="Choose a model.">
        <Select defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          <option value="luna">Luna</option>
        </Select>
      </Field>
    </div>
    <div className="grid grid-cols-[1fr_auto] gap-sm sm:grid-cols-[1fr_10rem_auto_auto]">
      <Input aria-label="Inline input" placeholder="One row, one height" />
      <Select aria-label="Inline select">
        <option>Owner</option>
      </Select>
      <Button variant="outline">Outline</Button>
      <Button>Primary</Button>
    </div>
  </Stage>
);

/** RadioGroupCard: choices that need a sentence or a readout. */
export const ChoiceCards: Story = () => {
  const [value, setValue] = useState("monthly");
  return (
    <Stage wide>
      <Field label="Billing" description="Change it any time from Billing.">
        <RadioGroup
          orientation="horizontal"
          value={value}
          onValueChange={setValue}
        >
          <RadioGroupCard
            value="monthly"
            title="Monthly"
            description="Pay as you go, cancel any time."
            meta="$20/mo"
          />
          <RadioGroupCard
            value="yearly"
            title="Yearly"
            description="Two months free."
            meta="$200/yr"
          />
          <RadioGroupCard
            value="team"
            title="Team"
            description="Ask your Team owner to switch."
            meta="custom"
            disabled
          />
        </RadioGroup>
      </Field>
      <RadioGroup aria-label="Stacked" defaultValue="a">
        <RadioGroupCard value="a" title="Stacked" meta="vertical" />
        <RadioGroupCard
          value="b"
          title="One per row"
          description="Vertical groups stack cards full width."
        />
      </RadioGroup>
    </Stage>
  );
};

/** Footers: one primary, quiet secondary actions, submit errors and status. */
export const FormFooters: Story = () => (
  <Stage>
    <Card>
      <CardContent>
        <FormFooter>
          <Button variant="ghost">Cancel</Button>
          <Button>Save</Button>
        </FormFooter>
      </CardContent>
    </Card>
    <Card>
      <CardContent>
        <FormFooter
          error="Stripe declined the card. Try another card."
          status={<Status tone="warning" size="compact" label="Not saved" />}
        >
          <Button variant="ghost">Cancel</Button>
          <Button>Retry</Button>
        </FormFooter>
      </CardContent>
    </Card>
    <Card>
      <CardContent>
        <FormFooter layout="stretch" divider={false}>
          <Button variant="outline">Continue with GitHub</Button>
          <Button>Send code</Button>
        </FormFooter>
      </CardContent>
    </Card>
    <Card>
      <CardContent>
        <FormFooter>
          <Button variant="ghost" disabled>
            Cancel
          </Button>
          <Button loading>Saving</Button>
        </FormFooter>
      </CardContent>
    </Card>
  </Stage>
);
