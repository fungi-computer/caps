import type { Story } from "@ladle/react";

import { Button } from "@fungi.computer/caps/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fungi.computer/caps/components/dialog";

/**
 * A modal Dialog that opens a second modal Dialog from inside it, with the
 * default composition. The inner Dialog must stay in the accessibility tree.
 */
export const NestedDialog: Story = () => (
  <Dialog>
    <DialogTrigger render={<Button variant="outline" size="sm" />}>
      Print settings
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Print settings</DialogTitle>
        <DialogDescription>Size, paper and finish.</DialogDescription>
      </DialogHeader>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          Delete print
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this print?</DialogTitle>
            <DialogDescription>
              The print leaves your gallery.
            </DialogDescription>
          </DialogHeader>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
        </DialogContent>
      </Dialog>
    </DialogContent>
  </Dialog>
);
