import type { StoryDefault } from "@ladle/react";
import { createSprite } from "@fungi.computer/sprite";
import { Sprite } from "@fungi.computer/sprite/react";
import {
  Gamepad2,
  GitBranch,
  Image,
  MessagesSquare,
  PenTool,
  Terminal,
} from "lucide-react";
import { EmptyState } from "../src/blocks/empty-state.js";
import { SetupNotice } from "../src/blocks/setup-notice.js";
import { FailureLine } from "../src/components/failure-line.js";
import { Markdown } from "../src/components/markdown.js";
import { LoadingState } from "../src/blocks/loading-state.js";
import { ResultState } from "../src/blocks/result-state.js";
import { AppGrid, SectionGrid } from "../src/blocks/launcher-grid.js";
import { SectionCard } from "../src/blocks/section-card.js";
import { ActionRow } from "../src/components/action-row.js";
import { Badge } from "../src/components/badge.js";
import { Button } from "../src/components/button.js";
import { DataListHeading } from "../src/components/data-list.js";
import { Keycap, KeycapButton } from "../src/components/keycap.js";
import { Monogram } from "../src/components/monogram.js";
import { Status } from "../src/components/status.js";

/*
 * A fresh Team's first screen, composed only from Caps variants: the mascot
 * greets from a speech bubble, Recent invites from a solid panel, and the
 * Apps are big molded toy keys.
 */

const spriteService = createSprite({
  characters: {
    mushroom: async () =>
      (await import("@fungi.computer/sprite-zdog/mushroom")).default,
  },
});

const mascot = (
  <Sprite
    activity="idle"
    aria-hidden="true"
    expression="normal"
    service={spriteService}
    src={{ local: "mushroom" }}
  />
);

const apps = [
  { id: "notes", label: "Notes", icon: <PenTool className="text-secondary" /> },
  { id: "prints", label: "Prints", icon: <Image className="text-accent" /> },
  { id: "chat", label: "Chat", icon: <MessagesSquare className="text-info" /> },
  { id: "shell", label: "Shell", icon: <Terminal className="text-error" /> },
  { id: "games", label: "Games", icon: <Gamepad2 className="text-primary" /> },
].map((app) => ({ ...app, onSelect: () => undefined }));

export const DesktopHome = () => (
  <SectionGrid layout="desktop">
    <EmptyState
      data-span="full"
      variant="speech"
      visual={mascot}
      title="Hi, I’m your mascot."
      description="Hosts say hello here, then offer the one action that starts everything."
      actions={<Button size="lg">Ask something</Button>}
    />
    <SectionCard
      span="full"
      heading="Games"
      description="A featured section that spans both columns."
      actions={<Button variant="secondary">Play</Button>}
    />
    <SectionCard heading="Recent">
      <EmptyState
        variant="panel"
        visual={<MessagesSquare />}
        title="No conversations yet"
        description="Recent work lands here, newest first."
        actions={
          <Button size="sm" variant="outline">
            Open inbox
          </Button>
        }
      />
    </SectionCard>
    <SectionCard heading="Apps">
      <AppGrid aria-label="Apps" items={apps} size="lg" />
    </SectionCard>
  </SectionGrid>
);

export const EmptyStateVariants = () => (
  <SectionGrid>
    <EmptyState
      variant="panel"
      visual={<MessagesSquare />}
      title="Panel"
      description="A solid, centered card with an optional action."
      actions={<Button size="sm">Start</Button>}
    />
    <EmptyState
      variant="speech"
      visual={mascot}
      title="Speech"
      description="The visual says the copy from a molded bubble. Below 36rem the mascot sits on top."
    />
    <SectionCard heading="Saved keys">
      <EmptyState
        headingLevel={4}
        variant="quiet"
        title="No model keys"
        description="Quiet sits under a card heading without outranking it."
      />
    </SectionCard>
  </SectionGrid>
);

export const EmptyStateSpeechFirstRun = () => (
  <EmptyState
    variant="speech"
    visual={mascot}
    title="Ask your first question"
    description="Start a conversation and I will do the work."
    primaryAction={{ label: "New conversation", onSelect: () => undefined }}
    suggestions={[
      { label: "Summarize my notes", onSelect: () => undefined },
      { label: "Plan a weekend trip", onSelect: () => undefined },
    ]}
  />
);

export const EmptyStatePanelFirstRun = () => (
  <EmptyState
    variant="panel"
    visual={<MessagesSquare />}
    title="Make your first print"
    description="Describe a picture and watch it appear."
    primaryAction={{ label: "New print", onSelect: () => undefined }}
    suggestions={[
      { label: "A koi pond at dusk", onSelect: () => undefined },
      {
        label: "A tiny mushroom house",
        onSelect: () => undefined,
        pending: true,
      },
      { label: "Needs a model", onSelect: () => undefined, disabled: true },
    ]}
  />
);

export const EmptyStateBlobs = () => (
  <EmptyState
    variant="panel"
    visual="blobs"
    title="Meet your first Agent"
    description="An Agent is a helper that works for you."
    primaryAction={{
      label: "Name your Agent",
      onSelect: () => undefined,
    }}
  />
);

export const EmptyStatePrimaryPendingAndDisabled = () => (
  <SectionGrid>
    <EmptyState
      variant="panel"
      title="Creating…"
      description="Setting up your first repository."
      primaryAction={{
        label: "New repository",
        onSelect: () => undefined,
        pending: true,
      }}
    />
    <EmptyState
      variant="panel"
      title="Connect a model first"
      description="Writing needs a model to talk to."
      primaryAction={{
        label: "New draft",
        onSelect: () => undefined,
        disabled: true,
        disabledReason: "Add a model key in Settings to start.",
      }}
    />
  </SectionGrid>
);

export const ResultStateFailedWithSteps = () => (
  <ResultState
    tone="failed"
    visual={<Terminal />}
    title="Shed could not open a terminal"
    description="There is no Computer, a Linux workspace, to run commands on."
    steps={[
      "Open Settings and choose Computers.",
      "Connect or start a Computer.",
      "Come back and press Try again.",
    ]}
    actions={
      <>
        <Button size="default">Open Settings</Button>
        <Button variant="ghost">Try again</Button>
      </>
    }
  />
);

export const ResultStateDone = () => (
  <ResultState
    tone="done"
    title="Published v1"
    description="Your workflow is live."
    actions={<Button size="default">Run it</Button>}
  />
);

export const LoadingStateFormations = () => (
  <SectionGrid>
    <LoadingState message="Opening Prints…" variant="line" />
    <LoadingState message="Connecting…" variant="wander" />
    <LoadingState
      message="Getting Shed ready…"
      detail="Installing the first time."
      variant="square"
    />
    <LoadingState message="Making your image…" variant="bloom" />
  </SectionGrid>
);

export const LoadingStateWithIcon = () => (
  <LoadingState
    icon={<Image className="text-accent" />}
    message="Opening Prints…"
    variant="line"
  />
);

export const LoadingStateUnframed = () => (
  <LoadingState
    framed={false}
    icon={<Image className="text-accent" />}
    message="Opening Prints…"
    variant="line"
  />
);

export const LoadingStateSizes = () => (
  <SectionGrid>
    <LoadingState message="Small" size="sm" />
    <LoadingState message="Medium" size="md" />
    <LoadingState message="Large" size="lg" />
  </SectionGrid>
);

export const LoadingStateSlow = () => (
  <LoadingState
    message="Connecting…"
    detail="Reaching your Computer."
    slowAfterMs={600}
    onRetry={() => undefined}
    variant="wander"
  />
);

export const ButtonsLoading = () => (
  <SectionCard heading="Buttons while loading">
    <div className="flex flex-wrap items-center gap-md">
      <Button loading size="xs">
        Xs
      </Button>
      <Button loading size="sm">
        Small
      </Button>
      <Button loading>Default</Button>
      <Button loading aria-label="Saving" size="icon" />
      <Button loading size="sm" variant="outline">
        Outline
      </Button>
      <Button loading variant="ghost" size="sm">
        Ghost
      </Button>
    </div>
  </SectionCard>
);

const fix = { label: "Sign in with Fungi", onSelect: () => undefined };
const secondary = { label: "Add a model key", onSelect: () => undefined };

export const SetupNoticeVariants = () => (
  <SectionGrid>
    <SetupNotice
      variant="panel"
      need="Connect a model to start chatting"
      cause="No model is connected to this Oyster yet."
      available="Uploads work now."
      fix={fix}
      secondary={secondary}
    />
    <SetupNotice
      variant="banner"
      need="Connect a model to start chatting"
      cause="No model is connected to this Oyster yet."
      fix={fix}
      secondary={secondary}
    />
    <SetupNotice
      variant="inline"
      need="Connect a model"
      cause="Needed before you can send."
      fix={fix}
    />
  </SectionGrid>
);

export const SetupNoticeOwnVisual = () => (
  <SetupNotice
    variant="panel"
    visual={<GitBranch />}
    need="Approve Git access"
    cause="Bonsai needs Git access to show your repositories."
    fix={{ label: "Approve Git access", onSelect: () => undefined }}
  />
);

export const SetupNoticePending = () => (
  <SectionGrid>
    <SetupNotice
      variant="panel"
      need="Connect a model to start chatting"
      cause="Finish in Settings; this clears itself."
      fix={{ ...fix, pending: true }}
      waitingFor="a model"
    />
    <SetupNotice
      variant="banner"
      need="Connect a model to start chatting"
      cause="Finish in Settings; this clears itself."
      fix={{ ...fix, pending: true }}
      waitingFor="a model"
    />
    <SetupNotice
      variant="inline"
      need="Connect a model"
      cause="Finish in Settings."
      fix={{ ...fix, pending: true }}
      waitingFor="a model"
    />
  </SectionGrid>
);

export const FailureLines = () => (
  <SectionGrid>
    <SectionCard heading="Row">
      <FailureLine
        message="The model is not connected."
        onRetry={() => undefined}
        onDismiss={() => undefined}
      />
      <FailureLine
        count={3}
        message="The image could not be made."
        onRetry={() => undefined}
        onDismiss={() => undefined}
      />
    </SectionCard>
    <SectionCard heading="Tile">
      <div className="size-48">
        <FailureLine
          density="tile"
          message="The image could not be made."
          onRetry={() => undefined}
          onDismiss={() => undefined}
        />
      </div>
    </SectionCard>
  </SectionGrid>
);

const readme = `# Koi pond

A tiny repository for the koi pond game.

## Getting started

Clone the repository and run the game.

### Notes

- Heading text should align with this body text.
- So should list items.
`;

export const ProseHeadings = () => (
  <SectionCard heading="README tile">
    <Markdown>{readme}</Markdown>
  </SectionCard>
);

export const KeycapHint = () => (
  <SectionCard heading="Shortcut hints">
    <div className="grid gap-md">
      <p>
        Press <Keycap size="hint">⌘</Keycap>
        <Keycap size="hint">K</Keycap> to search, or{" "}
        <Keycap size="hint">Esc</Keycap> to close.
      </p>
      <div className="flex flex-wrap items-center gap-md">
        <Button size="sm">Save</Button>
        <span>
          Save <Keycap size="hint">⌘S</Keycap>
        </span>
      </div>
    </div>
  </SectionCard>
);

export const KeycapTouchHide = () => (
  <SectionCard heading="Keycap legends (hidden on touch)">
    <div className="flex flex-wrap items-center gap-md">
      <Keycap touch="hide">B</Keycap>
      <KeycapButton label="Build" shortcut="B" onClick={() => undefined} />
    </div>
  </SectionCard>
);

export const ToyAppGrid = () => (
  <SectionCard heading="Apps">
    <AppGrid
      aria-label="Toy apps"
      items={[
        ...apps,
        {
          id: "off",
          label: "Offline",
          icon: <Terminal />,
          disabled: true,
          onSelect: () => undefined,
        },
      ]}
      size="lg"
    />
  </SectionCard>
);

export const StatusChips = () => (
  <SectionCard heading="Status chips">
    <Status appearance="chip" size="compact" label="Needs you" tone="warning" />{" "}
    <Status
      appearance="chip"
      size="compact"
      label="Working"
      motion="pulse"
      tone="info"
    />{" "}
    <Status
      appearance="chip"
      size="compact"
      label="Errored"

      glyph="bang"
      tone="error"
    />{" "}
    <Status appearance="chip" size="compact" label="Done" tone="success" />
  </SectionCard>
);

export const InboxCardRows = () => (
  <SectionCard heading="Inbox">
    <section>
      <DataListHeading>Needs you</DataListHeading>
      <ActionRow
        appearance="card"
        density="compact"
        icon={<Monogram name="Gardener" />}
        label="Pick a name for the raindrop game"
        description="Gardener"
        trailing={
          <Status
            appearance="chip"
            size="compact"
            label="Needs you"
            tone="warning"
          />
        }
      />
      <ActionRow
        appearance="card"
        density="compact"
        icon={<Monogram name="Maker" />}
        label="A tiny mushroom platformer"
        description="Maker"
        trailing={
          <Status
            appearance="chip"
            size="compact"
            label="Working"
            motion="pulse"
            tone="info"
          />
        }
      />
    </section>
    <section>
      <DataListHeading>Recent</DataListHeading>
      <ActionRow
        appearance="card"
        density="compact"
        icon={<Monogram name="Librarian" />}
        label="Sketching the seed library"
        description="Librarian"
        trailing={
          <>
            <Badge size="sm" variant="quiet">
              Done
            </Badge>
            <time>20m</time>
          </>
        }
      />
    </section>
    <EmptyState
      variant="hint"
      title="That’s everything for now"
      description="A quiet footnote under a list suggests the next thing to try."
      actions={
        <Button size="sm" variant="outline">
          Ask something
        </Button>
      }
    />
  </SectionCard>
);

export default {
  title: "First run",
} satisfies StoryDefault;
