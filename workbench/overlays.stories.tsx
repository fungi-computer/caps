import type { Story, StoryDefault } from "@ladle/react";
import { useRef, useState } from "react";

import { Button } from "@fungi.computer/caps/components/button";
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
  DropdownMenuTrigger,
} from "@fungi.computer/caps/components/dropdown-menu";
import { Field } from "@fungi.computer/caps/components/field";
import { Input } from "@fungi.computer/caps/components/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fungi.computer/caps/components/tooltip";

export { Dialog, DropdownMenu, Tooltip } from "./examples.js";
export { TooltipToolbar } from "./tooltip-toolbar.js";

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

export default {
  title: "Overlays",
} satisfies StoryDefault;
