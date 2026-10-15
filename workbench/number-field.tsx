import type { Story } from "@ladle/react";
import { useState } from "react";

import {
  Field,
  NumberField as CapsNumberField,
} from "../src/components/field.js";
import { Input } from "../src/components/input.js";

/** NumberField: every state, on the same control height as Input. */
export const NumberField: Story = () => {
  const [sleep, setSleep] = useState<number | null>(30);
  const [seats, setSeats] = useState<number | null>(3);
  return (
    <main className="mx-auto flex w-full max-w-(--container-3xl) flex-col gap-xl px-lg py-2xl">
      <div className="grid gap-xl sm:grid-cols-2">
        <Field
          label="Sleep after"
          description="Arrows step by 5; Page Up/Down by 50; Home and End jump."
        >
          <CapsNumberField
            min={5}
            max={120}
            step={5}
            unit="min"
            value={sleep}
            onValueChange={setSleep}
          />
        </Field>
        <Field label="Seats" required>
          <CapsNumberField
            min={1}
            max={50}
            value={seats}
            onValueChange={setSeats}
          />
        </Field>
        <Field label="At the minimum" description="The − key rests.">
          <CapsNumberField min={0} max={10} defaultValue={0} />
        </Field>
        <Field label="Hour" description="Wraps from 23 back to 0.">
          <CapsNumberField min={0} max={23} wrap defaultValue={23} unit="h" />
        </Field>
        <Field label="Spend cap" optional description="Decimal steps.">
          <CapsNumberField min={0} step={0.5} unit="USD" defaultValue={12.5} />
        </Field>
        <Field label="Empty">
          <CapsNumberField min={1} max={9} />
        </Field>
        <Field label="Invalid" error="Use at most 64 GB.">
          <CapsNumberField min={1} max={256} unit="GB" defaultValue={128} />
        </Field>
        <Field label="Disabled" description="Managed by your Team owner.">
          <CapsNumberField disabled defaultValue={8} unit="GB" />
        </Field>
      </div>
      <div className="grid items-end gap-sm sm:grid-cols-[1fr_auto]">
        <Field label="Same height as Input">
          <Input defaultValue="Helsinki" />
        </Field>
        <CapsNumberField aria-label="Copies" min={1} defaultValue={2} />
      </div>
    </main>
  );
};
