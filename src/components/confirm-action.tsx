import { useRef, useState } from "react";

import { Button } from "./button.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog.js";
import { Field, FieldError, Form, FormFooter } from "./field.js";
import { HoldButton } from "./hold-button.js";
import { Input } from "./input.js";

/** A deliberate hold, or an exact phrase before a destructive action. */
export type ConfirmActionProps = {
  /** The action's trigger label and dialog title. */
  label: string;
  /** The destructive key's label (and the hold gesture's instruction). */
  confirmLabel: string;
  /** Resolve on success; reject on failure. The component prevents concurrent calls. */
  onConfirm: () => Promise<void>;
  /** Caller-owned, safe-to-display failure copy; rejection details are never displayed. */
  error?: string;
} & ({ mode: "hold"; phrase?: never } | { mode: "type"; phrase: string });

/**
 * Confirms once per gesture, owns pending/result feedback, and keeps failed
 * confirmations available for retry. Type mode closes on success and restores
 * focus through Dialog. A pending action cannot be dismissed or cancelled.
 */
export function ConfirmAction({
  label,
  confirmLabel,
  onConfirm,
  error,
  mode,
  phrase,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | Error>("idle");
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const busy = state === "busy";
  const matches = mode === "hold" || (phrase.length > 0 && typed === phrase);
  const message = busy
    ? undefined
    : error !== undefined && error !== ""
      ? error
      : state instanceof Error
        ? state.message
        : undefined;
  const result = message ? "failed" : state === "done" ? "done" : undefined;

  async function confirm() {
    if (pending.current || !matches) return;
    pending.current = true;
    setState("busy");
    try {
      await onConfirm();
      setState("done");
      setOpen(false);
      setTyped("");
    } catch (cause) {
      setState(
        new Error("Could not confirm the action. Try again.", { cause }),
      );
    } finally {
      pending.current = false;
    }
  }

  if (mode === "hold") {
    return (
      <div className="grid gap-sm">
        <HoldButton
          variant="destructive"
          loading={busy}
          result={result}
          holdHint={confirmLabel}
          onConfirm={() => void confirm()}
        >
          {label}
        </HoldButton>
        <FieldError>{message}</FieldError>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (pending.current) {
          details.cancel();
          return;
        }
        setOpen(next);
        setTyped("");
        setState("idle");
      }}
    >
      <DialogTrigger render={<Button variant="destructive" />}>
        {label}
      </DialogTrigger>
      <DialogContent initialFocus={input}>
        <Form
          busy={busy}
          onSubmit={(event) => {
            event.preventDefault();
            void confirm();
          }}
        >
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              Type the phrase exactly to confirm.
            </DialogDescription>
          </DialogHeader>
          <Field label={`Type ${phrase} to confirm`}>
            <Input
              ref={input}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={typed}
              onChange={(event) => {
                setTyped(event.currentTarget.value);
              }}
            />
          </Field>
          <FormFooter error={message}>
            <DialogClose render={<Button variant="ghost" />} disabled={busy}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              variant="destructive"
              disabled={!matches}
              loading={busy}
              result={result}
            >
              {confirmLabel}
            </Button>
          </FormFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
