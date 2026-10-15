import type { Story } from "@ladle/react";
import { useState } from "react";
import {
  PermissionGrid as Grid,
  type PermissionGridRow,
} from "../src/blocks/permission-grid.js";
import { Switch } from "../src/components/switch.js";

const tools = [
  {
    id: "browser",
    group: "Session",
    label: "Commands in the visitor's browser",
  },
  { id: "goal", group: "Session", label: "Session goal tools" },
  { id: "agents", group: "Agents", label: "List and prompt the Team's Agents" },
  { id: "github", group: "Connections", label: "GitHub repository" },
  { id: "computer", group: "Computers", label: "Computers and Home files" },
] as const;

/** A simple square mark standing in for a product sigil. */
function Mark({ filled }: Readonly<{ filled: boolean }>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
      />
    </svg>
  );
}

export const PermissionGrid: Story = () => {
  const [allowed, setAllowed] = useState<ReadonlySet<string>>(
    new Set(["browser"]),
  );
  const rows: PermissionGridRow[] = tools.map((tool) => {
    const on = allowed.has(tool.id);
    return {
      id: tool.id,
      group: tool.group,
      label: tool.label,
      mark: <Mark filled={on} />,
      state: on ? "allowed" : "denied",
      stateLabel: on ? "On" : "Off",
      scope: tool.id === "browser" ? "Default" : "Owner grant",
      control: (
        <Switch
          aria-label={`Allow ${tool.label}`}
          checked={on}
          onCheckedChange={(checked) => {
            setAllowed((current) => {
              const next = new Set(current);
              if (checked) next.add(tool.id);
              else next.delete(tool.id);
              return next;
            });
          }}
        />
      ),
    };
  });
  return (
    <Grid
      caption="Website channel · jamstack.consulting"
      summary="Anyone who can open the site can trigger what is On."
      rows={rows}
    />
  );
};
