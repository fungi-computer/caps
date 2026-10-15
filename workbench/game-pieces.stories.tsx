import type { StoryDefault } from "@ladle/react";
import { useEffect, useState } from "react";

import {
  ItemGrid,
  ItemSlot,
  type ItemGridGhost,
  type ItemGridItem,
} from "../src/components/item-grid.js";
import {
  FeedbackLayer,
  FeedbackMark,
} from "../src/components/game-feedback.js";
import {
  GameCard,
  GoalLine,
  HudBar,
  HudChip,
  HudClock,
  HudKeys,
  HudPlate,
  MadeWith,
  MinimapPlate,
  OfferRow,
  Portrait,
  RecipeRow,
} from "../src/components/game-hud.js";
import { Button } from "../src/components/button.js";
import { Keycap, KeycapButton } from "../src/components/keycap.js";
import { PixelNumber } from "../src/components/pixel-number.js";
import { Status } from "../src/components/status.js";
import { Display, Surface } from "../src/components/surface.js";
import {
  WindowActions,
  WindowBody,
  WindowFrame,
  WindowHeader,
} from "../src/components/window.js";
import {
  Axe,
  Bramble,
  Bread,
  Bucket,
  Cobble,
  Hat,
  HeadOutline,
  Log,
  MossArm,
  Rowan,
  Sapling,
  Sedge,
  Shell,
  ShirtOutline,
} from "./game-art.js";
import "./game-pieces.css";

export default { title: "Game pieces" } satisfies StoryDefault;

/** Window actions are host commands; the stories only show the controls. */
function dismiss() {
  return undefined;
}

export const Keycaps = () => {
  const [mode, setMode] = useState<"build" | "orders" | "zones">("orders");
  return (
    <div className="caps-workbench-game">
      <section className="caps-workbench-game-row" aria-label="Keycap sizes">
        {(["sm", "md", "lg"] as const).map((size) => (
          <div key={size} className="caps-workbench-game-row">
            <Keycap size={size}>B</Keycap>
            <Keycap size={size} tone="primary">
              O
            </Keycap>
            <Keycap size={size} tone="accent">
              Z
            </Keycap>
            <Keycap size={size} tone="inverse">
              I
            </Keycap>
            <Keycap size={size} pressed>
              Esc
            </Keycap>
          </div>
        ))}
      </section>
      <p className="caps-workbench-game-caption">
        Legends are native kbd keys. Pressed keys sink into their own travel, so
        a row never shifts.
      </p>
      <Surface size="lg">
        <div
          className="caps-workbench-game-dock"
          role="toolbar"
          aria-label="Dock"
        >
          <KeycapButton
            label="Build"
            shortcut="B"
            pressed={mode === "build"}
            onClick={() => {
              setMode("build");
            }}
          />
          <KeycapButton
            label="Orders"
            shortcut="O"
            pressed={mode === "orders"}
            onClick={() => {
              setMode("orders");
            }}
          />
          <KeycapButton
            label="Zones"
            shortcut="Z"
            pressed={mode === "zones"}
            onClick={() => {
              setMode("zones");
            }}
          />
          <KeycapButton
            label="Backpack"
            shortcut="I"
            tone="primary"
            readout={<PixelNumber value={12} size="sm" />}
          />
          <KeycapButton label="Brew" shortcut="A" tone="inverse" />
          <KeycapButton label="Bed" shortcut="N" disabled />
        </div>
      </Surface>
      <p className="caps-workbench-game-caption">
        Mode keys light their lamp and stay down. Backpack is the one
        high-chroma key; Bed is disabled until there is wood for it.
      </p>
      <div className="caps-workbench-game-row" aria-label="Long labels">
        <KeycapButton
          label="Designate stockpile for spoil and cobble"
          shortcut="Shift+S"
        />
      </div>
    </div>
  );
};

export const PixelNumbers = () => (
  <div className="caps-workbench-game">
    <Display size="lg">
      <div className="caps-workbench-game-readout">
        <PixelNumber text="08:00" size="xl" tone="primary" />
        <PixelNumber text="1/12" size="lg" />
      </div>
    </Display>
    <section className="caps-workbench-game-row" aria-label="Sizes">
      <PixelNumber value={7} pad={2} size="sm" />
      <PixelNumber value={42} size="md" />
      <PixelNumber value={128} size="lg" />
      <PixelNumber value={2048} size="xl" />
    </section>
    <section className="caps-workbench-game-row" aria-label="Floating numbers">
      <PixelNumber value={3} signed size="lg" tone="success" outline />
      <PixelNumber value={-1} size="lg" tone="error" outline />
      <PixelNumber value={16} signed size="lg" tone="warning" outline />
      <PixelNumber text="100%" size="lg" tone="accent" outline />
      <PixelNumber value={1234567890} size="md" outline />
    </section>
    <p className="caps-workbench-game-caption">
      A 3×5 face drawn as SVG at 2, 3, 4 or 6 pixels per dot. It never blurs,
      never loads a font, and screen readers hear the plain number.
    </p>
  </div>
);

const backpack: ItemGridItem[] = [
  { id: "axe", label: "Axe", x: 0, y: 0, h: 3, icon: <Axe /> },
  { id: "log", label: "Log", x: 1, y: 0, h: 2, quantity: 3, icon: <Log /> },
  {
    id: "bucket",
    label: "Bucket of melted ice-moss",
    x: 2,
    y: 0,
    w: 2,
    h: 2,
    icon: <Bucket />,
  },
  { id: "bread", label: "Bread", x: 4, y: 0, quantity: 4, icon: <Bread /> },
  { id: "sapling", label: "Sapling", x: 5, y: 0, icon: <Sapling /> },
  {
    id: "shells",
    label: "Shotgun shells",
    x: 4,
    y: 1,
    quantity: 8,
    icon: <Shell />,
  },
  {
    id: "cobble",
    label: "Mossrock cobble",
    x: 5,
    y: 1,
    quantity: 16,
    selected: true,
    icon: <Cobble />,
  },
  {
    id: "arm",
    label: "Severed mossbody arm",
    x: 7,
    y: 3,
    h: 2,
    icon: <MossArm />,
  },
];

export const ItemGrids = () => {
  const [ghost, setGhost] = useState<ItemGridGhost | null>(null);
  const [message, setMessage] = useState("Hover to preview a 2×1 drop.");
  return (
    <div className="caps-workbench-game">
      <div className="caps-workbench-game-split">
        <section>
          <ItemGrid
            label="Backpack"
            columns={8}
            rows={6}
            items={backpack}
            ghost={ghost}
            onCellHover={(cell) => {
              if (!cell) {
                setGhost(null);
                return;
              }
              const x = Math.min(cell.x, 6);
              const blocked = backpack.some(
                (item) =>
                  item.x < x + 2 &&
                  item.x + (item.w ?? 1) > x &&
                  item.y <= cell.y &&
                  item.y + (item.h ?? 1) > cell.y,
              );
              const next: ItemGridGhost = {
                x,
                y: cell.y,
                w: 2,
                h: 1,
                legal: !blocked,
              };
              if (blocked) next.reason = "Overlaps something already packed";
              setGhost(next);
            }}
            onCellActivate={(cell) => {
              setMessage(
                cell.item ? `Picked up ${cell.item.label}.` : "Nothing here.",
              );
            }}
          />
          <p className="caps-workbench-game-caption" role="status">
            {message}
          </p>
        </section>
        <section className="caps-workbench-game">
          <ItemGrid
            label="Refused drop"
            columns={4}
            rows={3}
            cellSize="sm"
            items={backpack.slice(0, 3)}
            ghost={{
              x: 1,
              y: 1,
              w: 2,
              h: 2,
              legal: false,
              reason: "Overlap: the log is in the way",
            }}
          />
          <ItemGrid
            label="Legal drop"
            columns={4}
            rows={2}
            cellSize="sm"
            items={[]}
            ghost={{ x: 1, y: 0, w: 2, h: 2, legal: true }}
          />
          <ItemGrid label="Empty pockets" columns={2} rows={2} items={[]} />
          <ItemGrid
            label="Belt"
            columns={6}
            rows={1}
            cellSize="lg"
            items={[
              {
                id: "b1",
                label: "Bread",
                x: 0,
                y: 0,
                quantity: 2,
                icon: <Bread />,
              },
              { id: "b2", label: "Axe", x: 1, y: 0, icon: <Axe /> },
            ]}
          />
          <ItemGrid
            label="Long refusal"
            columns={3}
            rows={1}
            cellSize="sm"
            items={[]}
            ghost={{
              x: 0,
              y: 0,
              w: 3,
              h: 1,
              legal: false,
              reason:
                "Too heavy: the belt holds 4 kg and a full bucket of melted ice-moss weighs 9 kg",
            }}
          />
        </section>
      </div>
      <p className="caps-workbench-game-caption">
        Cells carry the keyboard: arrows move, Enter uses. Items and the drop
        ghost are drawn from the host&apos;s facts; the grid never decides a
        move.
      </p>
    </div>
  );
};

export const ItemSlots = () => (
  <div className="caps-workbench-game">
    <div className="caps-workbench-game-doll">
      <ItemSlot label="Head" item={{ label: "Straw hat", icon: <Hat /> }} />
      <ItemSlot label="Face" placeholder={<HeadOutline />} />
      <ItemSlot label="Neck" placeholder={<ShirtOutline />} />
      <ItemSlot label="Main hand" item={{ label: "Axe", icon: <Axe /> }} />
      <ItemSlot label="Body" state="legal" placeholder={<ShirtOutline />} />
      <ItemSlot label="Off hand" state="illegal" />
      <ItemSlot label="Belt" item={{ label: "Bread", icon: <Bread /> }} />
      <ItemSlot label="Legs" disabled />
      <ItemSlot label="Feet" />
    </div>
    <p className="caps-workbench-game-caption">
      Body answers a held shirt with green; Off hand refuses it in red. Legs is
      disabled while the doll is kneeling.
    </p>
  </div>
);

export const InkWindows = () => (
  <div className="caps-workbench-game-split">
    <WindowFrame
      aria-label="Backpack"
      data-theme="paper"
      fitContent
      className="h-fit max-h-[min(45vh,32rem)]"
      active
    >
      <WindowHeader
        title="Backpack"
        actions={<WindowActions title="Backpack" onClose={dismiss} />}
      />
      <WindowBody>
        <div className="caps-workbench-game-window-body">
          <ItemGrid
            label="Backpack"
            columns={6}
            rows={4}
            cellSize="sm"
            items={backpack
              .slice(0, 7)
              .map((item) => ({ ...item, selected: false }))}
          />
        </div>
      </WindowBody>
    </WindowFrame>
    <WindowFrame
      aria-label="Challenges"
      data-theme="paper"
      fitContent
      className="h-fit max-h-[min(45vh,32rem)]"
    >
      <WindowHeader
        title="Challenges"
        actions={
          <WindowActions
            title="Challenges"
            onMinimize={dismiss}
            onClose={dismiss}
          />
        }
      />
      <WindowBody>
        <div className="caps-workbench-game-window-body">
          <Status label="Plant a sapling" tone="success" />
          <Status label="Build the generator" tone="warning" motion="pulse" />
          <Status label="Brew one ale" tone="neutral" />
          <PixelNumber text="1/12" size="md" />
        </div>
      </WindowBody>
    </WindowFrame>
    <WindowFrame aria-label="Molded comparison">
      <WindowHeader title="Molded (App shell)" />
      <WindowBody>
        <div className="caps-workbench-game-window-body">
          The same WindowFrame contract, so Maosaico tiles and floats ink
          windows like any other.
        </div>
      </WindowBody>
    </WindowFrame>
  </div>
);

export const GameHud = () => (
  <div className="caps-workbench-game-stage">
    <div className="caps-workbench-game-top">
      <Surface size="sm">
        <div className="caps-workbench-game-portraits">
          <div className="caps-workbench-game-portrait">
            <Rowan label="Rowan" />
            <span>
              Rowan
              <small>Felling the oak</small>
            </span>
          </div>
          <div className="caps-workbench-game-portrait">
            <Sedge label="Sedge" />
            <span>
              Sedge
              <small>Waiting for work</small>
            </span>
          </div>
        </div>
      </Surface>
      <Display size="sm" density="compact">
        <div className="caps-workbench-game-readout">
          <span className="caps-workbench-game-label">Day</span>
          <PixelNumber value={1} size="lg" />
          <PixelNumber text="08:00" size="lg" tone="primary" />
          <span className="caps-workbench-game-icon">
            <Log label="Wood" />
          </span>
          <PixelNumber value={48} size="lg" />
        </div>
      </Display>
    </div>
    <div className="caps-workbench-game-advisor">
      <WindowFrame
        aria-label="Bramble"
        data-theme="paper"
        fitContent
        className="h-fit max-h-[min(45vh,32rem)]"
      >
        <WindowHeader
          title="Bramble"
          actions={<WindowActions title="Bramble" onClose={dismiss} />}
        />
        <WindowBody>
          <div className="caps-workbench-game-advisor-body">
            <Bramble label="Bramble the cat" />
            <p>
              Two travellers, hungry, want ale. Mugwort first, then water. I
              will supervise from the warm spot.
            </p>
          </div>
        </WindowBody>
      </WindowFrame>
    </div>
    <div className="caps-workbench-game-dock-seat">
      <Surface size="lg">
        <div
          className="caps-workbench-game-dock"
          role="toolbar"
          aria-label="Game dock"
        >
          <KeycapButton label="Build" shortcut="B" pressed={false} />
          <KeycapButton label="Orders" shortcut="O" pressed />
          <KeycapButton label="Zones" shortcut="Z" pressed={false} />
          <KeycapButton
            label="Backpack"
            shortcut="I"
            tone="primary"
            readout={<PixelNumber value={8} size="sm" />}
          />
        </div>
      </Surface>
    </div>
  </div>
);

type ShownMark = {
  kind: "confirm" | "deny" | "hit" | "gain";
  x: number;
  y: number;
  label?: string;
  amount?: number;
  life: number;
};

const REPLAY: readonly ShownMark[] = [
  { kind: "confirm", x: 60, y: 190, life: 450 },
  { kind: "gain", x: 150, y: 150, amount: 3, label: "Soil spoil", life: 1100 },
  {
    kind: "deny",
    x: 40,
    y: 40,
    label: "Refused: no matching excavation order",
    life: 2200,
  },
  { kind: "hit", x: 330, y: 180, amount: -2, life: 700 },
];
/** Long enough that the held first round reads like a still. */
const HELD_LIFE = 600_000;

/** A replayable list of marks; each Replay is a new round of the same list. */
export const Feedback = () => {
  const [round, setRound] = useState(0);
  const [shown, setShown] = useState(true);
  const [paused, setPaused] = useState(false);
  const held = round === 0;
  useEffect(() => {
    if (held || paused || !shown) return;
    const longest = Math.max(...REPLAY.map((mark) => mark.life));
    const timer = setTimeout(() => {
      setShown(false);
    }, longest);
    return () => {
      clearTimeout(timer);
    };
  }, [held, paused, shown, round]);
  return (
    <div className="caps-workbench-game">
      <div className="caps-workbench-game-feedback-stage">
        <FeedbackLayer paused={paused}>
          {shown
            ? REPLAY.map((mark, index) => (
                <FeedbackMark
                  key={`${String(round)}-${String(index)}`}
                  {...mark}
                  life={held ? HELD_LIFE : mark.life}
                />
              ))
            : null}
        </FeedbackLayer>
      </div>
      <div className="caps-workbench-game-row">
        <KeycapButton
          label="Replay"
          shortcut="R"
          onClick={() => {
            setRound((value) => value + 1);
            setShown(true);
          }}
        />
        <KeycapButton
          label="Pause"
          shortcut="Space"
          pressed={paused}
          onClick={() => {
            setPaused((value) => !value);
          }}
        />
      </div>
      <p className="caps-workbench-game-caption">
        A confirm tick, a gain pop, a refusal that shakes its head with the
        host&apos;s reason, and a hit. The first round holds so every mark is
        visible; Replay plays them at their real lives and Pause freezes them.
        Reduced motion keeps them still.
      </p>
    </div>
  );
};

/** Every game HUD molecule in the shared game theme, once per accent. */
export const GameHudKit = () => (
  <div className="caps-workbench-game">
    {([undefined, "ember", "tide"] as const).map((theme) => (
      <section
        key={theme ?? "field-guide"}
        data-theme="field-guide"
        className="caps-workbench-game-split"
        aria-label={`Palette ${theme ?? "field-guide"}`}
      >
        <div data-theme="paper" className="contents">
          <div data-theme={theme} className="contents">
            <HudPlate>
              <HudClock
                label="Night 1 of 5"
                detail="dawn in 48s"
                phase="night"
                time="02:40"
              />
              <HudBar label="Health" value={72} max={100} tone="success" />
              <HudBar label="Hunger" value={22} max={100} tone="warning" />
              <HudBar label="Door" value={30} max={210} tone="info" />
              <div className="caps-hud-chips">
                <HudChip label="Bandages" value={2} />
                <HudChip label="Boards" value={4} />
                <HudChip label="Guns" value="ready" />
              </div>
              <div className="caps-portraits">
                <Portrait name="Rowan" status="Felling the oak" />
                <Portrait name="Sedge" status="Waiting for work" mood="warn" />
              </div>
            </HudPlate>
            <GameCard kind="goal" kicker="Goals" title="First evening">
              <GoalLine done>Fell the marked grove</GoalLine>
              <GoalLine done={false}>Build a brew station</GoalLine>
              <GoalLine done={false}>Brew herbal ale</GoalLine>
            </GameCard>
            <MinimapPlate
              label="Sea chart"
              columns={12}
              rows={7}
              marks={[
                { x: 1, y: 3, kind: "place", label: "Saltwick" },
                { x: 10, y: 3, kind: "goal", label: "Merehaven" },
                { x: 4, y: 4, kind: "self", label: "Mosswake" },
                { x: 7, y: 2, kind: "foe", label: "Red Gull" },
              ]}
            />
            <HudPlate>
              <HudKeys orientation="vertical" aria-label="Quick actions">
                <KeycapButton label="Scavenge here" shortcut="V" />
                <KeycapButton label="Board door" shortcut="C" />
                <KeycapButton label="Light lantern" shortcut="L" expanded />
              </HudKeys>
            </HudPlate>
            <HudPlate density="roomy">
              <OfferRow
                label="Pickled eels"
                detail="to Merehaven · 240 s · 2 slots"
                price="120 cr"
                action={<Button size="sm">Sign</Button>}
              />
              <RecipeRow
                label="Herbal ale"
                inputs={[
                  { label: "Mugwort", glyph: "🌿", have: 1, need: 2 },
                  { label: "Water", glyph: "💧", have: 3, need: 1 },
                ]}
                output={{ label: "Ale", glyph: "🍺", quantity: 1 }}
                action={<Button size="sm">Brew</Button>}
              />
            </HudPlate>
            <GameCard
              kind="end"
              kicker="Five dawns"
              title="You survived"
              footer={
                <>
                  <Button>New world</Button>
                  <MadeWith href="#make" />
                </>
              }
            >
              <p>The horde crumbles to moss.</p>
            </GameCard>
          </div>
        </div>
      </section>
    ))}
  </div>
);

/** Tints and end-card finishes compose without changing the card's content kind. */
export const NestedGameThemes = () => (
  <div data-theme="field-guide">
    <div data-theme="paper" className="grid gap-xl p-xl">
      {([undefined, "ember", "tide"] as const).map((theme) => (
        <div
          key={theme ?? "field-guide"}
          data-theme={theme}
          className="flex flex-wrap gap-xl"
        >
          {([undefined, "tape", "sunrise"] as const).map((finish) => (
            <GameCard
              key={finish ?? "plain"}
              data-theme={finish}
              kind="end"
              kicker={theme ?? "field-guide"}
              title={
                <span className="caps-hud-card-title-text">
                  {finish ?? "A new beginning"}
                </span>
              }
              footer={<Button variant="primary">Look around</Button>}
            >
              <p>The settlement carries on. There is more to discover.</p>
            </GameCard>
          ))}
        </div>
      ))}
    </div>
  </div>
);
