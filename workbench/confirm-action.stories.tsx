import type { StoryDefault } from "@ladle/react";
import { useState } from "react";

import { ConfirmAction } from "../src/components/confirm-action.js";
import { Field } from "../src/components/field.js";
import { Select } from "../src/components/select.js";

export default { title: "Forms" } satisfies StoryDefault;

/** Exercise idle, pending, refusal and retry through the public callback. */
export function ConfirmActions() {
  const [fail, setFail] = useState(false);
  const [completed, setCompleted] = useState(0);
  async function confirm() {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    if (fail) throw new Error("Workbench refusal");
    setCompleted((count) => count + 1);
  }
  return (
    <main className="mx-auto grid w-full max-w-(--container-lg) gap-xl px-lg py-2xl">
      <Field
        label="Action outcome"
        description="Each confirmation stays busy for 2.5 seconds. Choose Refuse to try a failure and retry."
      >
        <Select
          value={fail ? "refuse" : "complete"}
          onChange={(event) => {
            setFail(event.currentTarget.value === "refuse");
          }}
        >
          <option value="complete">Complete</option>
          <option value="refuse">Refuse</option>
        </Select>
      </Field>
      <section className="grid gap-md" aria-label="Hold confirmation">
        <h2>Disconnect a repository</h2>
        <p>You can reconnect it later. Press and hold to disconnect.</p>
        <ConfirmAction
          mode="hold"
          label="Disconnect"
          confirmLabel="Press and hold to disconnect."
          onConfirm={confirm}
        />
      </section>
      <section className="grid gap-md" aria-label="Phrase confirmation">
        <h2>Close a Team</h2>
        <p>A closed Team cannot reopen.</p>
        <ConfirmAction
          mode="type"
          label="Close Team"
          confirmLabel="Close permanently"
          phrase="garden"
          onConfirm={confirm}
        />
      </section>
      <p role="status">Completed actions: {completed}</p>
    </main>
  );
}
