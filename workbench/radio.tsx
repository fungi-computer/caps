import type { Story } from "@ladle/react";
import { useState } from "react";
import {
  RadioGroup as CapsRadioGroup,
  RadioGroupItem,
} from "../src/components/radio-group.js";
import "./status.css";
import "./radio.css";

const options = ["Quiet", "Balanced", "Bold"];

export const RadioGroup: Story = () => {
  const [value, setValue] = useState("Balanced");
  return (
    <main className="status-study radio-study" data-conformance="radio-group">
      <section className="status-study-stage" aria-label="Radio preview">
        <span className="status-study-caption">4× / {value.toLowerCase()}</span>
        <CapsRadioGroup
          aria-label="Preview choices"
          value={value}
          onValueChange={setValue}
          orientation="horizontal"
          className="radio-study-magnified"
          data-radio-preview
        >
          {options.map((option) => (
            <label key={option}>
              <RadioGroupItem value={option} />
              <span>{option}</span>
            </label>
          ))}
        </CapsRadioGroup>
        <span className="status-study-hint">
          Select a well. Try the arrow keys or reverse midway.
        </span>
      </section>
      <pre className="status-study-code">
        <code>
          {
            '<RadioGroup value={choice} onValueChange={setChoice}>\n  <label><RadioGroupItem value="quiet" /> Quiet</label>\n  <label><RadioGroupItem value="bold" /> Bold</label>\n</RadioGroup>'
          }
        </code>
      </pre>
      <section className="status-study-context" aria-label="Actual size">
        <div>
          <h2>Actual size</h2>
          <p>One choice, with the same recessed surface as Switch.</p>
        </div>
        <CapsRadioGroup
          aria-label="Appearance"
          value={value}
          onValueChange={setValue}
        >
          {options.map((option) => (
            <label className="status-study-row" key={option}>
              <span>{option}</span>
              <RadioGroupItem value={option} />
            </label>
          ))}
        </CapsRadioGroup>
        <CapsRadioGroup
          aria-label="Managed appearance"
          defaultValue="Balanced"
          disabled
        >
          {options.map((option) => (
            <label className="status-study-row" key={option}>
              <span>{option}</span>
              <RadioGroupItem value={option} />
            </label>
          ))}
        </CapsRadioGroup>
      </section>
    </main>
  );
};
