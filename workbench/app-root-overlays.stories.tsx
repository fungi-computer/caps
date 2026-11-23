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
import { useAppHeaderRef } from "@fungi.computer/caps/components/app-header";
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

/** `gap` moves the header down the page; `tall` makes the page scroll. */
function HeaderStudy({
  wrapped = false,
  gap = 0,
  tall = false,
}: {
  wrapped?: boolean;
  gap?: 0 | 4 | 20;
  tall?: boolean;
}) {
  const headerRef = useAppHeaderRef();
  return (
    <>
      {gap === 4 ? <div className="h-[4px]" /> : null}
      {gap === 20 ? <div className="h-[20px]" /> : null}
      <header
        className={
          wrapped
            ? "flex flex-wrap items-center gap-sm px-md py-xs"
            : "flex h-[var(--caps-app-header-height)] items-center justify-between px-md"
        }
        data-app-header=""
        ref={headerRef}
      >
        <span>Workflow</span>
        <span className="flex flex-wrap gap-sm">
          <Button size="sm" variant="ghost">
            Saved
          </Button>
          <Button size="sm">Run</Button>
          {wrapped
            ? ["Canvas", "Runs", "Triggers", "History", "Share"].map((name) => (
                <Button key={name} size="sm" variant="ghost">
                  {name}
                </Button>
              ))
            : null}
        </span>
      </header>
      <main className={tall ? "min-h-[3000px] p-md" : "p-md"}>
        <Button onClick={() => toast("Run started", { duration: Infinity })}>
          Show notice
        </Button>
      </main>
      <Toaster />
    </>
  );
}

/** A toast opens below the App's header row, never over its controls. */
export const HeaderClearance: Story = () => <HeaderStudy />;

/** A header that wraps to several rows still keeps every toast below it. */
export const HeaderClearanceWrapped: Story = () => <HeaderStudy wrapped />;

/** A header 4px down, under the App's own padding, still counts. */
export const HeaderNearTop: Story = () => <HeaderStudy gap={4} />;

/** A header 20px down is another row, not the App's top header. */
export const HeaderNotAtTop: Story = () => <HeaderStudy gap={20} />;

/** A header that scrolls off the top no longer holds toasts down. */
export const HeaderScrolledAway: Story = () => <HeaderStudy tall />;

export default { title: "App root overlays" } satisfies StoryDefault;
