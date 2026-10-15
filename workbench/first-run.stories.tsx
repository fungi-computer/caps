import type { StoryDefault } from "@ladle/react";
import { createSprite } from "@fungi.computer/sprite";
import { Sprite } from "@fungi.computer/sprite/react";
import {
  Gamepad2,
  Image,
  MessagesSquare,
  PenTool,
  Terminal,
} from "lucide-react";
import { EmptyState } from "../src/blocks/empty-state.js";
import { AppGrid, SectionGrid } from "../src/blocks/launcher-grid.js";
import { SectionCard } from "../src/blocks/section-card.js";
import { ActionRow } from "../src/components/action-row.js";
import { Badge } from "../src/components/badge.js";
import { Button } from "../src/components/button.js";
import { DataListHeading } from "../src/components/data-list.js";
import { Monogram } from "../src/components/monogram.js";
import { Status } from "../src/components/status.js";

/*
 * A fresh Team's first screen, composed only from Caps variants: the mascot
 * greets from a speech bubble, Recent invites from a recessed panel, and the
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
      description="A recessed, centered invitation with an optional action."
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
