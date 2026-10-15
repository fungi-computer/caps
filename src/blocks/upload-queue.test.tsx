// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { UploadQueue } from "./upload-queue.js";

afterEach(cleanup);

const failedName = "an-intentionally-long-filename-that-remains-readable.png";
const noOp = () => undefined;

describe("UploadQueue", () => {
  it("keeps unknown transfer progress indeterminate", () => {
    const view = render(
      <UploadQueue
        items={[
          {
            id: "pending",
            name: "image.png",
            preview: { kind: "file" },
            progress: null,
            progressLabel: "",
            statusLabel: "Sending",
            actions: {},
          },
        ]}
        onCancel={noOp}
        onRemove={noOp}
        onRetry={noOp}
      />,
    );
    expect(
      view.container.querySelector("progress")?.hasAttribute("value"),
    ).toBe(false);
  });
  it("keeps generic row facts and routes labelled retry/cancel/remove actions", () => {
    const queue = renderActionQueue();
    expectQueueFacts(queue.view);
    clickQueueActions(queue);
  });

  it("law: an image thumbnail is decorative while its row keeps named facts", () => {
    const queue = renderActionQueue();

    expectQueueFacts(queue.view);
  });

  it("renders empty, partial, and complete accessible progress bars", () => {
    const view = render(
      <UploadQueue
        items={[0, 37, 100].map((progress) => ({
          actions: {},
          id: String(progress),
          name: `${String(progress)}.bin`,
          preview: { kind: "file" as const },
          progress,
          progressLabel: `${String(progress)}%`,
          statusLabel: "Uploading",
        }))}
        onCancel={noOp}
        onRemove={noOp}
        onRetry={noOp}
      />,
    );
    expect(
      [...view.container.querySelectorAll("progress")].map((bar) => bar.value),
    ).toEqual([0, 37, 100]);
  });

  it("uses a contained responsive row with a truncation column and wrapping actions", () => {
    const { view } = renderActionQueue();
    const root = requireValue(
      view.container.querySelector("[data-upload-rows]"),
      "UploadQueue rows",
    );
    const row = requireValue(root.children.item(0), "UploadQueue first row");
    const filename = requireValue(
      row.querySelector("[title]"),
      "UploadQueue filename",
    );
    const actions = requireValue(
      row.querySelector(".caps-upload-actions"),
      "UploadQueue action group",
    );

    expect(root.className).toContain("flex-col");
    expect(root.className).toContain("min-w-0");
    expect(row.className).toContain("grid-cols-[2rem_minmax(0,1fr)_auto]");
    expect(filename.className).toContain("block");
    expect(filename.className).toContain("truncate");
    expect(actions.className).toContain("flex-wrap");
  });
});

function clickQueueActions({
  onCancel,
  onRemove,
  onRetry,
  view,
}: ReturnType<typeof renderActionQueue>) {
  view.container
    .querySelector<HTMLButtonElement>(
      `[aria-label="Retry attachment ${failedName}"]`,
    )
    ?.click();
  view.container
    .querySelector<HTMLButtonElement>(
      '[aria-label="Cancel attachment pending.bin"]',
    )
    ?.click();
  view.container
    .querySelector<HTMLButtonElement>(
      `[aria-label="Remove attachment ${failedName}"]`,
    )
    ?.click();
  expect(onRetry).toHaveBeenCalledWith("failed");
  expect(onCancel).toHaveBeenCalledWith("pending");
  expect(onRemove).toHaveBeenCalledWith("failed");
}

function expectQueueFacts(view: ReturnType<typeof render>) {
  expect(view.queryBySelector(".queue")).not.toBeNull();
  expect(view.queryBySelector('[role="alert"]')?.textContent).toContain(
    "Failed: network down",
  );
  expect(view.queryBySelector("[data-upload-status]")?.textContent).toContain(
    "42%",
  );
  expect(view.container.querySelector('progress[value="42"]')).not.toBeNull();
  expect(view.queryBySelector("img")?.getAttribute("alt")).toBe("");
  const filename = requireValue(
    view.container.querySelector("[title]"),
    "UploadQueue filename",
  );
  expect(filename.textContent).toContain("an-intentionally-long");
  expect(filename.className).toContain("truncate");
  expect(filename.getAttribute("title")).toContain("long-filename");
  expect(
    view.container.querySelector(
      `[aria-label="Retry attachment ${failedName}"]`,
    )?.className,
  ).toContain("motion-reduce:transition-none");
}

function renderActionQueue() {
  const onCancel = vi.fn();
  const onRemove = vi.fn();
  const onRetry = vi.fn();
  return {
    onCancel,
    onRemove,
    onRetry,
    view: render(
      <UploadQueue
        className="queue"
        items={[
          {
            actions: {
              remove: {
                accessibleLabel: `Remove attachment ${failedName}`,
                label: "Remove",
              },
              retry: {
                accessibleLabel: `Retry attachment ${failedName}`,
                label: "Retry",
              },
            },
            alert: "Failed: network down",
            id: "failed",
            name: failedName,
            preview: { kind: "image", url: "blob:image" },
            progress: 42,
            progressLabel: "42%",
            statusLabel: "done",
          },
          {
            actions: {
              cancel: {
                accessibleLabel: "Cancel attachment pending.bin",
                label: "Cancel",
              },
              remove: {
                accessibleLabel: "Remove attachment pending.bin",
                label: "Remove",
              },
            },
            id: "pending",
            name: "pending.bin",
            preview: { kind: "file" },
            progress: 12,
            progressLabel: "12%",
            statusLabel: "in progress",
          },
        ]}
        onCancel={onCancel}
        onRemove={onRemove}
        onRetry={onRetry}
      />,
    ),
  };
}
