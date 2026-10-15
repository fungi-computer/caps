import type { Story } from "@ladle/react";
import { useState } from "react";
import { Checkbox as CapsCheckbox } from "../src/components/checkbox.js";
import "./status.css";
import "./checkbox.css";

const states = ["unchecked", "checked", "mixed"] as const;

export const Checkbox: Story = () => {
  const [state, setState] = useState<(typeof states)[number]>("unchecked");
  return (
    <main className="status-study checkbox-study" data-conformance="checkbox">
      <section className="status-study-stage" aria-label="Checkbox preview">
        <span className="status-study-caption">4× / {state}</span>
        <div className="checkbox-study-magnified" data-checkbox-preview>
          <CapsCheckbox
            aria-label="Preview checkbox"
            checked={state === "checked"}
            indeterminate={state === "mixed"}
            onChange={(event) => {
              setState(event.currentTarget.checked ? "checked" : "unchecked");
            }}
          />
        </div>
        <span className="status-study-hint">
          One stroke, tip to tip. Space works too.
        </span>
      </section>
      <div className="status-study-controls">
        <fieldset>
          <legend>State</legend>
          <div className="status-study-options">
            {states.map((option) => (
              <button
                key={option}
                type="button"
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
      <pre className="status-study-code">
        <code>
          {state === "mixed"
            ? "<Checkbox checked={allSelected} indeterminate={someSelected && !allSelected} onChange={toggleAll} />"
            : "<Checkbox checked={enabled} onChange={e => setEnabled(e.currentTarget.checked)} />"}
        </code>
      </pre>
      <section className="status-study-context" aria-label="Actual size">
        <div>
          <h2>Actual size</h2>
          <p>Independent choices, with mixed, disabled and invalid states.</p>
        </div>
        <label className="status-study-row">
          <span>Include attachments</span>
          <CapsCheckbox
            checked={state === "checked"}
            indeterminate={state === "mixed"}
            onChange={(event) => {
              setState(event.currentTarget.checked ? "checked" : "unchecked");
            }}
          />
        </label>
        <label className="status-study-row">
          <span>Keep a local copy</span>
          <CapsCheckbox defaultChecked />
        </label>
        <label className="status-study-row">
          <span>Managed setting</span>
          <CapsCheckbox defaultChecked disabled />
        </label>
        <label className="status-study-row">
          <span>Needs attention</span>
          <CapsCheckbox invalid />
        </label>
      </section>
    </main>
  );
};
