import type { Story } from "@ladle/react";
import { useState } from "react";
import { Switch as CapsSwitch } from "../src/components/switch.js";
import "./status.css";
import "./switch.css";

export const Switch: Story = () => {
  const [checked, setChecked] = useState(false);
  return (
    <main className="status-study switch-study" data-conformance="switch">
      <section className="status-study-stage" aria-label="Switch preview">
        <span className="status-study-caption">
          4× / {checked ? "on" : "off"}
        </span>
        <div className="switch-study-magnified" data-switch-preview>
          <CapsSwitch
            aria-label="Preview switch"
            checked={checked}
            onCheckedChange={setChecked}
          />
        </div>
        <span className="status-study-hint">
          Press, compress, fill. Try reversing it midway.
        </span>
      </section>
      <div className="status-study-controls">
        <fieldset>
          <legend>State</legend>
          <div className="status-study-options">
            <button
              type="button"
              aria-pressed={!checked}
              onClick={() => {
                setChecked(false);
              }}
            >
              Off
            </button>
            <button
              type="button"
              aria-pressed={checked}
              onClick={() => {
                setChecked(true);
              }}
            >
              On
            </button>
          </div>
        </fieldset>
      </div>
      <pre className="status-study-code">
        <code>
          {"<Switch checked={enabled} onCheckedChange={setEnabled} />"}
        </code>
      </pre>
      <section className="status-study-context" aria-label="Actual size">
        <div>
          <h2>Actual size</h2>
          <p>The same material, in a setting.</p>
        </div>
        <label className="status-study-row">
          <span>Desktop notifications</span>
          <CapsSwitch checked={checked} onCheckedChange={setChecked} />
        </label>
        <label className="status-study-row">
          <span>Managed by your team</span>
          <CapsSwitch defaultChecked disabled />
        </label>
      </section>
    </main>
  );
};
