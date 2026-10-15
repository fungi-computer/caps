import type { Story } from "@ladle/react";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import {
  Button as CapsButton,
  type ButtonSize,
} from "../src/components/button.js";
import "./status.css";
import "./button.css";

const finishes = [
  { name: "Primary", variant: "primary" },
  { name: "Secondary", variant: "secondary" },
  { name: "Accent", variant: "accent" },
] as const;
const sizes = ["sm", "default", "lg"] as const;
const states = ["ready", "loading", "disabled"] as const;

export const Button: Story = () => {
  const [size, setSize] = useState<ButtonSize>("default");
  const [state, setState] = useState<(typeof states)[number]>("ready");
  const [presses, setPresses] = useState(0);
  return (
    <main className="status-study button-study" data-conformance="button">
      <section className="status-study-stage" aria-label="Button preview">
        <span className="status-study-caption">
          Native size / molded finish
        </span>
        <div className="button-study-finishes">
          {finishes.map(({ name, variant }) => (
            <div
              className="button-study-finish"
              role="group"
              aria-label={`${name} finish`}
              key={name}
            >
              <CapsButton
                variant={variant}
                size={size}
                loading={state === "loading"}
                disabled={state === "disabled"}
                onClick={() => {
                  setPresses((count) => count + 1);
                }}
              >
                Continue <ArrowRight size={16} aria-hidden="true" />
              </CapsButton>
              <span>{name}</span>
            </div>
          ))}
        </div>
        <span className="status-study-hint">
          Press into the surface. Release for a little spring.
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
                {option === "sm"
                  ? "Compact"
                  : option === "lg"
                    ? "Large"
                    : "Regular"}
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
        <output className="button-study-result" aria-live="polite">
          {presses === 0
            ? "Try a button"
            : `${String(presses)} ${presses === 1 ? "press" : "presses"}`}
        </output>
      </div>
      <pre className="status-study-code">
        <code>{`<Button variant="primary" size="${size}"${state === "loading" ? " loading" : state === "disabled" ? " disabled" : ""}>Continue</Button>`}</code>
      </pre>
      <section className="status-study-context" aria-label="Hierarchy">
        <div>
          <h2>In a group</h2>
          <p>
            The filled action carries the material. Supporting actions stay
            quiet.
          </p>
        </div>
        <div className="button-study-actions">
          <CapsButton
            onClick={() => {
              setPresses((count) => count + 1);
            }}
          >
            Save changes
          </CapsButton>
          <CapsButton variant="ghost">Cancel</CapsButton>
        </div>
        <div className="button-study-actions">
          <CapsButton variant="outline">Preview</CapsButton>
          <CapsButton variant="link">Learn more</CapsButton>
          <CapsButton variant="destructive">Delete</CapsButton>
        </div>
      </section>
    </main>
  );
};
