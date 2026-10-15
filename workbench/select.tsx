import type { Story } from "@ladle/react";
import { useState } from "react";
import { Select as CapsSelect } from "../src/components/select.js";
import { Field } from "../src/components/field.js";
import { Button } from "../src/components/button.js";
import "./status.css";
import "./input.css";

const sizes = ["compact", "regular", "large"] as const;
const states = ["ready", "invalid", "disabled"] as const;

export const Select: Story = () => {
  const [size, setSize] = useState<(typeof sizes)[number]>("compact");
  const [state, setState] = useState<(typeof states)[number]>("ready");
  const [value, setValue] = useState("landscape");
  const [format, setFormat] = useState("png");
  const [exported, setExported] = useState("");
  return (
    <main className="status-study input-study" data-conformance="select">
      <section className="status-study-stage" aria-label="Select preview">
        <span className="status-study-caption">
          Molded edge / native choice
        </span>
        <div className="input-study-preview">
          <Field
            label="Canvas shape"
            description="Choose the frame for your next idea."
            error={
              state === "invalid"
                ? "This shape is unavailable for the selected output."
                : undefined
            }
          >
            <CapsSelect
              className={
                size === "compact"
                  ? "select-sm"
                  : size === "large"
                    ? "select-lg"
                    : "select-md"
              }
              disabled={state === "disabled"}
              invalid={state === "invalid"}
              value={value}
              onChange={(event) => {
                setValue(event.currentTarget.value);
              }}
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
              <option value="square">Square</option>
            </CapsSelect>
          </Field>
        </div>
        <span className="status-study-hint">
          Tab in. Use the arrow keys. The option list stays native.
        </span>
      </section>
      <div className="status-study-controls">
        <fieldset>
          <legend>Size</legend>
          <div className="status-study-options">
            {sizes.map((option) => (
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
      <section className="input-study-joined" aria-label="Compact toolbar">
        <div>
          <h2>A little control deck</h2>
          <p>The same finish, beside a real action.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setExported(`Prepared ${format.toUpperCase()} export`);
          }}
        >
          <div className="flex items-center gap-sm">
            <CapsSelect
              aria-label="Export format"
              className="select-sm"
              value={format}
              onChange={(event) => {
                setFormat(event.currentTarget.value);
              }}
            >
              <option value="png">PNG · lossless</option>
              <option value="jpeg">JPEG · smaller file</option>
              <option value="webp">WebP · web ready</option>
            </CapsSelect>
            <Button type="submit" size="sm">
              Export
            </Button>
          </div>
          <output aria-live="polite">
            {exported || "Choose a format, then export."}
          </output>
        </form>
      </section>
    </main>
  );
};
