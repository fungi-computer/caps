import type { StoryDefault } from "@ladle/react";
import { useState } from "react";
import { Button } from "../src/components/button.js";
import { Input } from "../src/components/input.js";
import { Field } from "../src/components/field.js";
import { Select } from "../src/components/select.js";
import { Checkbox } from "../src/components/checkbox.js";
import { Combobox, ComboboxTrigger } from "../src/components/combobox.js";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../src/components/dialog.js";
import { Display, Surface } from "../src/components/surface.js";

export default {
  title: "Foundations / Material conformance",
} satisfies StoryDefault;

const themes = [
  "latte",
  "mocha",
  "field-guide",
  "field-guide-night",
  "phosphor",
  "codec",
  "light",
  "dark",
];
const computers = ["Workbench", "Studio", "Travel laptop"];

function ThemeControls() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div className="grid gap-lg p-lg" ref={setContainer}>
      <div className="flex flex-wrap gap-lg">
        <Button>Normal action</Button>
        <Button disabled>Disabled action</Button>
        <Button variant="outline">Secondary action</Button>
      </div>
      <label>
        Normal field
        <Input defaultValue="Editable" />
      </label>
      <label>
        Invalid field
        <Input aria-invalid="true" defaultValue="Invalid" />
      </label>
      <label>
        Disabled field
        <Input disabled defaultValue="Disabled" />
      </label>
      <label>
        <Checkbox defaultChecked />
        Selected permission
      </label>
      <label>
        <Checkbox disabled />
        Disabled permission
      </label>
      <Combobox
        container={container}
        aria-label="Computer"
        items={computers}
        getKey={(item) => item}
        getLabel={(item) => item}
        trigger={<ComboboxTrigger>Choose computer</ComboboxTrigger>}
      />
      <Dialog>
        <DialogTrigger render={<Button />}>Open themed dialog</DialogTrigger>
        <DialogContent container={container}>
          <DialogTitle>Theme stays with the dialog</DialogTitle>
          <DialogDescription>
            This popup inherits its caller-selected container.
          </DialogDescription>
          <Input aria-label="Dialog draft" defaultValue="Retained draft" />
          <DialogClose render={<Button />}>Close dialog</DialogClose>
        </DialogContent>
      </Dialog>
      <div className="flex gap-lg">
        {(["sm", "md", "lg"] as const).map((size) => (
          <Surface size={size} key={size}>
            <span className="p-lg">{size}</span>
          </Surface>
        ))}
      </div>
      <Display>
        <p className="p-lg">A display uses the same theme surface and ink.</p>
      </Display>
    </div>
  );
}

export function Nested() {
  const [outer, setOuter] = useState("phosphor");
  const [inner, setInner] = useState("latte");
  return (
    <div className="grid gap-lg">
      <div className="flex gap-lg">
        <Field label="Outer theme">
          <Select
            value={outer}
            onChange={(event) => {
              setOuter(event.target.value);
            }}
          >
            {themes.map((theme) => (
              <option key={theme}>{theme}</option>
            ))}
          </Select>
        </Field>
        <Field label="Inner theme">
          <Select
            value={inner}
            onChange={(event) => {
              setInner(event.target.value);
            }}
          >
            {themes.map((theme) => (
              <option key={theme}>{theme}</option>
            ))}
          </Select>
        </Field>
      </div>
      <section
        data-theme={outer}
        className="bg-base-200 p-lg text-base-content"
        aria-label="Outer theme sample"
      >
        <Display>
          <p className="p-lg">Outer: {outer}</p>
        </Display>
        <section
          data-theme={inner}
          className="mt-lg bg-base-100 text-base-content"
          aria-label="Inner theme sample"
        >
          <ThemeControls />
        </section>
      </section>
    </div>
  );
}
