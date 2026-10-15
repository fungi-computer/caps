import type { Story } from "@ladle/react";
import { useState } from "react";

import {
  CodeInput as CapsCodeInput,
  type CodeInputStatus,
} from "../src/components/code-input.js";
import { Field } from "../src/components/field.js";

const rightCode = "424242";

/**
 * A six-digit sign-in code. Each digit lands in its slot; a wrong code
 * shakes the row in a cascade, the right one (424242) lifts it in a wave.
 */
export const CodeInput: Story = () => {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<CodeInputStatus>("idle");
  return (
    <div className="grid gap-md p-lg">
      <Field
        label="Sign-in code"
        description="We sent a six-digit code to sprite@example.com."
        error={
          status === "invalid"
            ? "That code didn't match. Try again."
            : undefined
        }
      >
        <CapsCodeInput
          aria-label="Sign-in code"
          data-code-demo=""
          value={value}
          status={status}
          onValueChange={(next) => {
            setValue(next);
            if (next.length < 6) setStatus("idle");
            else setStatus(next === rightCode ? "accepted" : "invalid");
          }}
        />
      </Field>
    </div>
  );
};
