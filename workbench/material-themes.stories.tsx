import type { StoryDefault } from "@ladle/react";
import { useState } from "react";
import { Button } from "../src/components/button.js";
import { Checkbox } from "../src/components/checkbox.js";
import { Field } from "../src/components/field.js";
import { Input } from "../src/components/input.js";
import { Listbox } from "../src/components/listbox.js";
import { Select } from "../src/components/select.js";
import { ScrollArea } from "../src/components/scroll-area.js";
import { Display } from "../src/components/surface.js";

export default {
  title: "Foundations / Material themes",
} satisfies StoryDefault;

const names = [
  "Workbench",
  "Studio",
  "Travel laptop",
  "Garden terminal",
  "Field recorder",
  "Archive",
];

/** One composition rendered twice; only data-theme differs. No demo CSS. */
export function Compare() {
  const [baseline, setBaseline] = useState("latte");
  const [variant, setVariant] = useState("phosphor");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>("Workbench");
  const [checked, setChecked] = useState(true);
  const [count, setCount] = useState(0);
  const items = names.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="grid gap-lg">
      <div className="flex flex-wrap gap-lg">
        <Field label="Existing theme">
          <Select
            value={baseline}
            onChange={(event) => {
              setBaseline(event.target.value);
            }}
          >
            <option value="latte">Latte</option>
            <option value="mocha">Mocha</option>
          </Select>
        </Field>
        <Field label="Optional theme">
          <Select
            value={variant}
            onChange={(event) => {
              setVariant(event.target.value);
            }}
          >
            <option value="phosphor">Phosphor</option>
            <option value="field-guide">Field guide</option>
            <option value="field-guide-night">Field guide night</option>
            <option value="codec">Codec</option>
          </Select>
        </Field>
      </div>
      <div className="grid gap-lg md:grid-cols-2">
        {[baseline, variant].map((theme, index) => (
          <section
            key={index}
            data-theme={theme}
            aria-label={theme + " comparison"}
            className="grid min-w-0 gap-lg bg-base-200 p-lg text-base-content"
          >
            <h2 className="text-lg font-bold">{theme}</h2>
            <Field label="Find a computer">
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
              />
            </Field>
            <ScrollArea surface screen className="h-48">
              <Listbox
                aria-label="Computers"
                items={items}
                getKey={(item) => item}
                getLabel={(item) => item}
                value={selected}
                onValueChange={setSelected}
              />
            </ScrollArea>
            <Display>
              <div className="grid gap-md p-lg">
                <p>{selected ?? "No computer selected"}</p>
                <Field label="Example permission" orientation="horizontal">
                  <Checkbox
                    checked={checked}
                    onChange={(event) => {
                      setChecked(event.target.checked);
                    }}
                  />
                </Field>
                <p role="status">Example actions: {count}</p>
              </div>
            </Display>
            <Button
              onClick={() => {
                setCount(count + 1);
              }}
            >
              Example action
            </Button>
          </section>
        ))}
      </div>
    </div>
  );
}
