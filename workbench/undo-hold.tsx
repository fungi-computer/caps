import type { Story } from "@ladle/react";
import { useEffect, useId, useState } from "react";

import { Button } from "../src/components/button.js";
import { HoldButton } from "../src/components/hold-button.js";
import { toast, Toaster } from "../src/components/toaster.js";
import { UndoAction } from "../src/components/undo-action.js";
import { toastUndo } from "../src/components/undo-toast.js";

const drafts = ["garden.md", "theme.css", "notes.txt"];

/**
 * Destructive actions without a confirm dialog: Delete waits out a burning
 * undo window (Undo, or Escape), the toast does the same for actions taken
 * elsewhere, and Stop, which nothing can undo, must be held.
 */
export const UndoAndHold: Story = () => {
  const toasterId = useId();
  const [files, setFiles] = useState(drafts);
  const [stopped, setStopped] = useState(false);
  const [log, setLog] = useState("Nothing yet.");
  useEffect(
    () => () => {
      toast.dismiss();
    },
    [],
  );
  return (
    <div className="grid max-w-prose gap-lg p-lg">
      <Toaster id={toasterId} />
      <ul className="grid gap-xs" aria-label="Drafts">
        {files.map((file) => (
          <li
            key={file}
            className="flex items-center justify-between gap-md"
            data-undo-row={file}
          >
            <span className="font-mono text-sm">{file}</span>
            <UndoAction
              armedAnnouncement={`${file} is deleted in 5 seconds.`}
              undoneAnnouncement={`${file} kept.`}
              size="sm"
              variant="ghost"
              onCommit={() => {
                setFiles((current) => current.filter((item) => item !== file));
                setLog(`Deleted ${file}.`);
              }}
            >
              Delete
            </UndoAction>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-md">
        <Button
          data-undo-toast=""
          size="sm"
          variant="outline"
          onClick={() => {
            toastUndo({
              title: "Archived 3 prints",
              description: "They leave the gallery when this runs out.",
              toasterId,
              onCommit: () => {
                setLog("Archived 3 prints.");
              },
              onUndo: () => {
                setLog("Kept 3 prints.");
              },
            });
          }}
        >
          Archive prints
        </Button>
        <HoldButton
          data-hold-demo=""
          disabled={stopped}
          size="sm"
          variant="destructive"
          holdHint="A stopped process cannot be resumed. Press and hold to stop it."
          onConfirm={() => {
            setStopped(true);
            setLog("Stopped node server.js.");
          }}
        >
          {stopped ? "Stopped" : "Stop server"}
        </HoldButton>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setFiles(drafts);
            setStopped(false);
            setLog("Reset.");
          }}
        >
          Reset
        </Button>
      </div>
      <p className="text-sm" role="status">
        {log}
      </p>
    </div>
  );
};
