import type { Story } from "@ladle/react";
import { useState } from "react";
import {
  Combobox as Picker,
  ComboboxTrigger,
} from "../src/components/combobox.js";
import { Field } from "../src/components/field.js";
import "./status.css";
import "./input.css";

const items = [
  { id: "workbench", name: "Workbench" },
  { id: "studio", name: "Studio" },
  { id: "travel", name: "Travel laptop" },
  { id: "archive", name: "Archive · unavailable" },
];

function ComboboxStudy({ multiple = false }: { multiple?: boolean }) {
  const [value, setValue] = useState<string | null>("workbench");
  const [values, setValues] = useState<string[]>(["workbench", "studio"]);
  const [state, setState] = useState("ready");
  const common = {
    items: state === "empty" ? [] : items,
    getKey: (item: (typeof items)[number]) => item.id,
    getLabel: (item: (typeof items)[number]) => item.name,
    isDisabled: (item: (typeof items)[number]) => item.id === "archive",
    inputProps: { "aria-label": "Search Computers" },
    placeholder: "Search Computers…",
    emptyMessage: "No matching Computers",
  };
  return (
    <main className="status-study input-study" data-conformance="combobox">
      <section className="status-study-stage" aria-label="Combobox preview">
        <span className="status-study-caption">
          Molded picker / {multiple ? "multiple selection" : "single selection"}
        </span>
        <div className="input-study-preview">
          <Field label="Computers">
            {multiple ? (
              <Picker
                {...common}
                multiple
                value={values}
                onValueChange={setValues}
                trigger={
                  <ComboboxTrigger disabled={state === "disabled"}>
                    {values.length
                      ? `${String(values.length)} selected`
                      : "Choose Computers…"}
                  </ComboboxTrigger>
                }
              />
            ) : (
              <Picker
                {...common}
                value={value}
                onValueChange={setValue}
                trigger={
                  <ComboboxTrigger disabled={state === "disabled"}>
                    {items.find((item) => item.id === value)?.name ??
                      "Choose a Computer…"}
                  </ComboboxTrigger>
                }
              />
            )}
          </Field>
        </div>
        <span className="status-study-hint">
          Search, then use arrows and Enter. Escape returns to the field.
          {multiple
            ? " Select again to remove; the picker stays open."
            : " Selection closes the picker."}
        </span>
      </section>
      <div className="status-study-controls">
        <fieldset>
          <legend>State</legend>
          <div className="status-study-options">
            {["ready", "disabled", "empty"].map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={state === option}
                onClick={() => {
                  setState(option);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </main>
  );
}

export const Combobox: Story = () => <ComboboxStudy />;
export const MultiSelect: Story = () => <ComboboxStudy multiple />;
