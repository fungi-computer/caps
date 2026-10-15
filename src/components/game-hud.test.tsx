import { afterEach, describe, expect, it } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import {
  GameCard,
  GoalLine,
  HudBar,
  HudChip,
  HudClock,
  MadeWith,
  MinimapPlate,
} from "./game-hud.js";

afterEach(cleanup);

describe("HudBar", () => {
  it("reads its label then value as text and exposes a bounded meter", () => {
    const view = render(
      <HudBar label="Hull" value={3} max={10} tone="error" />,
    );
    const bar = requireValue(view.queryBySelector(".caps-hud-bar"), "bar");
    expect(bar.textContent).toMatch(/Hull\s*3 \/ 10/);
    expect(bar.hasAttribute("data-low")).toBe(false);
    const meter = requireValue(view.queryBySelector("[role=meter]"), "meter");
    expect(meter.getAttribute("aria-valuenow")).toBe("3");
    expect(meter.getAttribute("aria-valuemax")).toBe("10");
    expect(bar.getAttribute("style")).toContain("--caps-hud-share: 0.3");
  });

  it("marks a low bar and clamps a share outside its range", () => {
    const view = render(<HudBar label="Hunger" value={140} max={100} />);
    const bar = requireValue(view.queryBySelector(".caps-hud-bar"), "bar");
    expect(bar.getAttribute("style")).toContain("--caps-hud-share: 1");
    cleanup();
    const low = render(<HudBar label="Hunger" value={10} max={100} />);
    expect(low.queryBySelector("[data-low]")).not.toBeNull();
  });
});

describe("HudChip and HudClock", () => {
  it("uses themed numeric text for counts and clock values", () => {
    const view = render(
      <>
        <HudChip label="Boards" value={4} />
        <HudChip label="Guns" value="ready" />
        <HudClock
          label="Night 1 of 5"
          detail="dusk in 12s"
          phase="night"
          time="00:12"
        />
      </>,
    );
    expect(view.container.textContent).toMatch(/Boards\s*4/);
    expect(view.container.textContent).toMatch(/Guns\s*ready/);
    expect(view.queryBySelector(".caps-hud-text-value")?.textContent).toBe("4");
    expect(
      view.queryBySelector(".caps-hud-clock-time .caps-numeric")?.textContent,
    ).toBe("00:12");
    expect(
      view.queryBySelector(".caps-hud-clock")?.getAttribute("data-phase"),
    ).toBe("night");
  });
});

describe("MinimapPlate", () => {
  it("names every mark for assistive tech and places marks by cell", () => {
    const view = render(
      <MinimapPlate
        label="Sea chart"
        columns={10}
        rows={4}
        marks={[
          { x: 0, y: 0, kind: "place", label: "Saltwick" },
          { x: 9, y: 3, kind: "self", label: "Mosswake" },
        ]}
      />,
    );
    const field = requireValue(view.queryBySelector("[role=img]"), "chart");
    expect(field.getAttribute("aria-label")).toBe(
      "Sea chart: Saltwick, Mosswake",
    );
    const self = requireValue(
      view.queryBySelector('[data-kind="self"]'),
      "self mark",
    );
    expect(self.getAttribute("style")).toContain("--caps-minimap-x: 0.95");
    const place = requireValue(
      view.queryBySelector('[data-kind="place"]'),
      "place mark",
    );
    expect(place.getAttribute("data-label")).not.toBe("hidden");
    expect(self.hasAttribute("data-label")).toBe(false);
  });
});

describe("GameCard", () => {
  it("keeps goal state readable and credits Fungi on an end card", () => {
    const view = render(
      <GameCard
        kind="end"
        title="You survived"
        footer={<MadeWith href="https://fungi.computer/make" />}
      >
        <GoalLine done>Fell the grove</GoalLine>
      </GameCard>,
    );
    expect(view.queryBySelector("h2")?.textContent).toBe("You survived");
    expect(view.container.textContent).toContain("Fell the grove (done)");
    expect(view.queryBySelector("a")?.getAttribute("href")).toBe(
      "https://fungi.computer/make",
    );
  });
});
