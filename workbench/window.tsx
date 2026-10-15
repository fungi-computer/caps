import type { Story } from "@ladle/react";
import {
  MaosaicoRoot,
  useMaosaicoItem,
  useMaosaicoLayout,
} from "@fungi.computer/maosaico";
import { FilePenLine } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../src/components/button.js";
import {
  WindowFrame,
  WindowHeader,
  WindowActions,
  WindowBody,
  WindowSnapPreview,
} from "../src/components/window.js";
import { useWindowMotion } from "./window-motion.js";
import "./status.css";
import "./window.css";

export const Window: Story = () => {
  const [floating, setFloating] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [closed, setClosed] = useState(false);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const canvas = useRef<HTMLDivElement>(null);
  const reopen = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setBounds({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
    });
    observer.observe(canvas.current);
    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <main className="status-study" data-conformance="window">
      <section
        className="status-study-stage window-study-stage"
        aria-label="Window preview"
      >
        <span className="status-study-caption">
          One shell / host-owned behavior
        </span>
        <div className="window-study-canvas" ref={canvas}>
          <MaosaicoRoot
            bounds={bounds}
            containerRef={canvas}
            tiling={floating ? undefined : { gap: 0 }}
          >
            {!closed && (
              <WindowPreview
                minimized={minimized}
                floating={floating}
                toggleFloating={() => {
                  setFloating(!floating);
                }}
                minimize={() => {
                  setMinimized(true);
                  requestAnimationFrame(() => reopen.current?.focus());
                }}
                close={() => {
                  setClosed(true);
                  requestAnimationFrame(() => reopen.current?.focus());
                }}
              />
            )}
            <SnapPreview />
          </MaosaicoRoot>
          {(closed || minimized) && (
            <div className="window-study-empty">
              <p>
                {closed
                  ? "Closed. Open a fresh scratchpad."
                  : "Minimized. Your draft is still here."}
              </p>
              <Button
                ref={reopen}
                size="sm"
                variant="secondary"
                onClick={() => {
                  setClosed(false);
                  setMinimized(false);
                  requestAnimationFrame(() =>
                    canvas.current
                      ?.querySelector<HTMLButtonElement>(
                        "[data-caps-window-handle]",
                      )
                      ?.focus(),
                  );
                }}
              >
                {closed ? "Open scratchpad" : "Restore scratchpad"}
              </Button>
            </div>
          )}
        </div>
        <span className="status-study-hint">
          Float it. Drag the title. Zoom. Your draft stays put.
        </span>
      </section>
      <section className="window-study-notes">
        <div>
          <h2>Familiar controls. One shared frame.</h2>
          <p>
            Float / tile, zoom / restore, minimize, close. Double-click the
            title to zoom.
          </p>
        </div>
        <p>
          Caps owns the surface and controls. Maosaico owns these rectangles.
          Your application owns what opens and closes.
        </p>
        <a href="?story=layouts--automatic-tiling">
          See the same pieces in Automatic tiling →
        </a>
      </section>
      <pre className="status-study-code">
        <code>
          {
            '<WindowFrame active={active} floating={floating}>\n  <WindowHeader title="Scratchpad" icon={<FilePenLine />}\n    handleProps={dragHandleProps}\n    actions={<WindowActions title="Scratchpad" onClose={close} />}\n  />\n  <WindowBody>{children}</WindowBody>\n</WindowFrame>'
          }
        </code>
      </pre>
    </main>
  );
};

function SnapPreview() {
  const { snapPreview } = useMaosaicoLayout();
  if (!snapPreview) return null;
  const { x, y, width, height } = snapPreview.frame;
  const style: CSSProperties & Record<`--snap-${string}`, string> = {
    "--snap-x": `${String(x)}px`,
    "--snap-y": `${String(y)}px`,
    "--snap-width": `${String(width)}px`,
    "--snap-height": `${String(height)}px`,
  };
  return (
    <div className="window-study-snap" style={style}>
      <WindowSnapPreview />
    </div>
  );
}

function WindowPreview({
  minimized,
  floating,
  toggleFloating,
  minimize,
  close,
}: {
  minimized: boolean;
  floating: boolean;
  toggleFloating: () => void;
  minimize: () => void;
  close: () => void;
}) {
  const binding = useMaosaicoItem(
    {
      id: "scratchpad",
      frame: { x: 24, y: 24, width: 440, height: 280 },
      minima: { width: 240, height: 180 },
    },
    { participating: !minimized },
  );
  const layout = useMaosaicoLayout();
  const element = useWindowMotion(binding, layout.interacting);
  const zoomed = layout.zoomedId === "scratchpad";
  const zoom = () => {
    layout.zoom(zoomed ? null : "scratchpad");
  };
  return (
    <WindowFrame
      ref={element}
      className="absolute left-0 top-0"
      aria-label="Scratchpad"
      active={binding.active}
      floating={floating && !zoomed}
      hidden={!binding.visible}
      onFocusCapture={binding.focus}
      onPointerDownCapture={binding.focus}
    >
      <WindowHeader
        title="Scratchpad"
        icon={<FilePenLine />}
        handleProps={{ ...binding.props, onDoubleClick: zoom }}
        actions={
          <WindowActions
            title="Scratchpad"
            floating={floating}
            maximized={zoomed}
            onToggleFloating={() => {
              layout.zoom(null);
              toggleFloating();
            }}
            onToggleMaximize={zoom}
            onMinimize={minimize}
            onClose={close}
          />
        }
      />
      <WindowBody>
        <div className="window-study-document">
          <label htmlFor="window-draft">A little room to think.</label>
          <p>
            A native editor inside a quiet shell. Nothing remounts when the
            layout changes.
          </p>
          <textarea
            id="window-draft"
            aria-label="Scratchpad draft"
            defaultValue={
              "Make something worth keeping.\n\nTry moving this window with a few words in here."
            }
          />
        </div>
      </WindowBody>
    </WindowFrame>
  );
}
