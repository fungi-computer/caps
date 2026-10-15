import { useState } from "react";
import { ActionRow } from "../src/components/action-row.js";
import { CopyField } from "../src/components/copy-field.js";
import { DiffView } from "../src/components/diff-view.js";
import { Disclosure } from "../src/components/disclosure.js";
import { InlineCode } from "../src/components/inline-code.js";
import { Monogram } from "../src/components/monogram.js";
import { NavigationRail } from "../src/components/navigation-rail.js";
import {
  Popover,
  PopoverAnchor,
  PopoverOption,
} from "../src/components/popover.js";
import { ResizeHandle } from "../src/components/resize-handle.js";
import { Wizard } from "../src/components/wizard.js";

/** Real fixtures for primitives not yet listed in the older coverage catalogue. */
export function GalleryExtras() {
  const [open, setOpen] = useState(true);
  const [size, setSize] = useState(300);
  const [step, setStep] = useState("channel");
  return (
    <div className="grid gap-xl p-lg">
      <ActionRow
        label="Open channel"
        description="Action row"
        trailing={<Monogram name="Radio" />}
      />
      <CopyField value="CH-122" fieldLabel="Channel code" />
      <CopyField
        layout="block"
        title="HTML"
        label="Copy snippet"
        tokens={[
          { kind: "tag", text: "<script" },
          { kind: "text", text: "\n  " },
          { kind: "attribute", text: "src" },
          { kind: "tag", text: "=" },
          { kind: "string", text: '"https://radio.example/v1.js"' },
          { kind: "text", text: "\n  " },
          { kind: "attribute", text: "async" },
          { kind: "text", text: "\n" },
          { kind: "tag", text: "></script>" },
        ]}
      />
      <DiffView
        lines={[
          { kind: "remove", text: "Off air" },
          { kind: "add", text: "Live" },
        ]}
      />
      <Disclosure open={open} onOpenChange={setOpen} summary="Details">
        <InlineCode>channel.live</InlineCode>
      </Disclosure>
      <NavigationRail>
        <a href="#channel">Channel</a>
        <a href="#schedule">Schedule</a>
      </NavigationRail>
      <div className="min-h-32">
        <PopoverAnchor>
          Station list
          <Popover open side="bottom">
            <PopoverOption active>Community radio</PopoverOption>
            <PopoverOption active={false}>Weather</PopoverOption>
          </Popover>
        </PopoverAnchor>
      </div>
      <ResizeHandle
        aria-label="Preview height"
        orientation="horizontal"
        min={100}
        max={500}
        value={size}
        onValueChange={setSize}
      />
      <Wizard
        current={step}
        onStepChange={setStep}
        steps={[
          { id: "channel", title: "Channel", content: "Pick a station." },
          { id: "listen", title: "Listen", content: "Ready to listen." },
        ]}
      />
    </div>
  );
}
