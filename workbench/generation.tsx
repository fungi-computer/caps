import type { Story } from "@ladle/react";
import { useState } from "react";

import { Button } from "../src/components/button.js";
import {
  GenerationFrame,
  type GenerationStatus,
} from "../src/components/generation-frame.js";
import { SendAction } from "../src/components/send-action.js";
import { Textarea } from "../src/components/textarea.js";

const sample =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c28b"/><stop offset="1" stop-color="#7aa6c9"/></linearGradient></defs><rect width="400" height="300" fill="url(#s)"/><circle cx="290" cy="110" r="38" fill="#fff4de"/><path d="M0 220 Q100 170 200 210 T400 200 V300 H0Z" fill="#3d5a6c"/></svg>',
  );

/**
 * GenerationFrame from queued to done (or failed): the frame never changes
 * size, the picture develops inside it, and a failure dims behind a retry.
 * Press Generate to walk the whole run; turn on Fail to end in failure.
 */
export const GenerationRun: Story = () => {
  const [status, setStatus] = useState<GenerationStatus>("queued");
  const [fails, setFails] = useState(false);
  const run = () => {
    setStatus("queued");
    setTimeout(() => {
      setStatus("generating");
    }, 500);
    setTimeout(() => {
      setStatus(fails ? "failed" : "refining");
    }, 1700);
    if (!fails)
      setTimeout(() => {
        setStatus("done");
      }, 2300);
  };
  return (
    <div className="grid max-w-prose gap-md p-lg">
      <div className="flex flex-wrap items-center gap-sm">
        <Button data-generation-run="" size="sm" onClick={run}>
          Generate
        </Button>
        <Button
          data-generation-fail=""
          size="sm"
          variant="outline"
          onClick={() => {
            setFails((value) => !value);
          }}
        >
          {fails ? "Fail: on" : "Fail: off"}
        </Button>
        <span className="text-sm">{status}</span>
      </div>
      <GenerationFrame
        aspectRatio={4 / 3}
        data-generation-frame=""
        status={status}
        failure={
          <>
            <span className="text-sm">The Computer refused this image.</span>
            <Button size="sm" variant="outline" onClick={run}>
              Retry
            </Button>
          </>
        }
      >
        <img alt="A generated harbour at dawn" src={sample} />
      </GenerationFrame>
    </div>
  );
};

/**
 * SendAction: empty rests disabled, text wakes it with a pop, sending
 * launches the arrow (a stop square when the work can be stopped), and the
 * arrow drops back when the work ends.
 */
export const SendStates: Story = () => {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [stoppable, setStoppable] = useState(false);
  const state = busy ? "busy" : draft.trim() === "" ? "empty" : "ready";
  return (
    <div className="grid max-w-prose gap-md p-lg">
      <Button
        data-send-stoppable=""
        size="sm"
        variant="outline"
        onClick={() => {
          setStoppable((value) => !value);
        }}
      >
        {stoppable ? "Stoppable: on" : "Stoppable: off"}
      </Button>
      <div className="flex items-end gap-sm">
        <Textarea
          aria-label="Prompt"
          data-send-draft=""
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
        />
        <SendAction
          aria-label="Send"
          data-send-demo=""
          state={state}
          onClick={() => {
            setBusy(true);
            setTimeout(() => {
              setBusy(false);
            }, 1600);
          }}
          onStop={
            stoppable
              ? () => {
                  setBusy(false);
                }
              : undefined
          }
        />
      </div>
    </div>
  );
};
