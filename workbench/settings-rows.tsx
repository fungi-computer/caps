import type { Story } from "@ladle/react";
import { useState } from "react";
import { Sigil } from "@fungi.computer/sigils";

import { DataList, DataRow } from "../src/components/data-list.js";
import { Field } from "../src/components/field.js";
import { Select } from "../src/components/select.js";
import { Switch } from "../src/components/switch.js";

/** Settings as hairline rows: a Sigil, the label with one muted line, and a
 * bounded control at the right. */
export const SettingsRows: Story = () => {
  const [internet, setInternet] = useState(true);
  return (
    <main className="mx-auto flex w-full max-w-(--container-2xl) flex-col gap-sm px-lg py-2xl">
      <h2 className="m-0 text-lg font-bold">Settings rows</h2>
      <p className="m-0 text-sm text-(--stipe-fg-muted)">
        One row per setting, the control at the right.
      </p>
      <DataList density="compact" aria-label="Example settings">
        <DataRow>
          <Field
            orientation="horizontal"
            icon={<Sigil name="computer" />}
            label="Studio"
            description="Reaches the public internet."
          >
            <Switch checked={internet} onCheckedChange={setInternet} />
          </Field>
        </DataRow>
        <DataRow>
          <Field
            orientation="horizontal"
            icon={<Sigil name="prints" />}
            label="Media"
          >
            <Select defaultValue="prints">
              <option value="prints">Prints</option>
              <option value="inkcap">Inkcap</option>
            </Select>
          </Field>
        </DataRow>
        <DataRow>
          <Field
            orientation="horizontal"
            icon={<Sigil name="read" />}
            label="Team Git"
            error="Couldn’t save. Try again."
          >
            <Select defaultValue="read">
              <option value="none">No access</option>
              <option value="read">Read</option>
              <option value="write">Read + write</option>
            </Select>
          </Field>
        </DataRow>
      </DataList>
    </main>
  );
};
