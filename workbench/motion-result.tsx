import type { Story } from "@ladle/react";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Alert } from "../src/components/alert.js";
import { Button, type ButtonResult } from "../src/components/button.js";
import { Field } from "../src/components/field.js";
import { IconButton } from "../src/components/icon-button.js";
import { Input } from "../src/components/input.js";
import { Collapse, Presence, Swap } from "../src/components/presence.js";
import { Skeleton } from "../src/components/skeleton.js";
import { Switch } from "../src/components/switch.js";

/** A fake action: pending for a moment, then done or failed. */
function useAction(fails: boolean) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ButtonResult | undefined>();
  const run = () => {
    setPending(true);
    setResult(undefined);
    setTimeout(() => {
      setPending(false);
      setResult(fails ? "failed" : "done");
    }, 700);
  };
  return { pending, result, run };
}

/**
 * Button `result`: a finished action checks and holds, then settles; a
 * refused one shakes. Press any button; turn on "Refuse" to see failure.
 */
export const ResultBeat: Story = () => {
  const [fails, setFails] = useState(false);
  const install = useAction(fails);
  const save = useAction(fails);
  const icon = useAction(fails);
  return (
    <div className="grid gap-lg p-lg">
      <label className="flex items-center gap-sm">
        <Switch
          checked={fails}
          onCheckedChange={setFails}
          data-beat-refuse=""
        />
        Refuse the next action
      </label>
      <div className="flex flex-wrap items-center gap-md">
        <Button
          data-beat-demo="install"
          loading={install.pending}
          onClick={install.run}
          result={install.result}
          resultLabel="Installed"
        >
          {install.pending ? "Installing" : "Install"}
        </Button>
        <Button
          data-beat-demo="save"
          loading={save.pending}
          onClick={save.run}
          result={save.result}
          variant="secondary"
        >
          Save changes
        </Button>
        <IconButton
          aria-label="Save file"
          data-beat-demo="icon"
          icon={<Save />}
          disabled={icon.pending}
          onClick={icon.run}
          result={icon.result}
          size="sm"
          variant="outline"
        />
      </div>
    </div>
  );
};

type SaveStatus = "Unsaved" | "Saving…" | "Saved";
const nextStatus = {
  Unsaved: "Saving…",
  "Saving…": "Saved",
  Saved: "Unsaved",
} as const satisfies Record<SaveStatus, SaveStatus>;

/**
 * Presence (arrive and leave), Collapse (open and close space) and Swap
 * (crossfade one content for another), each driven by the theme's motion.
 */
export const PresenceCollapseSwap: Story = () => {
  const [shown, setShown] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("Unsaved");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded) return;
    const back = setTimeout(() => {
      setLoaded(false);
    }, 2400);
    return () => {
      clearTimeout(back);
    };
  }, [loaded]);
  return (
    <div className="grid max-w-prose gap-lg p-lg">
      <div className="flex flex-wrap gap-sm">
        <Button
          data-presence-toggle=""
          size="sm"
          variant="outline"
          onClick={() => {
            setShown((value) => !value);
          }}
        >
          {shown ? "Dismiss notice" : "Show notice"}
        </Button>
        <Button
          data-collapse-toggle=""
          size="sm"
          variant="outline"
          onClick={() => {
            setError((value) => !value);
          }}
        >
          {error ? "Fix the name" : "Break the name"}
        </Button>
        <Button
          data-swap-step=""
          size="sm"
          variant="outline"
          onClick={() => {
            setStatus((value) => nextStatus[value]);
          }}
        >
          Next status
        </Button>
        <Button
          data-swap-load=""
          size="sm"
          variant="outline"
          onClick={() => {
            setLoaded(true);
          }}
        >
          Load
        </Button>
      </div>
      <Presence show={shown}>
        <Alert
          title="Browsing only"
          description="You can look around, but this Team has not allowed installs."
          tone="info"
        />
      </Presence>
      <Field
        label="Computer name"
        error={error ? "Names use letters, digits and dashes." : undefined}
      >
        <Input defaultValue={error ? "my computer!" : "my-computer"} />
      </Field>
      <Collapse open={error}>
        <p className="text-sm">
          Collapse is the same motion for any inserted block.
        </p>
      </Collapse>
      <div className="flex items-center gap-sm text-sm">
        <span>Status:</span>
        <Swap swapKey={status}>{status}</Swap>
      </div>
      <Swap swapKey={loaded ? "loaded" : "loading"}>
        {loaded ? (
          <p>
            Three files changed since you last opened this Computer. The newest
            is notes/garden.md.
          </p>
        ) : (
          <div className="grid gap-xs" aria-label="Loading">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
      </Swap>
    </div>
  );
};
