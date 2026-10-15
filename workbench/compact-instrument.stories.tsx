import type { StoryDefault } from "@ladle/react";
import { useState } from "react";
import { Sigil } from "@fungi.computer/sigils";
import { IconCheckbox } from "../src/components/icon-checkbox.js";
import { Display, ScreenCell, ScreenCells } from "../src/components/surface.js";

export default { title: "Forms" } satisfies StoryDefault;

/** Compact instruments keep their subject and native icon choices on one row. */
export function CompactInstrument() {
  const [rights, setRights] = useState({
    list: true,
    read: true,
    write: false,
    run: false,
  });
  return (
    <Display size="sm">
      <ScreenCells appearance="compact">
        <ScreenCell
          appearance="compact"
          icon={<Sigil name="computer" />}
          legend="Studio"
        >
          {(["list", "read", "write", "run"] as const).map((right) => (
            <IconCheckbox
              key={right}
              appearance="compact"
              label={`${right} on Studio`}
              icon={<Sigil name={right} />}
              caption={right.toUpperCase()}
              checked={rights[right]}
              onChange={(event) => {
                setRights({ ...rights, [right]: event.target.checked });
              }}
            />
          ))}
        </ScreenCell>
        <ScreenCell
          appearance="compact"
          icon={<Sigil name="computer" />}
          legend="Managed Computer"
        >
          <IconCheckbox
            appearance="compact"
            label="Managed read access"
            icon={<Sigil name="read" />}
            caption="READ"
            checked
            disabled
          />
        </ScreenCell>
      </ScreenCells>
    </Display>
  );
}
