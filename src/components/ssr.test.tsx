// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Alert } from "./alert.js";
import { Button } from "./button.js";
import { Combobox } from "./combobox.js";
import { Dialog, DialogContent, DialogTitle } from "./dialog.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";
import { Field } from "./field.js";
import { Input } from "./input.js";
import { Label } from "./label.js";
import { Listbox } from "./listbox.js";
import { Select } from "./select.js";
import { Switch } from "./switch.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs.js";
import { Textarea } from "./textarea.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.js";

describe("Caps primitives SSR", () => {
  it("imports and renders without browser globals at module evaluation", () => {
    const html = renderToString(
      <>
        <Button>Save</Button>
        <Button loading>Continue</Button>
        <Field label="Name">
          <Input />
        </Field>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" />
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
        <Combobox
          trigger={<button type="button">Open</button>}
          getKey={(item) => item.id}
          getLabel={(item) => item.label}
          items={[{ id: "one", label: "One" }]}
        />
        <Select>
          <option value="one">One</option>
        </Select>
        <Switch aria-label="Enabled" />
        <Alert title="Notice" />
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">One panel</TabsContent>
        </Tabs>
        <Listbox
          getKey={(item) => item.id}
          getLabel={(item) => item.label}
          items={[{ id: "one", label: "One" }]}
        />
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Open</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button type="button">Help</button>
          </TooltipTrigger>
          <TooltipContent>More help</TooltipContent>
        </Tooltip>
      </>,
    );
    expect(html).toContain("Save");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-variant="line"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("loading-spinner");
    expect(html).toContain("aria-labelledby");
    expect(html).toContain("listbox");
  });
});
