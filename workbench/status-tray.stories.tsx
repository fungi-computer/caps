import type { Story, StoryDefault } from "@ladle/react";
import { Plug, RefreshCw, SquareTerminal } from "lucide-react";
import { useState } from "react";
import {
  StatusTray,
  StatusTrayList,
  StatusTrayNote,
  StatusTrayRow,
} from "../src/blocks/status-tray.js";
import { Button } from "../src/components/button.js";
import { IconButton } from "../src/components/icon-button.js";
import { KeycapButton } from "../src/components/keycap.js";
import { Status } from "../src/components/status.js";
import { Display } from "../src/components/surface.js";
import "./status-tray.css";

export default { title: "Blocks / Status tray" } satisfies StoryDefault;

function Example({
  theme,
  finish = false,
  placement = "housing",
  initialTray = "ports",
  unavailable = false,
}: {
  theme: string;
  initialTray?: string;
  unavailable?: boolean;
  finish?: boolean;
  placement?: "housing" | "screen";
}) {
  const [openId, setOpenId] = useState<string | null>(initialTray);
  const [ports, setPorts] = useState([5173, 3000, 8787]);
  const [, setRefreshes] = useState(0);
  const [processes, setProcesses] = useState([
    { pid: 1842, name: "bun dev", uptime: "12:48" },
    { pid: 1906, name: "vite", uptime: "12:46" },
    { pid: 721, name: "postgres", uptime: "02:14:09" },
  ]);
  const tray = (
    <StatusTray
      openId={openId}
      onOpenChange={setOpenId}
      placement={placement}
      leading={<Status label="Open" tone="success" size="compact" />}
      items={[
        {
          id: "ports",
          label: "Ports",
          count: ports.length,
          tone: "success",
          actions: (
            <IconButton
              aria-label="Refresh ports"
              icon={<RefreshCw aria-hidden="true" />}
              onClick={() => {
                setRefreshes((value) => value + 1);
              }}
            />
          ),
          content: ports.length ? (
            <StatusTrayList>
              {ports.map((port) => (
                <StatusTrayRow
                  key={port}
                  icon={<Plug aria-hidden="true" size={16} />}
                  primary={`:${String(port)}`}
                  secondary="Exposed · preview ready"
                  actions={
                    <>
                      <Button variant="ghost" size="xs">
                        Open
                      </Button>
                      <Button
                        variant="ghost-destructive"
                        size="xs"
                        onClick={() => {
                          setPorts((items) =>
                            items.filter((value) => value !== port),
                          );
                        }}
                      >
                        Stop
                      </Button>
                    </>
                  }
                />
              ))}
            </StatusTrayList>
          ) : (
            <StatusTrayNote>No exposed ports.</StatusTrayNote>
          ),
        },
        {
          id: "processes",
          label: "Processes",
          count: unavailable ? 0 : processes.length,
          tone: unavailable ? "neutral" : "success",
          actions: (
            <IconButton
              aria-label="Refresh processes"
              icon={<RefreshCw aria-hidden="true" />}
              onClick={() => {
                setRefreshes((value) => value + 1);
              }}
            />
          ),
          content: unavailable ? (
            <StatusTrayNote title="Unavailable">
              This Computer can’t list its processes yet.
            </StatusTrayNote>
          ) : processes.length ? (
            <StatusTrayList>
              {processes.map((process) => (
                <StatusTrayRow
                  key={process.pid}
                  icon={<SquareTerminal aria-hidden="true" size={16} />}
                  primary={process.name}
                  secondary={`PID ${String(process.pid)} · up ${process.uptime}`}
                  actions={
                    <Button
                      variant="ghost-destructive"
                      size="xs"
                      onClick={() => {
                        setProcesses((items) =>
                          items.filter((item) => item.pid !== process.pid),
                        );
                      }}
                    >
                      Stop
                    </Button>
                  }
                />
              ))}
            </StatusTrayList>
          ) : (
            <StatusTrayNote>No running processes.</StatusTrayNote>
          ),
        },
        {
          id: "unavailable",
          label: "Logs",
          disabled: true,
          accessibleLabel: "Logs unavailable on this Computer",
          content: null,
        },
      ]}
    />
  );
  return (
    <section
      className="caps-tray-story"
      data-theme={theme}
      data-finish={finish ? "instrument" : undefined}
    >
      <h2>
        {theme}
        {finish ? " / nested finish" : ""}
      </h2>
      <Display>
        <div className="caps-tray-story-readout">
          <p>COMPUTER / WORKSPACE</p>
          <p>Server ready on :5173</p>
        </div>
        {placement === "screen" ? tray : null}
      </Display>
      {placement === "housing" ? tray : null}
    </section>
  );
}

/** Theme is an open Stipe theme name, including Daisy's full catalog. */
export const Housing: Story<{ theme: string }> = ({ theme }) => (
  <Example theme={theme} />
);
Housing.args = { theme: "latte" };
Housing.argTypes = { theme: { control: { type: "text" } } };

export const Mocha = () => <Example theme="mocha" />;
export const FieldGuide = () => <Example theme="field-guide" />;
export const FieldGuideNight = () => <Example theme="field-guide-night" />;
export const Phosphor = () => <Example theme="phosphor" />;
export const Codec = () => <Example theme="codec" />;
export const Screen = () => <Example theme="phosphor" placement="screen" />;
/** The same component with nested token values; no component style prop. */
export const NestedFinish = () => <Example theme="latte" finish />;

export const Processes = () => (
  <Example theme="latte" initialTray="processes" />
);
export const ProcessesUnavailable = () => (
  <Example theme="latte" initialTray="processes" unavailable />
);

/** A host interleaves its own controls between chips with `after`. */
export const Interleaved = () => {
  const [openId, setOpenId] = useState<string | null>("activity");
  return (
    <section className="caps-tray-story" data-theme="latte">
      <h2>latte / interleaved</h2>
      <Display>
        <div className="caps-tray-story-readout" />
      </Display>
      <StatusTray
        align="start"
        openId={openId}
        onOpenChange={setOpenId}
        items={[
          {
            id: "folder",
            label: "media",
            content: <StatusTrayNote>Prints save to media.</StatusTrayNote>,
            after: <KeycapButton label="Upload" />,
          },
          {
            id: "activity",
            label: "Activity",
            count: 2,
            tone: "warning",
            content: (
              <StatusTrayNote title="2 notices">
                Models unavailable. One upload was skipped.
              </StatusTrayNote>
            ),
            after: <KeycapButton tone="primary" label="Send" />,
          },
        ]}
      />
    </section>
  );
};
