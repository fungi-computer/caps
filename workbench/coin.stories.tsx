import type { StoryDefault } from "@ladle/react";
import { useState } from "react";
import { Eyebrow, SectionHeading } from "../src/blocks/section-heading.js";
import { Badge } from "../src/components/badge.js";
import { Button } from "../src/components/button.js";
import { Card } from "../src/components/card.js";
import { Field } from "../src/components/field.js";
import { Input } from "../src/components/input.js";
import { Stat } from "../src/components/stat.js";
import { Screen, Surface } from "../src/components/surface.js";

export default { title: "Foundations / Coin" } satisfies StoryDefault;

/** Coin is a whole arcade-cabinet theme: every ordinary Caps part wears it. */
function Cabinet({ theme }: { theme: "coin" | "coin-night" }) {
  const [credits, setCredits] = useState(0);
  return (
    <section
      data-theme={theme}
      className="bg-base-100 text-base-content font-sans p-xl grid gap-xl"
    >
      <header className="grid gap-sm">
        <Eyebrow>Insert coin · stay a while</Eyebrow>
        <SectionHeading>Coin</SectionHeading>
        <p>Cabinet paper, a gold coin, ink outlines and a deep press.</p>
      </header>
      <div className="flex flex-wrap gap-md">
        <Badge tone="primary">Free play</Badge>
        <Badge variant="quiet">Credits {credits}</Badge>
        <Badge tone="secondary">2 players</Badge>
        <Badge tone="error">Out of order</Badge>
      </div>
      <div className="flex flex-wrap gap-lg">
        <Button
          variant="primary"
          onClick={() => {
            setCredits(credits + 1);
          }}
        >
          Insert coin
        </Button>
        <Button variant="secondary">Continue</Button>
        <Button variant="accent">Make one like this</Button>
        <Button variant="outline">High scores</Button>
        <Button disabled>Unavailable</Button>
      </div>
      <Field label="Player name">
        <Input defaultValue="AAA" />
      </Field>
      <div className="grid grid-cols-1 gap-lg sm:grid-cols-2">
        <Card>
          <div className="p-lg grid gap-md">
            <SectionHeading>Tonight's cabinet</SectionHeading>
            <p>A short game, made by someone, playable right now.</p>
          </div>
        </Card>
        <Surface size="lg">
          <div className="p-lg grid gap-md">
            <Eyebrow>Attract mode</Eyebrow>
            <Screen>
              <div className="p-lg">Press start.</div>
            </Screen>
          </div>
        </Surface>
      </div>
      <div className="grid grid-cols-2 gap-md">
        <Card>
          <Stat density="compact" label="High score" value="48,200" />
        </Card>
        <Card>
          <Stat density="compact" label="Players online" value="24" />
        </Card>
      </div>
    </section>
  );
}

export const Light = () => <Cabinet theme="coin" />;
export const Night = () => <Cabinet theme="coin-night" />;
