// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { FailureLine } from "../components/failure-line.js";
import { SetupNotice } from "./setup-notice.js";

afterEach(cleanup);

describe("SetupNotice", () => {
  it.each(["panel", "banner", "inline"] as const)(
    "names the need, cause and fix in the %s variant",
    (variant) => {
      const onSelect = vi.fn();
      const onSecondary = vi.fn();
      const view = render(
        <SetupNotice
          available="Uploads work now."
          cause="No model is connected."
          fix={{ label: "Sign in with Fungi", onSelect }}
          need="Connect a model to start chatting"
          secondary={{ label: "Add a model key", onSelect: onSecondary }}
          variant={variant}
        />,
      );
      const text = view.container.textContent;
      expect(text).toContain("Connect a model to start chatting");
      expect(text).toContain("No model is connected.");
      expect(text).toContain("Uploads work now.");
      const buttons = [...view.container.querySelectorAll("button")];
      const fix = requireValue(
        buttons.find((b) => b.textContent === "Sign in with Fungi"),
        "fix button",
      );
      fix.click();
      requireValue(
        buttons.find((b) => b.textContent === "Add a model key"),
        "secondary button",
      ).click();
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSecondary).toHaveBeenCalledOnce();
    },
  );

  it.each(["panel", "banner", "inline"] as const)(
    "shows Waiting for {need} with a busy button while pending (%s)",
    (variant) => {
      const view = render(
        <SetupNotice
          cause="c"
          fix={{ label: "Sign in", onSelect: () => undefined, pending: true }}
          need="n"
          variant={variant}
          waitingFor="a model"
        />,
      );
      const busy = requireValue(
        view.container.querySelector("button[aria-busy=true]"),
        "busy fix",
      );
      expect(busy.textContent).toContain("Waiting for a model…");
    },
  );
});

describe("SetupNotice visual", () => {
  it("shows the App's own glyph instead of the warning bead in a panel", () => {
    const view = render(
      <SetupNotice
        cause="c"
        fix={{ label: "Fix", onSelect: () => undefined }}
        need="n"
        variant="panel"
        visual={<svg data-testid="own" />}
      />,
    );
    expect(view.container.querySelector("[data-testid=own]")).toBeTruthy();
    expect(view.container.querySelector(".caps-setup-notice-dot")).toBeNull();
  });
});

describe("FailureLine", () => {
  it("renders one line with labelled Retry and Dismiss and no bang", () => {
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    const view = render(
      <FailureLine
        message="The model refused the request."
        onDismiss={onDismiss}
        onRetry={onRetry}
      />,
    );
    const buttons = [...view.container.querySelectorAll("button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["Retry", "Dismiss"]);
    buttons[0]?.click();
    buttons[1]?.click();
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(view.container.querySelector("[data-glyph=bang]")).toBeNull();
    expect(view.container.textContent).not.toContain("Failed");
  });

  it("says Failed {n} times once, honours labels and density", () => {
    const view = render(
      <FailureLine
        count={3}
        density="tile"
        dismissLabel="Hide"
        message="Could not make the image."
        onDismiss={() => undefined}
        onRetry={() => undefined}
        retryLabel="Try again"
      />,
    );
    expect(view.container.textContent.match(/Failed 3 times/g)).toHaveLength(1);
    expect(view.container.textContent).toContain("Try again");
    expect(view.container.textContent).toContain("Hide");
    expect(
      view.container
        .querySelector(".caps-failure-line")
        ?.getAttribute("data-density"),
    ).toBe("tile");
  });

  it("omits the count for a single failure and actions when none are given", () => {
    const view = render(<FailureLine count={1} message="Nope." />);
    expect(view.container.textContent).not.toContain("Failed");
    expect(view.container.querySelector("button")).toBeNull();
  });
});
