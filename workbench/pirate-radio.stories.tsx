import type { StoryDefault } from "@ladle/react";
import { RadioTower } from "lucide-react";
import { useState } from "react";
import coverage from "./coverage.json";
import { HudNumber, HudClock } from "../src/components/game-hud.js";
import { QuotaMeter } from "../src/components/quota-meter.js";
import { PriceTag } from "../src/components/price-tag.js";
import { CountBadge } from "../src/components/count-badge.js";
import { StatusTray } from "../src/blocks/status-tray.js";
import { SpecSheetExample } from "./examples.js";
import { FieldGuideThemes } from "./technonomicon.stories.js";
import { Eyebrow, SectionHeading } from "../src/blocks/section-heading.js";
import { Badge } from "../src/components/badge.js";
import { Button } from "../src/components/button.js";
import { Card } from "../src/components/card.js";
import { Field } from "../src/components/field.js";
import { Input } from "../src/components/input.js";
import { Progress } from "../src/components/progress.js";
import { Stat } from "../src/components/stat.js";
import { Screen, Surface } from "../src/components/surface.js";
import {
  WindowFrame,
  WindowHeader,
  WindowBody,
} from "../src/components/window.js";

export { GalleryExtras as AdditionalPrimitives } from "./gallery-extras.js";
const galleryItems = [
  { name: "status-tray", storyId: "foundations--pirate-radio--tray-inherited" },
  { name: "checkbox-bead", storyId: "forms--checkbox" },
  { name: "radio-bead", storyId: "forms--radio-group" },
  { name: "switch-bead", storyId: "forms--switch" },
  { name: "status-bead", storyId: "feedback--status" },
  { name: "gooey", storyId: "feedback--status" },
  { name: "loader-blobs", storyId: "feedback--loader" },
  { name: "field-guide", storyId: "game-pieces--keycaps" },
  ...coverage.items.map((item) => ({
    ...item,
    storyId:
      item.name === "spec-sheet"
        ? "foundations--pirate-radio--spec-sheet-inherited"
        : item.name === "technonomicon"
          ? "foundations--pirate-radio--editorial-inherited"
          : item.storyId,
  })),
  ...[
    "action-row",
    "copy-field",
    "diff-view",
    "disclosure",
    "inline-code",
    "monogram",
    "navigation-rail",
    "popover",
    "resize-handle",
    "wizard",
  ].map((name) => ({
    name,
    storyId: "foundations--pirate-radio--additional-primitives",
  })),
  { name: "chat-bubble", storyId: "chat-bubble--rich-text" },
  { name: "cover-pattern", storyId: "feedback--cover-pattern" },
  { name: "surface", storyId: "surfaces--surface--surfaces" },
];

export default { title: "Foundations / Pirate radio" } satisfies StoryDefault;

function Components({ theme }: { theme: string }) {
  const [count, setCount] = useState(0);
  return (
    <section
      data-theme={theme}
      className="bg-base-100 text-base-content font-sans p-xl grid gap-xl"
    >
      <header className="grid gap-sm">
        <Eyebrow>COMMUNITY BROADCAST / CH 122</Eyebrow>
        <SectionHeading>Pirate radio</SectionHeading>
        <p>A paper-and-ink finish. Ordinary Caps parts, nested theme tokens.</p>
      </header>
      <div className="flex flex-wrap gap-md">
        <Badge tone="primary">● LIVE</Badge>
        <Badge variant="quiet">CH 122</Badge>
        <Badge tone="secondary">STILL ON AIR</Badge>
        <Badge tone="error">OFFLINE</Badge>
      </div>
      <div className="flex flex-wrap gap-md">
        <Button
          onClick={() => {
            setCount(count + 1);
          }}
        >
          Tune in · {count}
        </Button>
        <Button variant="secondary">Replay</Button>
        <Button variant="outline">Schedule</Button>
        <Button disabled>Unavailable</Button>
      </div>
      <Field label="Channel">
        <Input defaultValue="Northdale community radio" />
      </Field>
      <Card>
        <div className="p-lg grid gap-md">
          <SectionHeading>Same town. Different people.</SectionHeading>
          <p>News from whoever is still listening.</p>
        </div>
      </Card>
      <WindowFrame active>
        <WindowHeader title="Broadcast desk" />
        <WindowBody>
          <div className="p-lg grid gap-md">
            <Eyebrow>AGENT CAPTION</Eyebrow>
            <Screen>
              <div className="p-lg">Watching world revision 122.</div>
            </Screen>
          </div>
        </WindowBody>
      </WindowFrame>
      <div className="grid grid-cols-2 gap-md">
        <Card>
          <Stat density="compact" label="WORLD TIME" value="00:12" />
        </Card>
        <Card>
          <Stat density="compact" label="LISTENERS" value="24" />
        </Card>
      </div>
    </section>
  );
}
export const Light = () => <Components theme="pirate-radio" />;
// Reuse real catalogue fixtures, isolating their state and portal roots.
function Gallery({ theme }: { theme: string }) {
  const [selected, setSelected] = useState(galleryItems[0]?.storyId ?? "");
  return (
    <section
      data-theme={theme}
      className="bg-base-100 text-base-content font-sans p-lg grid gap-lg"
    >
      <SectionHeading>Complete component gallery</SectionHeading>
      <p>
        {galleryItems.length} catalogue entries. Select a component to exercise
        its real fixture.
      </p>
      <nav aria-label="Component gallery" className="flex flex-wrap gap-sm">
        {galleryItems.map((item) => (
          <Button
            key={item.name}
            size="sm"
            variant="outline"
            aria-pressed={selected === item.storyId}
            onClick={() => {
              setSelected(item.storyId);
            }}
          >
            {item.name}
          </Button>
        ))}
      </nav>
      <iframe
        title="Selected component fixture"
        className="w-full min-h-screen border-0"
        src={`?story=${selected}&mode=preview&capsTheme=${theme}`}
      />
    </section>
  );
}
export const GalleryLight = () => <Gallery theme="pirate-radio" />;
export const GalleryNight = () => <Gallery theme="pirate-radio-night" />;
export const Night = () => <Components theme="pirate-radio-night" />;
export const Nested = () => (
  <div data-theme="mocha" className="bg-base-100 p-lg grid gap-lg">
    <Components theme="pirate-radio" />
    <div
      data-theme="latte"
      className="bg-base-100 text-base-content font-sans p-lg"
    >
      <SectionHeading>Back to latte</SectionHeading>
      <Button>Ordinary controls</Button>
    </div>
  </div>
);

function Broadcast({ theme }: { theme: string }) {
  return (
    <main
      data-theme={theme}
      className="bg-base-100 text-base-content font-sans p-lg grid gap-lg"
    >
      <div className="grid gap-lg lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <Surface className="min-h-80 grid place-items-center">
          <div className="p-xl grid justify-items-center gap-lg">
            <Badge tone="primary">STILL ON AIR</Badge>
            <RadioTower size={96} strokeWidth={1} />
            <Eyebrow>WORLD VIEWPORT · LAYOUT FIXTURE</Eyebrow>
            <p>Live game view mounts here.</p>
          </div>
        </Surface>
        <Card>
          <div className="p-lg grid gap-lg">
            <div className="flex justify-between gap-md">
              <Eyebrow>VISHNU · AGENT PLAY</Eyebrow>
              <Badge variant="quiet">CH 122</Badge>
            </div>
            <h1 className="caps-section-heading text-7xl leading-heading">
              NORTHDALE
            </h1>
            <div className="flex items-center gap-md">
              <Badge tone="primary" size="lg">
                ● LIVE
              </Badge>
              <p>
                COMMUNITY BROADCAST
                <br />
                FROM THE DEAD TOWN
              </p>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <Card>
                <Stat density="compact" label="WORLD TIME" value="00:12" />
              </Card>
              <Card>
                <Stat density="compact" label="COST" value="$0.04" />
              </Card>
            </div>
            <Field label="Goals · 2 / 5">
              <Progress value={40} max={100} />
            </Field>
            <WindowFrame>
              <WindowHeader title="AGENT CAPTION" />
              <WindowBody>
                <Screen>
                  <div className="p-lg font-mono">
                    Boarding the north door before sunset.
                  </div>
                </Screen>
              </WindowBody>
            </WindowFrame>
            <div className="flex flex-wrap gap-md">
              <Button>Follow player</Button>
              <Button variant="outline">Replay</Button>
            </div>
            <Eyebrow>SAME TOWN. DIFFERENT PEOPLE.</Eyebrow>
          </div>
        </Card>
      </div>
    </main>
  );
}
export const Spectator = () => <Broadcast theme="pirate-radio" />;
export const SpectatorNight = () => <Broadcast theme="pirate-radio-night" />;

export const SpecSheetInherited = () => <SpecSheetExample />;
export const EditorialInherited = () => {
  const theme = new URLSearchParams(window.location.search).get("capsTheme");
  return <FieldGuideThemes {...(theme === null ? {} : { theme })} />;
};

function Typography({ theme }: { theme: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section
      data-theme={theme}
      className="bg-base-100 text-base-content font-sans p-xl grid gap-xl"
    >
      <Eyebrow>COMMUNITY BROADCAST · CH 122</Eyebrow>
      <h1 className="caps-section-heading text-6xl leading-heading">
        NORTHDALE
        <br />
        COMMUNITY RADIO
      </h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-lg">
        {[
          ["WORLD TIME", "00:12"],
          ["COST", "$0.04"],
          ["LISTENERS", "24"],
          ["TOTAL", "1,284"],
        ].map(([label, value]) => (
          <Card key={label}>
            <Stat label={label} value={value} />
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-xl">
        <HudNumber value="1,284" size="md" />
        <HudClock label="World time" time="00:12" phase="night" />
        <PriceTag price={{ kind: "one-time", label: "$0.04" }} />
        <CountBadge count="24" label="listeners" />
      </div>
      <QuotaMeter label="Audience" value={24} max={1284} maxLabel="1,284" />
      <StatusTray
        openId={openId}
        onOpenChange={setOpenId}
        items={[
          {
            id: "broadcast",
            label: "Broadcast",
            count: 24,
            tone: "success",
            content: <p>Community station · on air</p>,
          },
        ]}
      />
    </section>
  );
}
export const TypographyPaper = () => <Typography theme="pirate-radio" />;
export const TypographyNight = () => <Typography theme="pirate-radio-night" />;

export const TrayInherited = () => {
  const [openId, setOpenId] = useState<string | null>("broadcast");
  return (
    <div className="min-h-screen p-xl flex items-end">
      <StatusTray
        openId={openId}
        onOpenChange={setOpenId}
        items={[
          {
            id: "broadcast",
            label: "Broadcast",
            count: 24,
            tone: "success",
            content: (
              <p>
                Community radio is live. Twenty-four listeners are tuned in.
              </p>
            ),
            actions: (
              <Button size="sm" variant="outline">
                Replay
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
};
