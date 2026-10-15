import type { CSSProperties } from "react";
import "./bento.css";
import { useEffect, useRef, useState } from "react";
import { applyBentoOps, useMaosaicoBento } from "@fungi.computer/maosaico";
import { Screen } from "../src/components/surface.js";
import { Keycap } from "../src/components/keycap.js";
import { StatusLed } from "../src/components/field-guide.js";
import {
  DataList,
  DataRow,
  DataListHeading,
} from "../src/components/data-list.js";
import { Button } from "../src/components/button.js";

export default { title: "Layouts/Bento" };

const gap = 12;
const rowHeight = 180;
const rowStride = rowHeight + gap;

export function ControlledBento() {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [placements, setPlacements] = useState([
    { id: "launcher", col: 0, row: 0, w: 2, h: 1 },
    { id: "inbox", col: 2, row: 0, w: 2, h: 2 },
  ]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(container.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  const columns = width <= 540 ? 2 : 4;
  const binding = useMaosaicoBento({
    placements,
    columns,
    width,
    rowHeight,
    gap,
    onChange: (ops) => {
      setPlacements((current) => [...applyBentoOps(current, ops, columns)]);
    },
  });
  const height = Math.max(
    0,
    ...[...binding.frames.values()].map((frame) => frame.y + frame.height),
  );
  const stageStyle: CSSProperties & { "--bento-content-height": string } = {
    "--bento-content-height": `${String(height)}px`,
  };
  return (
    <>
      <div className="bento-study-legend">
        <span className="bento-study-hint">
          <Keycap size="sm">← ↑ ↓ →</Keycap>
          <span>Move or resize a cell</span>
        </span>
        <span className="bento-study-hint">
          <Keycap size="sm">Esc</Keycap>
          <span>Cancel preview</span>
        </span>
      </div>
      <div ref={container} className="bento-study" style={stageStyle}>
        {placements.map((tile) => {
          const frame = binding.frames.get(tile.id);
          if (!frame) return null;
          const style: CSSProperties &
            Record<
              "--bento-x" | "--bento-y" | "--bento-width" | "--bento-height",
              string
            > = {
            "--bento-x": `${String(frame.x)}px`,
            "--bento-y": `${String(frame.y)}px`,
            "--bento-width": `${String(frame.width)}px`,
            "--bento-height": `${String(frame.height)}px`,
          };
          return (
            <div key={tile.id} className="bento-study-tile" style={style}>
              <DataListHeading
                aside={
                  binding.previewId === tile.id ? (
                    <StatusLed active label="Preview" tone="spore" />
                  ) : null
                }
              >
                {tile.id === "launcher" ? "Launcher" : "Inbox"}
              </DataListHeading>
              <Screen>
                <DataList density="compact" aria-label={`${tile.id} placement`}>
                  <DataRow>
                    <span>Displayed cell</span>
                    <output>
                      {String(Math.round(frame.x / ((width + gap) / columns)))},{" "}
                      {String(Math.round(frame.y / rowStride))}
                    </output>
                  </DataRow>
                  <DataRow>
                    <span>Displayed span</span>
                    <output>
                      {String(
                        Math.round(
                          (frame.width + gap) / ((width + gap) / columns),
                        ),
                      )}{" "}
                      × {String(Math.round((frame.height + gap) / rowStride))}
                    </output>
                  </DataRow>
                </DataList>
              </Screen>
              <div className="bento-study-controls">
                <Button
                  variant="secondary"
                  aria-label={`Move ${tile.id}`}
                  {...binding.bind(tile.id, "move")}
                >
                  Move
                </Button>
                <Button
                  variant="secondary"
                  aria-label={`Resize ${tile.id}`}
                  {...binding.bind(tile.id, "resize")}
                >
                  Resize
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
