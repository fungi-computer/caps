import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Alert } from "./alert.js";
import { Button } from "./button.js";
import { Fuse } from "./undo-action.js";

/** What an undo toast says and does. */
export type UndoToastOptions = Readonly<{
  title: ReactNode;
  description?: ReactNode;
  /** Runs when the toast's fuse burns out: the action happens then. */
  onCommit: () => void;
  /** Runs when the person undoes, by the button or Escape. */
  onUndo?: () => void;
  undoLabel?: string;
  /** The undo window in milliseconds. */
  undoMs?: number;
  /** The Toaster to show it on, when a page has more than one. */
  toasterId?: string;
}>;

function UndoToast({
  dismiss,
  options,
}: {
  dismiss: () => void;
  options: UndoToastOptions;
}) {
  const [held, setHeld] = useState(false);
  const [settled, setSettled] = useState(false);
  const undo = () => {
    if (settled) return;
    setSettled(true);
    options.onUndo?.();
    dismiss();
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || settled) return;
      setSettled(true);
      options.onUndo?.();
      dismiss();
    };
    globalThis.addEventListener("keydown", onKey);
    return () => {
      globalThis.removeEventListener("keydown", onKey);
    };
  }, [settled, options, dismiss]);
  return (
    <div
      className="caps-undo-toast"
      onPointerEnter={() => {
        setHeld(true);
      }}
      onPointerLeave={() => {
        setHeld(false);
      }}
      onFocus={() => {
        setHeld(true);
      }}
      onBlur={() => {
        setHeld(false);
      }}
    >
      <Alert
        title={options.title}
        description={options.description}
        tone="info"
        action={
          <Button size="sm" variant="outline" onClick={undo}>
            {options.undoLabel ?? "Undo"}
          </Button>
        }
      />
      <Fuse
        duration={options.undoMs ?? 5000}
        paused={held}
        onBurnt={() => {
          if (settled) return;
          setSettled(true);
          options.onCommit();
          dismiss();
        }}
      />
    </div>
  );
}

/**
 * Show a done-and-undoable toast: the action is deferred while a fuse burns
 * along the toast's edge, Undo or Escape cancels it, and resting on the toast
 * holds the fuse. Returns the toast id.
 */
export function toastUndo(options: UndoToastOptions): string | number {
  const settings: Parameters<typeof toast.custom>[1] = { duration: Infinity };
  if (options.toasterId !== undefined) settings.toasterId = options.toasterId;
  return toast.custom(
    (id) => (
      <UndoToast
        options={options}
        dismiss={() => {
          toast.dismiss(id);
        }}
      />
    ),
    settings,
  );
}
