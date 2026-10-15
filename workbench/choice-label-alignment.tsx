import type { Story } from "@ladle/react";
import { Checkbox } from "../src/components/checkbox.js";
import { Field, FieldSet } from "../src/components/field.js";
import { RadioGroup, RadioGroupItem } from "../src/components/radio-group.js";
import { Display } from "../src/components/surface.js";
import "./screen-form.css";

function ChoiceRows() {
  return (
    <>
      <FieldSet legend="Access">
        <Field label="Read files" orientation="inline">
          <Checkbox defaultChecked />
        </Field>
        <Field label="Write files" orientation="inline">
          <Checkbox />
        </Field>
        <Field label="Mixed access" orientation="inline">
          <Checkbox indeterminate />
        </Field>
        <Field label="Unavailable access" orientation="inline">
          <Checkbox disabled defaultChecked />
        </Field>
        <Field
          label="Read files on the selected Computer and keep its folders available"
          description="The first line stays beside the control, with this help below the label."
          orientation="inline"
        >
          <Checkbox />
        </Field>
      </FieldSet>
      <FieldSet legend="Open mode">
        <RadioGroup defaultValue="read">
          <Field label="Read plans" orientation="inline">
            <RadioGroupItem value="read" />
          </Field>
          <Field label="Write plans" orientation="inline">
            <RadioGroupItem value="write" />
          </Field>
          <Field label="Unavailable mode" orientation="inline">
            <RadioGroupItem value="managed" disabled />
          </Field>
        </RadioGroup>
      </FieldSet>
    </>
  );
}

function AlignmentStudy({ density }: { density: "normal" | "compact" }) {
  return (
    <main className="screen-form-study">
      <section aria-label="On a screen">
        <Display density={density}>
          <div className="screen-form-study-glass">
            <ChoiceRows />
          </div>
        </Display>
      </section>
      <section aria-label="Off the screen" className="screen-form-study-plain">
        <ChoiceRows />
      </section>
    </main>
  );
}

/** First-line alignment for native choices at the normal Display density. */
export const ChoiceLabelAlignment: Story = () => (
  <AlignmentStudy density="normal" />
);
/** Identical native rows at the compact Display density. */
export const ChoiceLabelAlignmentCompact: Story = () => (
  <AlignmentStudy density="compact" />
);
