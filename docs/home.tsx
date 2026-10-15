import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "@fungi.computer/caps/components/button";
import { Status } from "@fungi.computer/caps/components/status";

function SaveBar({ saved }: { saved: boolean }) {
  return (
    <div className="flex items-center gap-md">
      <Status
        label={saved ? "Saved" : "Unsaved"}
        tone={saved ? "success" : "warning"}
      />
      <Button size="sm" disabled={saved}>
        Save
      </Button>
    </div>
  );
}

// In an app, import "@fungi.computer/caps/styles.css" once and mount <SaveBar />.
console.log(renderToStaticMarkup(<SaveBar saved={false} />));
