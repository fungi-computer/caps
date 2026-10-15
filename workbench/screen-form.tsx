import type { Story } from "@ladle/react";
import { useState } from "react";
import { Sigil } from "@fungi.computer/sigils";

import { Checkbox } from "../src/components/checkbox.js";
import { Button } from "../src/components/button.js";
import { Field, FieldSet, Form, FormFooter } from "../src/components/field.js";
import { IconCheckbox } from "../src/components/icon-checkbox.js";
import { IconRadio } from "../src/components/icon-radio.js";
import { RadioGroup } from "../src/components/radio-group.js";
import { Slider } from "../src/components/slider.js";
import { Display } from "../src/components/surface.js";
import { Switch } from "../src/components/switch.js";
import "./screen-form.css";

function IconRadioChoices() {
  return (
    <FieldSet legend="Opens in">
      <RadioGroup
        name="runtime"
        defaultValue="prints"
        orientation="horizontal"
        aria-label="Opens in"
      >
        <IconRadio
          value="prints"
          label="Prints"
          caption="PRINTS"
          icon={<Sigil name="prints" />}
        />
        <IconRadio
          value="inkcap"
          label="Inkcap"
          caption="INKCAP"
          icon={<Sigil name="inkcap" />}
        />
        <IconRadio
          value="vishnu"
          label="Vishnu"
          caption="VISHNU"
          icon={<Sigil name="vishnu" />}
          disabled
        />
      </RadioGroup>
    </FieldSet>
  );
}

function IconCheckboxChoices() {
  return (
    <FieldSet legend="File access">
      <div className="screen-form-study-choices">
        <IconCheckbox
          name="access"
          value="read"
          label="Read files"
          caption="READ"
          icon={<Sigil name="read" />}
          defaultChecked
        />
        <IconCheckbox
          name="access"
          value="write"
          label="Write files"
          caption="WRITE"
          icon={<Sigil name="write" />}
        />
        <IconCheckbox
          label="Run commands"
          caption="RUN"
          icon={<Sigil name="run" />}
          disabled
        />
      </div>
    </FieldSet>
  );
}

/** Independent checkbox rights, including the unavailable state. */
export const IconCheckboxes: Story = () => <IconCheckboxChoices />;

/** Exclusive icon choices with native radio keyboard semantics. */
export const IconRadios: Story = () => <IconRadioChoices />;

/** Native selection and reset, including an unavailable choice. */
export const IconChoices: Story = () => (
  <Form
    aria-label="Icon choices"
    onSubmit={(event) => {
      event.preventDefault();
    }}
  >
    <IconRadioChoices />
    <IconCheckboxChoices />
    <FormFooter>
      <Button type="reset" variant="ghost">
        Reset
      </Button>
      <Button type="submit">Save</Button>
    </FormFooter>
  </Form>
);

/** The form layer, unchanged, on the glass: the Screen supplies the context. */
export const OnAScreen: Story = () => {
  const [internet, setInternet] = useState(true);
  const [share, setShare] = useState(60);
  const [backups, setBackups] = useState(false);
  const [access, setAccess] = useState<ReadonlySet<string>>(new Set(["read"]));
  const [runtime, setRuntime] = useState("prints");
  const fields = (
    <>
      <FieldSet legend="Opens in">
        <RadioGroup
          orientation="horizontal"
          value={runtime}
          onValueChange={setRuntime}
          aria-label="Opens in"
        >
          {(["prints", "inkcap", "vishnu"] as const).map((value) => (
            <IconRadio
              key={value}
              value={value}
              label={
                value === "prints"
                  ? "Prints"
                  : value === "inkcap"
                    ? "Inkcap"
                    : "Vishnu"
              }
              caption={value}
              icon={<Sigil name={value} />}
            />
          ))}
        </RadioGroup>
      </FieldSet>
      <FieldSet legend="File access">
        <div className="screen-form-study-choices">
          {(["list", "read", "write", "run"] as const).map((id) => (
            <IconCheckbox
              key={id}
              label={
                id === "run"
                  ? "Run commands"
                  : `${id === "list" ? "List" : id === "read" ? "Read" : "Write"} files`
              }
              caption={id.toUpperCase()}
              icon={<Sigil name={id} />}
              name="access"
              value={id}
              checked={access.has(id)}
              onChange={(event) => {
                const next = new Set(access);
                if (event.target.checked) next.add(id);
                else next.delete(id);
                setAccess(next);
              }}
            />
          ))}
        </div>
      </FieldSet>
      <Field label="Internet" orientation="horizontal">
        <Switch checked={internet} onCheckedChange={setInternet} />
      </Field>
      <Field label="Nightly backups" orientation="horizontal">
        <Switch checked={backups} onCheckedChange={setBackups} />
      </Field>
      <Field label="CPU share" description={`${String(share)}%`}>
        <Slider
          min={0}
          max={100}
          step={5}
          value={share}
          aria-valuetext={`${String(share)} percent`}
          onChange={(event) => {
            setShare(event.target.valueAsNumber);
          }}
        />
      </Field>
      <FieldSet legend="Access">
        {[
          ["read", "Read files"],
          ["write", "Write files"],
        ].map(([id = "", label]) => (
          <Field key={id} label={label} orientation="inline">
            <Checkbox
              checked={access.has(id)}
              onChange={(event) => {
                const next = new Set(access);
                if (event.target.checked) next.add(id);
                else next.delete(id);
                setAccess(next);
              }}
            />
          </Field>
        ))}
        <Field label="Mixed access" orientation="inline">
          <Checkbox indeterminate />
        </Field>
        <Field label="Unavailable access" orientation="inline">
          <Checkbox disabled checked readOnly />
        </Field>
      </FieldSet>
    </>
  );
  return (
    <main className="screen-form-study">
      <section aria-label="On a screen">
        <Display>
          <div className="screen-form-study-glass">{fields}</div>
        </Display>
      </section>
      <section aria-label="Off the screen" className="screen-form-study-plain">
        {fields}
      </section>
    </main>
  );
};
