import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "@fungi.computer/caps/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@fungi.computer/caps/components/dialog";
import { Toaster, toast } from "@fungi.computer/caps/components/toaster";

export const AppRoot: Story = () => (
  <>
    <main className="relative isolate min-h-screen p-lg">
      <div
        className="absolute inset-y-0 left-1/2 z-2 w-sm bg-primary"
        role="separator"
        aria-label="Conversation list width"
        aria-orientation="vertical"
      />
      <Dialog>
        <DialogTrigger render={<Button />}>Take over</DialogTrigger>
        <DialogContent>
          <DialogTitle>Ada is replying — take over?</DialogTitle>
          <DialogDescription>You will reply to this visitor.</DialogDescription>
          <Button
            onClick={() => toast("Conversation ready", { duration: Infinity })}
          >
            Show notice
          </Button>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
        </DialogContent>
      </Dialog>
    </main>
    <Toaster />
  </>
);

export default { title: "App root overlays" } satisfies StoryDefault;
