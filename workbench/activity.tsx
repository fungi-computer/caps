import type { Story } from "@ladle/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  ActivityLine,
  type ActivityState,
} from "../src/components/activity-line.js";
import { Button } from "../src/components/button.js";
import { Status, type StatusGlyph } from "../src/components/status.js";
import { ToolCallChip } from "../src/components/tool-call-chip.js";

/** A scripted run: every entry flips its state at `at` ms after Play. */
function useRun(
  steps: readonly (readonly [at: number, apply: () => void])[],
  run: number,
) {
  // The latest script; only a new run replays it.
  const script = useRef(steps);
  useLayoutEffect(() => {
    script.current = steps;
  });
  useEffect(() => {
    if (run === 0) return;
    const timers = script.current.map(([at, apply]) => setTimeout(apply, at));
    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [run]);
}

function PlayBar({ onPlay, hint }: { onPlay: () => void; hint: string }) {
  return (
    <div className="flex items-center gap-md">
      <Button data-activity-play="" onClick={onPlay} size="sm">
        Play
      </Button>
      <p className="text-sm text-base-content/70">{hint}</p>
    </div>
  );
}

const lanes = [
  { name: "Plan the garden", fails: false, progress: false },
  { name: "Water the seedlings", fails: false, progress: true },
  { name: "Prune the hedge", fails: true, progress: false },
] as const;

/** Status task glyphs: waiting, working (spinning or filling), done, refused. */
export const TaskMarks: Story = () => {
  const [run, setRun] = useState(0);
  const [glyphs, setGlyphs] = useState<readonly StatusGlyph[]>(
    lanes.map(() => "ring"),
  );
  const [fill, setFill] = useState(0);
  const set = (index: number, glyph: StatusGlyph) => {
    setGlyphs((current) =>
      current.map((value, at) => (at === index ? glyph : value)),
    );
  };
  useRun(
    [
      [
        0,
        () => {
          setGlyphs(lanes.map(() => "ring"));
          setFill(0);
        },
      ],
      [
        300,
        () => {
          set(0, "arc");
        },
      ],
      [
        700,
        () => {
          set(1, "arc");
        },
      ],
      [
        900,
        () => {
          setFill(0.35);
        },
      ],
      [
        1300,
        () => {
          setFill(0.7);
          set(2, "arc");
        },
      ],
      [
        1800,
        () => {
          setFill(1);
        },
      ],
      [
        2100,
        () => {
          set(0, "check");
        },
      ],
      [
        2300,
        () => {
          set(1, "check");
        },
      ],
      [
        2700,
        () => {
          set(2, "cross");
        },
      ],
    ],
    run,
  );
  return (
    <div className="grid gap-lg p-lg">
      <PlayBar
        onPlay={() => {
          setRun((value) => value + 1);
        }}
        hint="Waiting, working, then done or refused."
      />
      <ul className="grid gap-sm" data-task-marks="">
        {lanes.map((lane, index) => (
          <li key={lane.name}>
            <Status
              glyph={glyphs[index] ?? "ring"}
              label={lane.name}
              progress={lane.progress ? fill : undefined}
              tone={glyphs[index] === "cross" ? "error" : "neutral"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

/** ActivityLine: a live clock while thinking, then it settles and folds. */
export const ActivityLines: Story = () => {
  const [run, setRun] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now() - 4_200);
  const [finishedAt, setFinishedAt] = useState<number | undefined>(
    () => startedAt + 4_200,
  );
  const [thinking, setThinking] = useState<ActivityState>("done");
  const [search, setSearch] = useState<ActivityState>("failed");
  const [trace, setTrace] = useState("");
  const words =
    "The beds by the fence get the most sun, so the tomatoes go there and the lettuce in the shade.";
  useRun(
    [
      [
        0,
        () => {
          setStartedAt(Date.now());
          setFinishedAt(undefined);
          setThinking("running");
          setSearch("running");
          setTrace("");
        },
      ],
      ...words.split(" ").map(
        (_, index, all) =>
          [
            200 + index * 110,
            () => {
              setTrace(all.slice(0, index + 1).join(" "));
            },
          ] as const,
      ),
      [
        1800,
        () => {
          setSearch("failed");
        },
      ],
      [
        2600,
        () => {
          setThinking("done");
        },
      ],
    ],
    run,
  );
  return (
    <div className="grid max-w-prose gap-md p-lg">
      <PlayBar
        onPlay={() => {
          setRun((value) => value + 1);
        }}
        hint="Thinking streams its trace, then folds it away."
      />
      <div data-activity-lines="" className="grid gap-xs">
        <ActivityLine
          doneLabel="Thought for"
          finishedAt={finishedAt}
          label="Thinking"
          startedAt={startedAt}
          state={thinking}
        >
          <p className="text-xs text-base-content/70">{trace || words}</p>
        </ActivityLine>
        <ActivityLine
          doneLabel="Searched for"
          failedLabel="Search stopped after"
          finishedAt={finishedAt}
          label="Searching the notes"
          startedAt={startedAt}
          state={search}
        />
      </div>
    </div>
  );
};

/** ToolCallChip: a fill wipes across while running, then lands or refuses. */
export const ToolCalls: Story = () => {
  const [run, setRun] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now() - 1_400);
  const [states, setStates] = useState<readonly ActivityState[]>([
    "done",
    "done",
    "failed",
  ]);
  const [ends, setEnds] = useState<readonly (number | undefined)[]>([
    startedAt + 340,
    startedAt + 1_400,
    startedAt + 900,
  ]);
  const settle = (index: number, state: ActivityState) => {
    setStates((current) =>
      current.map((value, at) => (at === index ? state : value)),
    );
    const now = Date.now();
    setEnds((current) =>
      current.map((value, at) => (at === index ? now : value)),
    );
  };
  useRun(
    [
      [
        0,
        () => {
          setStartedAt(Date.now());
          setStates(["running", "running", "running"]);
          setEnds([undefined, undefined, undefined]);
        },
      ],
      [
        700,
        () => {
          settle(0, "done");
        },
      ],
      [
        1500,
        () => {
          settle(2, "failed");
        },
      ],
      [
        2600,
        () => {
          settle(1, "done");
        },
      ],
    ],
    run,
  );
  const names = ["read_file", "search_notes", "write_file"] as const;
  return (
    <div className="grid gap-lg p-lg">
      <PlayBar
        onPlay={() => {
          setRun((value) => value + 1);
        }}
        hint="Three calls: quick, slow, refused."
      />
      <div className="flex flex-wrap gap-sm" data-tool-calls="">
        {names.map((name, index) => (
          <ToolCallChip
            key={name}
            finishedAt={ends[index]}
            name={name}
            onRetry={() => {
              setRun((value) => value + 1);
            }}
            startedAt={startedAt}
            state={states[index] ?? "running"}
          />
        ))}
      </div>
    </div>
  );
};
