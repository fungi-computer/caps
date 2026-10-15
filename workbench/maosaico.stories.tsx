import { ThemeState, useLadleContext, type StoryDefault } from "@ladle/react";
import {
  MaosaicoRoot,
  useMaosaicoItem,
  useMaosaicoLayout,
} from "@fungi.computer/maosaico";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import {
  Columns2,
  FileCode2,
  Folder,
  MessageSquare,
  Moon,
  Plus,
  Scan,
  Sun,
  Terminal,
} from "lucide-react";
import { Button } from "../src/components/button.js";
import { IconButton } from "../src/components/icon-button.js";
import {
  WindowFrame,
  WindowHeader,
  WindowActions,
  WindowBody,
} from "../src/components/window.js";
import { useWindowMotion } from "./window-motion.js";
import { Progress } from "../src/components/progress.js";
import "./maosaico.css";

export default { title: "Layouts" } satisfies StoryDefault;
const navigationSteps = new Map([
  ["ArrowLeft", -1],
  ["ArrowUp", -1],
  ["ArrowRight", 1],
  ["ArrowDown", 1],
]);
const panes = [
  { id: "conversation", title: "Conversation", icon: MessageSquare },
  { id: "files", title: "Files", icon: Folder },
  { id: "preview", title: "Preview", icon: Scan },
  { id: "terminal", title: "Terminal", icon: Terminal },
  { id: "notes", title: "Notes", icon: FileCode2 },
];
type PaneDefinition = (typeof panes)[number];

export function AutomaticTiling() {
  const { globalState } = useLadleContext();
  const dark =
    globalState.theme === ThemeState.Dark ||
    (globalState.theme === ThemeState.Auto &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = dark ? "mocha" : "latte";
  return <AutomaticTilingExample key={theme} initialTheme={theme} />;
}
function AutomaticTilingExample({ initialTheme }: { initialTheme: string }) {
  const [theme, setTheme] = useState(initialTheme);
  const [tiled, setTiled] = useState(true);
  const [open, setOpen] = useState(panes.slice(0, 3));
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setBounds({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  const next = panes.find((pane) => !open.some((item) => item.id === pane.id));
  return (
    <main className="maosaico-demo" data-theme={theme}>
      <header className="maosaico-heading">
        <div>
          <span className="maosaico-eyebrow">CAPS + MAOSAICO</span>
          <h1>A little room to think.</h1>
        </div>
        <IconButton
          aria-label="Switch theme"
          icon={theme === "mocha" ? <Sun /> : <Moon />}
          onClick={() => {
            setTheme(theme === "mocha" ? "latte" : "mocha");
          }}
        />
      </header>
      <MaosaicoRoot
        bounds={bounds}
        tiling={tiled ? { mainSize: 640, gap: 8 } : undefined}
      >
        <Workspace
          canvas={canvas}
          open={open}
          tiled={tiled}
          setTiled={setTiled}
          add={
            next
              ? () => {
                  setOpen([...open, next]);
                }
              : undefined
          }
          close={(id) => {
            setOpen(open.filter((pane) => pane.id !== id));
          }}
        />
      </MaosaicoRoot>
    </main>
  );
}

function Workspace({
  canvas,
  open,
  tiled,
  setTiled,
  add,
  close,
}: {
  canvas: React.RefObject<HTMLDivElement>;
  open: PaneDefinition[];
  tiled: boolean;
  setTiled: (value: boolean) => void;
  add: (() => void) | undefined;
  close: (id: string) => void;
}) {
  const layout = useMaosaicoLayout();
  const addButton = useRef<HTMLButtonElement>(null);
  const focus = (id: string) => {
    layout.focus(id);
    requestAnimationFrame(() =>
      canvas.current
        ?.querySelector<HTMLButtonElement>(
          `[data-pane="${id}"] [data-caps-window-handle]`,
        )
        ?.focus(),
    );
  };
  const zoom = (id: string | null) => {
    layout.zoom(id);
    const target = id ?? layout.activeId;
    if (target) focus(target);
  };
  const keys = (event: KeyboardEvent) => {
    if (!event.altKey) return;
    const active = layout.activeId;
    if (!active) return;
    if (event.key === "Enter") {
      event.preventDefault();
      zoom(layout.zoomedId ? null : active);
      return;
    }
    const step = navigationSteps.get(event.key);
    if (!step) return;
    event.preventDefault();
    const index = layout.order.indexOf(active);
    const next =
      layout.order[(index + step + layout.order.length) % layout.order.length];
    if (!next) return;
    if (event.shiftKey) layout.swap(active, next);
    else focus(next);
  };
  const divider = layout.divider;
  return (
    <div className="maosaico-workspace" onKeyDownCapture={keys}>
      <div className="maosaico-toolbar">
        <div className="maosaico-modes">
          <Button
            size="sm"
            variant={tiled ? "secondary" : "ghost"}
            aria-pressed={tiled}
            onClick={() => {
              setTiled(true);
            }}
          >
            <Columns2 size={14} /> Tiled
          </Button>
          <Button
            size="sm"
            variant={!tiled ? "secondary" : "ghost"}
            aria-pressed={!tiled}
            onClick={() => {
              setTiled(false);
            }}
          >
            Floating
          </Button>
        </div>
        <span className="maosaico-count">{open.length} panes</span>
        <Button
          ref={addButton}
          size="sm"
          variant="ghost"
          disabled={!add}
          onClick={add}
        >
          <Plus size={14} /> Add pane
        </Button>
      </div>
      <nav className="maosaico-tabs" aria-label="Open panes">
        {layout.order.map((id) => {
          const pane = open.find((item) => item.id === id);
          if (!pane) return null;
          const Icon = pane.icon;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={layout.activeId === id}
              onClick={() => {
                focus(id);
              }}
            >
              <Icon size={14} />
              <span>{pane.title}</span>
            </button>
          );
        })}
        {layout.zoomedId && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              zoom(null);
            }}
          >
            Restore layout
          </Button>
        )}
      </nav>
      <div
        ref={canvas}
        className="maosaico-canvas"
        data-layout-mode={layout.mode}
      >
        {open.map((pane, index) => (
          <Pane
            key={pane.id}
            pane={pane}
            index={index}
            interacting={layout.interacting}
            floating={layout.mode === "floating"}
            zoomed={layout.zoomedId === pane.id}
            close={() => {
              const next = layout.order.filter((id) => id !== pane.id).at(-1);
              close(pane.id);
              if (next) focus(next);
              else requestAnimationFrame(() => addButton.current?.focus());
            }}
            zoom={() => {
              zoom(layout.zoomedId === pane.id ? null : pane.id);
            }}
            promote={() => {
              const main = layout.order[0];
              if (main) layout.swap(pane.id, main);
            }}
          />
        ))}
        {divider && (
          <div
            className="maosaico-divider"
            ref={(element) => {
              if (element) Object.assign(element.style, layout.stackingStyle);
            }}
            role="separator"
            aria-label="Main pane width"
            aria-orientation="vertical"
            aria-valuemin={Math.round(divider.min)}
            aria-valuemax={Math.round(divider.max)}
            aria-valuenow={Math.round(divider.position)}
            data-position={divider.position}
            tabIndex={0}
            {...divider.props}
            onKeyDown={(event) => {
              if (event.defaultPrevented) return;
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                return;
              event.preventDefault();
              layout.resizeMain(
                divider.position + (event.key === "ArrowLeft" ? -32 : 32),
              );
            }}
          />
        )}
        {!open.length && (
          <div className="maosaico-empty">
            <Columns2 size={32} />
            <h2>Room for something new.</h2>
            <Button onClick={add}>Open a pane</Button>
          </div>
        )}
      </div>
      <footer className="maosaico-footer">
        <span>
          {layout.zoomedId
            ? "One thing at a time."
            : layout.tabGroups.length
              ? "A smaller space. Everything is still here."
              : "Your work stays put as the space changes."}
        </span>
        <span>
          <kbd>Alt ← →</kbd> focus <kbd>⇧</kbd> swap <kbd>Alt ↵</kbd> zoom
        </span>
      </footer>
    </div>
  );
}

function Pane({
  pane,
  index,
  interacting,
  floating,
  zoomed,
  close,
  zoom,
  promote,
}: {
  pane: PaneDefinition;
  index: number;
  interacting: boolean;
  floating: boolean;
  zoomed: boolean;
  close: () => void;
  zoom: () => void;
  promote: () => void;
}) {
  const binding = useMaosaicoItem({
    id: pane.id,
    frame: { x: 24 + index * 48, y: 24 + index * 40, width: 400, height: 320 },
    minima: { width: 240, height: 160 },
  });
  const element = useWindowMotion(binding, interacting);
  const Icon = pane.icon;
  return (
    <WindowFrame
      ref={element}
      className="absolute left-0 top-0"
      data-pane={pane.id}
      active={binding.active}
      floating={floating && !zoomed}
      hidden={!binding.visible}
      aria-label={pane.title}
      onFocusCapture={binding.focus}
      onPointerDownCapture={binding.focus}
    >
      <WindowHeader
        title={pane.title}
        icon={<Icon />}
        handleProps={{ ...binding.props, onDoubleClick: zoom }}
        actions={
          <WindowActions
            title={pane.title}
            maximized={zoomed}
            {...(floating ? {} : { onPromote: promote })}
            onToggleMaximize={zoom}
            onClose={close}
          />
        }
      />
      <WindowBody tabIndex={0}>
        <PaneContent id={pane.id} />
      </WindowBody>
    </WindowFrame>
  );
}

function PaneContent({ id }: { id: string }): ReactNode {
  const [messages, setMessages] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  if (id === "conversation")
    return (
      <div className="maosaico-chat">
        <div className="maosaico-messages">
          <div className="maosaico-user">
            <span className="maosaico-dot" />
            Let's make a little more space.
          </div>
          <p>
            Everything has a place. Keep the conversation here, open a file
            beside it, and watch your preview take shape.
          </p>
          <p className="maosaico-muted">
            Try adding a pane, dragging the divider, or focusing one thing for a
            while.
          </p>
          <div className="maosaico-tool">
            <span className="maosaico-dot success" />
            <code>workspace · ready</code>
            <span>3 surfaces</span>
          </div>
          {messages.map((text, index) => (
            <div className="maosaico-user" key={index}>
              <span className="maosaico-dot" />
              {text}
            </div>
          ))}
        </div>
        <form
          className="maosaico-composer"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            setMessages([...messages, draft]);
            setDraft("");
          }}
        >
          <textarea
            aria-label="Conversation draft"
            placeholder="Try leaving a draft here…"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            rows={2}
          />
          <div>
            <span>Local workbench</span>
            <Button size="xs" variant="secondary" type="submit">
              Send ↵
            </Button>
          </div>
        </form>
      </div>
    );
  if (id === "files")
    return (
      <div className="maosaico-files">
        <div className="maosaico-file-path">
          <FileCode2 size={14} /> garden.ts
        </div>
        <textarea
          spellCheck={false}
          aria-label="File contents"
          defaultValue={
            '// Something small, growing.\n\nexport const garden = {\n  light: "morning",\n  plants: [\n    "fern",\n    "clover",\n    "mushroom",\n  ],\n};\n'
          }
        />
      </div>
    );
  if (id === "preview")
    return (
      <div className="maosaico-preview">
        <span className="maosaico-eyebrow">A QUIET CORNER</span>
        <div className="maosaico-garden" aria-hidden="true">
          ✳
        </div>
        <h2>Good things take root.</h2>
        <p>
          A home for your ideas,
          <br />
          and a little room to grow.
        </p>
        <Progress aria-label="Garden progress" value={68} max={100} />
        <span className="maosaico-muted">Growing at your own pace</span>
      </div>
    );
  if (id === "terminal")
    return (
      <pre className="maosaico-terminal">
        <span>~/garden</span>
        {"\n\n$ pnpm dev\n\n  Ready in 142 ms\n  Local  localhost:5173\n\n"}
        <span>✓</span>
        {" Everything is up to date.\n\n❯ "}
      </pre>
    );
  return (
    <textarea
      className="maosaico-notes"
      aria-label="Notes"
      placeholder="A thought worth keeping…"
      defaultValue={
        "A room with a view.\n\n- Keep the small things simple.\n- Leave space for what comes next."
      }
    />
  );
}
