import type { Story, StoryDefault } from "@ladle/react";
import { Sigil } from "@fungi.computer/sigils";
import { Activity, Plug, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  AppStatusBar,
  AppStatusItem,
  StatusBarChip,
  StatusBarPicker,
} from "../src/blocks/app-status-bar.js";
import { CountBadge } from "../src/components/count-badge.js";
import "./app-status-bar.css";

export default { title: "Blocks / App status bar" } satisfies StoryDefault;

const computers = [
  { id: "workbench", label: "Workbench" },
  { id: "studio", label: "Studio" },
  { id: "travel-laptop", label: "Travel laptop" },
];

function Window({
  width,
  options = computers,
  initial = "workbench",
}: {
  width: "wide" | "phone";
  options?: typeof computers;
  initial?: string | null;
}) {
  const [value, setValue] = useState(initial);
  const [wrap, setWrap] = useState(true);
  return (
    <div className="caps-status-bar-story" data-width={width}>
      <AppStatusBar
        attachment={
          <StatusBarPicker
            noun="Computer"
            pluralNoun="Computers"
            icon={<Sigil name="computer" size={16} />}
            options={options}
            value={value}
            onSelect={setValue}
            emptyMessage="No Computers are granted to this App"
          />
        }
        end="All changes saved"
      >
        <AppStatusItem>2 documents</AppStatusItem>
        <StatusBarChip
          label="Ports"
          icon={<Plug />}
          readout={<CountBadge count={2} />}
        />
        <StatusBarChip label="Processes" icon={<Activity />} />
        <StatusBarChip label="Access" icon={<ShieldCheck />} expanded={false} />
        <StatusBarChip
          label="Wrap"
          pressed={wrap}
          onClick={() => {
            setWrap((on) => !on);
          }}
        />
      </AppStatusBar>
    </div>
  );
}

export const Wide: Story = () => <Window width="wide" />;
export const Phone: Story = () => <Window width="phone" />;
export const NothingGranted: Story = () => (
  <Window width="wide" options={[]} initial={null} />
);
