import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import { ActivityLine, formatElapsed } from "./activity-line.js";
import { Status } from "./status.js";
import { formatCallTime, ToolCallChip } from "./tool-call-chip.js";

// SAFETY: React reads this flag to enable act() outside a test renderer.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.replaceChildren();
});

function mount(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
}

test("elapsed times read short and stay readable as they grow", () => {
  expect(formatElapsed(420)).toBe("0.4s");
  expect(formatElapsed(4_210)).toBe("4.2s");
  expect(formatElapsed(42_900)).toBe("42s");
  expect(formatElapsed(185_000)).toBe("3m 05s");
  expect(formatCallTime(340)).toBe("340ms");
  expect(formatCallTime(1_400)).toBe("1.4s");
});

test("task glyphs render a mark, bead glyphs keep the bead", () => {
  const { container } = mount(
    <>
      <Status glyph="check" label="Done" />
      <Status glyph="dot" label="Live" />
    </>,
  );
  const [check, dot] = container.querySelectorAll(".caps-status");
  expect(check?.querySelector(".caps-status-mark")).not.toBeNull();
  expect(dot?.querySelector(".caps-status-bead")).not.toBeNull();
});

test("a finished activity says how long it took and folds its trace", () => {
  const { container, root } = mount(
    <ActivityLine
      doneLabel="Thought for"
      label="Thinking"
      startedAt={1_000}
      state="running"
    >
      <p>trace</p>
    </ActivityLine>,
  );
  const trigger = container.querySelector("button");
  expect(trigger?.getAttribute("aria-expanded")).toBe("true");
  act(() => {
    root.render(
      <ActivityLine
        doneLabel="Thought for"
        finishedAt={5_200}
        label="Thinking"
        startedAt={1_000}
        state="done"
      >
        <p>trace</p>
      </ActivityLine>,
    );
  });
  expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  expect(trigger?.textContent).toContain("Thought for 4.2s");
});

test("a failed tool call offers a retry", () => {
  const { container } = mount(
    <ToolCallChip
      finishedAt={1_900}
      name="write_file"
      onRetry={() => undefined}
      startedAt={1_000}
      state="failed"
    />,
  );
  expect(container.textContent).toContain("900ms");
  expect(
    container.querySelector('button[aria-label="Retry write_file"]'),
  ).not.toBeNull();
});
