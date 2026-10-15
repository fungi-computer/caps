import type { Story } from "@ladle/react";
import { useState } from "react";
import { Field as CapsField } from "../src/components/field.js";
import { Input } from "../src/components/input.js";
import { Button } from "../src/components/button.js";
import "./status.css";
import "./input.css";

export const Field: Story = () => {
  const [invalid, setInvalid] = useState(false);
  return (
    <main className="status-study input-study" data-conformance="field">
      <section className="status-study-stage py-3xl" aria-label="Field preview">
        <span className="status-study-caption">Fields / animated errors</span>
        <div className="input-study-preview flex flex-col gap-lg">
          <CapsField
            label="Project name"
            description="You can change this later."
            error={invalid ? "Already taken" : undefined}
          >
            <Input defaultValue="Weekend ideas" />
          </CapsField>
          <CapsField label="Folder" description="Your work stays together.">
            <Input defaultValue="/media" />
          </CapsField>
        </div>
        <span className="status-study-hint">
          Errors open and close smoothly, without reserving an empty line.
        </span>
      </section>
      <div className="status-study-controls">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={invalid}
          onClick={() => {
            setInvalid(!invalid);
          }}
        >
          Toggle error
        </Button>
      </div>
    </main>
  );
};
