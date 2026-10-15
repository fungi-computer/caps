import type { StoryDefault } from "@ladle/react";
import { useState } from "react";
import { Sprite } from "@fungi.computer/sprite/react";
import { createSprite } from "@fungi.computer/sprite";
import {
  Activity,
  BookOpen,
  FlaskConical,
  MessageSquarePlus,
  Palette,
  SquarePen,
  Terminal,
} from "lucide-react";
import { AppBar, type AppBarItem } from "../src/blocks/app-bar.js";
import "./status.css";
import "./app-bar.css";
import "./app-bar-edge.css";

const spriteService = createSprite({
  characters: {
    mushroom: async () =>
      (await import("@fungi.computer/sprite-zdog/mushroom")).default,
  },
});

const apps = [
  {
    id: "terminal",
    label: "Terminal",
    icon: <Terminal className="text-info" />,
  },
  {
    id: "library",
    label: "Library",
    icon: <BookOpen className="text-warning" />,
  },
  {
    id: "activity",
    label: "Activity",
    icon: <Activity className="text-success" />,
  },
  {
    id: "editor",
    label: "Editor",
    icon: <SquarePen className="text-accent" />,
  },
  { id: "lab", label: "Lab", icon: <FlaskConical className="text-warning" /> },
  {
    id: "studio",
    label: "Studio",
    icon: <Palette className="text-info" />,
  },
];

export const WorkbenchNavigation = () => {
  const [active, setActive] = useState("terminal");
  const [running, setRunning] = useState(["terminal", "library"]);
  const [chats, setChats] = useState<number[]>([]);
  const [message, setMessage] = useState("Terminal is active.");
  const catalog = [
    ...apps,
    ...chats.map((number) => ({
      id: `chat-${String(number)}`,
      label: `Chat ${String(number)}`,
      icon: <MessageSquarePlus className="text-secondary" />,
    })),
  ];
  const select = (id: string, label: string) => {
    setRunning((current) =>
      current.includes(id) ? current : [...current, id],
    );
    setActive(id);
    setMessage(`${label} is active.`);
  };
  const windows: AppBarItem[] = running.flatMap((id) => {
    const app = catalog.find((entry) => entry.id === id);
    return app
      ? [
          {
            ...app,
            active: active === id,
            onSelect: () => {
              select(id, app.label);
            },
            onClose: () => {
              setRunning((current) => current.filter((entry) => entry !== id));
              if (active === id)
                setActive(running.find((entry) => entry !== id) ?? "");
              setMessage(
                `${app.label} closed. You can reopen it on the right.`,
              );
            },
          },
        ]
      : [];
  });
  return (
    <main className="app-bar-study">
      <section
        className="status-study-stage app-bar-study-stage"
        aria-label="App bar preview"
      >
        <div className="app-bar-study-copy">
          <h2>Team, apps, and recent sessions.</h2>
          <p>A quiet speed dial, with open work close at hand.</p>
          <output aria-live="polite">{message}</output>
        </div>
        <AppBar
          windows={windows}
          launchers={catalog
            .filter((app) => !running.includes(app.id))
            .map((app) => ({
              ...app,
              onSelect: () => {
                select(app.id, app.label);
              },
            }))}
          sessions={[
            {
              id: "session-seed-library",
              label: "Sketching the seed library",
              icon: <BookOpen aria-hidden="true" />,
              onSelect: () => {
                setMessage("Seed-library session selected.");
              },
            },
            {
              id: "session-courtyard",
              label: "A planting plan for the courtyard",
              icon: <MessageSquarePlus aria-hidden="true" />,
              onSelect: () => {
                setMessage("Courtyard session selected.");
              },
            },
          ]}
          emptyLabel="All apps are already open."
          launcher={{
            label: "Open apps",
            icon: (
              <Sprite
                activity="idle"
                aria-hidden="true"
                expression="normal"
                service={spriteService}
                src={{ local: "mushroom" }}
                className="app-bar-study-mascot"
              />
            ),
          }}
          primaryAction={{
            label: "New chat",
            icon: <MessageSquarePlus />,
            onSelect: () => {
              const number = chats.length + 1;
              setChats((current) => [...current, number]);
              select(`chat-${String(number)}`, `Chat ${String(number)}`);
            },
          }}
        />
      </section>
      <p className="app-bar-study-instructions">
        Open the launcher to browse Team Apps and Recent Sessions. Use Tab to
        reach each item; Escape closes the dial.
      </p>
    </main>
  );
};

export default { title: "Layouts" } satisfies StoryDefault;

/** The host anchors the bar; Base UI flips both disclosures at the viewport edge. */
export function ViewportEdge() {
  const [message, setMessage] = useState("Waiting");
  return (
    <section
      className="caps-dial-edge-study"
      aria-label="Dial at viewport edge"
    >
      <output aria-label="Dial edge result">{message}</output>
      <AppBar
        windows={[]}
        launchers={[
          {
            id: "library",
            label: "Library",
            icon: <BookOpen />,
            onSelect: () => {
              setMessage("Library selected");
            },
          },
        ]}
        launcher={{ label: "Edge Apps" }}
        primaryAction={{
          label: "New chat",
          icon: <MessageSquarePlus />,
          onSelect: () => {
            setMessage("Chat selected");
          },
        }}
      />
    </section>
  );
}
