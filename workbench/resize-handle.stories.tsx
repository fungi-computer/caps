import type { StoryDefault } from "@ladle/react";
import { usePointerDrag } from "@fungi.computer/maosaico";
import { useState, type CSSProperties } from "react";
import { ResizeHandle } from "../src/components/resize-handle.js";
import "./resize-handle.css";

export default { title: "Layouts / Resize handle" } satisfies StoryDefault;

function SplitPane({
  orientation,
}: {
  orientation: "horizontal" | "vertical";
}) {
  const vertical = orientation === "vertical";
  const min = vertical ? 120 : 80;
  const max = vertical ? 280 : 200;
  const [size, setSize] = useState(vertical ? 200 : 140);
  const pointer = usePointerDrag({
    begin: () => true,
    move: (dx, dy) => {
      setSize((value) =>
        Math.min(max, Math.max(min, value + (vertical ? dx : dy))),
      );
    },
    end: () => undefined,
  });
  const id = `resize-${orientation}`;
  const style: CSSProperties & { "--resize-pane": string } = {
    "--resize-pane": `${String(size)}px`,
  };
  return (
    <section>
      <h2 className="caps-workbench-title">
        {vertical ? "Side by side" : "Stacked"}
      </h2>
      <p className="caps-workbench-muted">
        Drag the knob, or focus it and use arrow keys, Home and End.
      </p>
      <div
        className="caps-workbench-resize-stage"
        data-orientation={orientation}
        style={style}
      >
        <div id={id} className="caps-workbench-resize-pane">
          {vertical ? "Conversation list" : "Preview"}
        </div>
        <div className="caps-workbench-resize-pane">
          {vertical ? "Conversation" : "Terminal"}
        </div>
        <ResizeHandle
          {...pointer}
          aria-label={vertical ? "Conversation list width" : "Preview height"}
          aria-controls={id}
          orientation={orientation}
          className={
            vertical
              ? "absolute left-(--resize-pane) top-1/2 -translate-x-1/2 -translate-y-1/2"
              : "absolute left-1/2 top-(--resize-pane) -translate-x-1/2 -translate-y-1/2"
          }
          min={min}
          max={max}
          value={size}
          onValueChange={setSize}
        />
      </div>
      <output aria-label={`${orientation} pane size`}>
        <code>{size}px</code>
      </output>
    </section>
  );
}

/** The same Caps surface with Maosaico's existing captured-pointer owner. */
export function BothOrientations() {
  return (
    <main className="caps-workbench-surface" data-resize-story>
      <h1 className="caps-workbench-title">One resize knob</h1>
      <div className="caps-workbench-theme-grid">
        <SplitPane orientation="vertical" />
        <SplitPane orientation="horizontal" />
      </div>
    </main>
  );
}
