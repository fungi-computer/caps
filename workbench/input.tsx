import type { Story } from "@ladle/react";
import { useState } from "react";
import { Field } from "../src/components/field.js";
import { Button } from "../src/components/button.js";
import { InputGroup } from "../src/components/input-group.js";
import { Input as CapsInput } from "../src/components/input.js";
import "./status.css";
import "./input.css";

const states = ["ready", "invalid", "read-only", "disabled"] as const;
const sizeOptions = ["compact", "regular", "large"] as const;

export const Input: Story = () => {
  const [state, setState] = useState<(typeof states)[number]>("ready");
  const [size, setSize] = useState<(typeof sizeOptions)[number]>("regular");
  const [value, setValue] = useState("Weekend ideas");
  const [saved, setSaved] = useState(false);
  return (
    <main className="status-study input-study" data-conformance="input">
      <section className="status-study-stage" aria-label="Input preview">
        <span className="status-study-caption">Native size / {state}</span>
        <div className="input-study-preview">
          <Field
            label="Project name"
            description="A little room for your next idea."
            error={
              state === "invalid"
                ? "This name is already taken. Try another."
                : undefined
            }
          >
            <CapsInput
              className={
                size === "compact"
                  ? "input-sm"
                  : size === "large"
                    ? "input-lg"
                    : "input-md"
              }
              value={value}
              onChange={(event) => {
                setValue(event.currentTarget.value);
              }}
              placeholder="Give it a name"
              disabled={state === "disabled"}
              readOnly={state === "read-only"}
            />
          </Field>
        </div>
        <span className="status-study-hint">Click in. Type. Tab away.</span>
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
        <fieldset>
          <legend>Size</legend>
          <div className="status-study-options">
            {sizeOptions.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={size === option}
                onClick={() => {
                  setSize(option);
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
          {
            '<Field label="Project name" error={error}>\n  <Input value={name} onChange={e => setName(e.currentTarget.value)} />\n</Field>'
          }
        </code>
      </pre>
      <section className="input-study-joined" aria-label="Input with an action">
        <div>
          <h2>One assembly</h2>
          <p>
            A writing panel beside a raised action. Both remain native controls.
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(true);
          }}
        >
          <label htmlFor="input-project-slug">Project handle</label>
          <InputGroup>
            <CapsInput
              id="input-project-slug"
              name="handle"
              defaultValue="weekend-ideas"
              required
              onChange={() => {
                setSaved(false);
              }}
            />
            <Button type="submit">Save</Button>
          </InputGroup>
          <output aria-live="polite">
            {saved
              ? "Saved locally for this example."
              : "Edit the handle, then press Enter or Save."}
          </output>
        </form>
      </section>
      <section className="status-study-context" aria-label="Native input types">
        <div>
          <h2>Same material, native behavior</h2>
          <p>
            Autofill, selection, password managers and keyboard input stay with
            the browser.
          </p>
        </div>
        <Field label="Email">
          <CapsInput
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Search">
          <CapsInput type="search" placeholder="Find something" />
        </Field>
        <Field label="Password">
          <CapsInput
            type="password"
            autoComplete="new-password"
            defaultValue="little-workspace"
          />
        </Field>
        <Field label="Workspace ID" description="Read-only; still selectable.">
          <CapsInput readOnly value="weekend-ideas" />
        </Field>
      </section>
    </main>
  );
};
