import type { Story, StoryDefault } from "@ladle/react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@fungi.computer/caps/components/button";
import {
  Combobox,
  ComboboxTrigger,
} from "@fungi.computer/caps/components/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fungi.computer/caps/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@fungi.computer/caps/components/dropdown-menu";
import { Field } from "@fungi.computer/caps/components/field";
import { Input } from "@fungi.computer/caps/components/input";
import { OverlayRoot } from "@fungi.computer/caps/components/overlay-root";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fungi.computer/caps/components/tooltip";

export { Dialog, DropdownMenu, Tooltip } from "./examples.js";
export { TooltipToolbar } from "./tooltip-toolbar.js";

/** The Caps dialog frame filling an App's viewport, without caller geometry. */
export const FillDialog: Story = () => (
  <Dialog>
    <DialogTrigger>Open full-window dialog</DialogTrigger>
    <DialogContent size="fill" className="flex flex-col gap-lg">
      <DialogHeader>
        <DialogTitle>Full-window dialog</DialogTitle>
        <DialogDescription>
          Caps keeps the padding, rounded corners and material while the frame
          fills the window.
        </DialogDescription>
      </DialogHeader>
      <div className="flex-1" />
      <DialogFooter>
        <DialogClose>Close</DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/** A default dialog on a phone keeps a 16px gutter (safe-area aware) on each side. */
export const PhoneGutterDialog: Story = () => (
  <Dialog defaultOpen>
    <DialogTrigger>Open dialog</DialogTrigger>
    <DialogContent className="flex flex-col gap-lg">
      <DialogHeader>
        <DialogTitle>Rename this Agent</DialogTitle>
        <DialogDescription>
          On a phone the dialog sits 16px from each screen edge, more where the
          device has a safe-area inset.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const WindowComposition: Story = () => {
  const [windowElement, setWindowElement] = useState<HTMLDivElement | null>(
    null,
  );
  const fieldRef = useRef<HTMLInputElement>(null);
  const returnRef = useRef<HTMLButtonElement>(null);

  return (
    <section className="grid gap-lg p-lg">
      <p className="text-sm">
        The dialog and its menu stay inside this window.
      </p>
      <div
        className="relative min-h-96 max-w-(--container-2xl) overflow-hidden rounded-box border border-base-300 bg-base-100 p-lg"
        ref={setWindowElement}
      >
        <Button ref={returnRef} variant="ghost" size="sm">
          Workspace
        </Button>
        <Dialog modal={false}>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            Window details
          </DialogTrigger>
          <DialogContent
            className="absolute inset-x-lg top-2xl translate-x-0 translate-y-0 mt-lg w-auto max-w-none space-y-lg"
            container={windowElement}
            initialFocus={fieldRef}
            finalFocus={returnRef}
          >
            <DialogHeader>
              <DialogTitle>Window details</DialogTitle>
              <DialogDescription>
                A composed field and menu using the current theme.
              </DialogDescription>
            </DialogHeader>
            <Field
              label="Name"
              description="Your draft stays when you close and reopen."
            >
              <Input ref={fieldRef} defaultValue="My workspace" />
            </Field>
            <DialogFooter>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Help
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actions for this window</TooltipContent>
              </Tooltip>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="sm" />}
                >
                  More
                </DropdownMenuTrigger>
                <DropdownMenuContent container={windowElement} align="start">
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem disabled>Share</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Close
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

/** A confirmation as products ship it: an outline Cancel beside the primary key. */
export const ConfirmDialog: Story = () => (
  <Dialog defaultOpen modal={false}>
    <DialogTrigger render={<Button variant="outline" size="sm" />}>
      Delete print
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete this print?</DialogTitle>
        <DialogDescription>
          The print leaves your gallery. Its source images stay in Media.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button>Continue</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const longNames = [
  "README.md",
  "notes/garden/a-very-long-file-name-from-the-garden-notes-folder-that-would-wrap.md",
  "src/courtyard/planting-plan-for-the-courtyard-with-every-bed-and-path.ts",
];

/** Open files with long names: each row stays one line inside the screen. */
export const LongNames: Story = () => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
      Open files
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuRadioGroup defaultValue={longNames[0]}>
        {longNames.map((path) => (
          <DropdownMenuRadioItem key={path} value={path} title={path}>
            {path.split("/").at(-1)}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

const computers = [
  { id: "workbench", name: "Workbench" },
  { id: "studio", name: "Studio" },
];

/**
 * A shell's ordered overlay roots, as the Hub mounts them: each is its own
 * stacking context, popover under dialog under toast under tooltip. A menu or
 * picker opened inside a dialog still paints over that dialog.
 */
export const ShellLayers: Story = () => {
  const [popover, setPopover] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<HTMLElement | null>(null);
  const [toast, setToast] = useState<HTMLElement | null>(null);
  const [tooltip, setTooltip] = useState<HTMLElement | null>(null);
  const containers = useMemo(
    () => ({ popover, dialog, toast, tooltip }),
    [popover, dialog, toast, tooltip],
  );
  const [computer, setComputer] = useState<string | null>("workbench");
  return (
    <OverlayRoot containers={containers}>
      <section className="grid gap-lg p-lg">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>
            Move Agent
          </DialogTrigger>
          <DialogContent className="space-y-lg">
            <DialogHeader>
              <DialogTitle>Move Agent</DialogTitle>
              <DialogDescription>
                Choose where this Agent runs.
              </DialogDescription>
            </DialogHeader>
            <Field label="Computer">
              <Combobox
                items={computers}
                getKey={(item) => item.id}
                getLabel={(item) => item.name}
                inputProps={{ "aria-label": "Search Computers" }}
                value={computer}
                onValueChange={setComputer}
                trigger={
                  <ComboboxTrigger>
                    {computers.find((item) => item.id === computer)?.name ??
                      "Choose a Computer…"}
                  </ComboboxTrigger>
                }
              />
            </Field>
            <DialogFooter>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="sm" />}
                >
                  More
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Close
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
      <div
        data-layer="popover"
        className="relative isolate z-(--stipe-layer-popover)"
        ref={setPopover}
      />
      <div
        data-layer="dialog"
        className="relative isolate z-(--stipe-layer-dialog)"
        ref={setDialog}
      />
      <div
        data-layer="toast"
        className="relative isolate z-(--stipe-layer-toast)"
        ref={setToast}
      />
      <div
        data-layer="tooltip"
        className="relative isolate z-(--stipe-layer-tooltip)"
        ref={setTooltip}
      />
    </OverlayRoot>
  );
};

export default {
  title: "Overlays",
} satisfies StoryDefault;
