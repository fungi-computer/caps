import { act } from "react";
import { afterEach, expect, it, vi } from "vitest";

import {
  cleanup,
  fireInput,
  fireKey,
  render,
  requireValue,
} from "../test-utils/index.js";
import { ConfirmAction } from "./confirm-action.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function pendingAction() {
  let reject: ((reason: Error) => void) | undefined;
  const promise = new Promise<void>((_resolve, rejectPromise) => {
    reject = rejectPromise;
  });
  return {
    promise,
    reject: (reason: Error) => {
      requireValue(reject, "pending rejection")(reason);
    },
  };
}

function button(label: string) {
  return requireValue(
    [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (element) => element.textContent === label,
    ),
    label,
  );
}

function field() {
  return requireValue(
    document.querySelector<HTMLInputElement>("input"),
    "phrase",
  );
}

async function open() {
  act(() => {
    button("Close Team").focus();
  });
  act(() => {
    button("Close Team").click();
  });
  await act(async () => {
    await new Promise(requestAnimationFrame);
  });
}

function type(value: string) {
  act(() => {
    fireInput(field(), value);
  });
}

function submit() {
  requireValue(
    document.querySelector("form"),
    "confirmation form",
  ).dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

it("requires the exact nonempty phrase, including case and whitespace, at submission", async () => {
  const confirm = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  render(
    <ConfirmAction
      mode="type"
      label="Close Team"
      confirmLabel="Close permanently"
      phrase="garden"
      onConfirm={confirm}
    />,
  );
  await open();
  expect(document.activeElement).toBe(field());
  for (const value of ["", "Garden", "garden ", " garden", "garde"]) {
    type(value);
    expect(button("Close permanently").disabled).toBe(true);
    await act(async () => {
      submit();
      await Promise.resolve();
    });
    expect(confirm).not.toHaveBeenCalled();
  }
  type("garden");
  expect(button("Close permanently").disabled).toBe(false);
  await act(async () => {
    submit();
    await Promise.resolve();
  });
  expect(confirm).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(button("Close Team"));
  await open();
  expect(field().value).toBe("");
  expect(button("Close permanently").disabled).toBe(true);
});

it("does not accept an empty configured phrase", async () => {
  const confirm = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  render(
    <ConfirmAction
      mode="type"
      label="Close Team"
      confirmLabel="Close permanently"
      phrase=""
      onConfirm={confirm}
    />,
  );
  await open();
  expect(button("Close permanently").disabled).toBe(true);
  await act(async () => {
    submit();
    await Promise.resolve();
  });
  expect(confirm).not.toHaveBeenCalled();
});

it.each(["Escape", "Cancel"])(
  "%s cancels, restores trigger focus, and clears the phrase",
  async (method) => {
    const confirm = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    render(
      <ConfirmAction
        mode="type"
        label="Close Team"
        confirmLabel="Close permanently"
        phrase="garden"
        onConfirm={confirm}
      />,
    );
    await open();
    type("garden");
    await act(async () => {
      if (method === "Escape") fireKey(field(), { key: "Escape" });
      else button("Cancel").click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(confirm).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button("Close Team"));
    await open();
    expect(field().value).toBe("");
  },
);

it("locks pending work, displays a safe refusal, and permits retry", async () => {
  const attempt = pendingAction();
  const confirm = vi
    .fn<() => Promise<void>>()
    .mockReturnValueOnce(attempt.promise)
    .mockResolvedValue(undefined);
  render(
    <ConfirmAction
      mode="type"
      label="Close Team"
      confirmLabel="Close permanently"
      phrase="garden"
      onConfirm={confirm}
      error="Closing could not be confirmed. Retry the same request."
    />,
  );
  await open();
  type("garden");
  await act(async () => {
    submit();
    submit();
    await Promise.resolve();
  });
  expect(confirm).toHaveBeenCalledOnce();
  expect(button("Close permanently").getAttribute("aria-busy")).toBe("true");
  expect(button("Cancel").disabled).toBe(true);
  await act(async () => {
    fireKey(field(), { key: "Escape" });
    await Promise.resolve();
  });
  expect(
    document.querySelector('[role="dialog"]')?.hasAttribute("data-open"),
  ).toBe(true);
  await act(async () => {
    attempt.reject(new Error("private server detail"));
    await Promise.resolve();
  });
  expect(document.body.textContent).not.toContain("private server detail");
  expect(
    document.querySelector('[role="alert"]:not([aria-hidden="true"])')
      ?.textContent,
  ).toBe("Closing could not be confirmed. Retry the same request.");
  expect(field().value).toBe("garden");
  expect(button("Close permanently").disabled).toBe(false);
  await act(async () => {
    submit();
    await Promise.resolve();
  });
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(document.activeElement).toBe(button("Close Team"));
});

it("requires a complete hold, allows Escape to interrupt, and blocks repeat work while busy", async () => {
  vi.useFakeTimers();
  const attempt = pendingAction();
  const confirm = vi
    .fn<() => Promise<void>>()
    .mockReturnValueOnce(attempt.promise)
    .mockResolvedValue(undefined);
  render(
    <ConfirmAction
      mode="hold"
      label="Disconnect"
      confirmLabel="Hold to disconnect"
      onConfirm={confirm}
      error=""
    />,
  );
  const trigger = button("Disconnect");
  act(() => {
    trigger.click();
  });
  expect(confirm).not.toHaveBeenCalled();
  act(() => {
    fireKey(trigger, { key: " " });
    vi.advanceTimersByTime(400);
    fireKey(trigger, { key: "Escape" });
    vi.advanceTimersByTime(900);
  });
  expect(confirm).not.toHaveBeenCalled();
  await act(async () => {
    fireKey(trigger, { key: "Enter" });
    vi.advanceTimersByTime(900);
    await Promise.resolve();
  });
  expect(confirm).toHaveBeenCalledOnce();
  expect(trigger.disabled).toBe(true);
  act(() => {
    fireKey(trigger, { key: "Enter" });
    vi.advanceTimersByTime(900);
  });
  expect(confirm).toHaveBeenCalledOnce();
  await act(async () => {
    attempt.reject(new Error("private detail"));
    await Promise.resolve();
  });
  expect(
    document.querySelector('[role="alert"]:not([aria-hidden="true"])')
      ?.textContent,
  ).toBe("Could not confirm the action. Try again.");
  expect(trigger.disabled).toBe(false);
  await act(async () => {
    fireKey(trigger, { key: " " });
    vi.advanceTimersByTime(900);
    await Promise.resolve();
  });
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(
    document.querySelector('[role="alert"]:not([aria-hidden="true"])'),
  ).toBeNull();
  act(() => {
    vi.advanceTimersByTime(1500);
  });
  await act(async () => {
    fireKey(trigger, { key: " " });
    vi.advanceTimersByTime(900);
    await Promise.resolve();
  });
  expect(confirm).toHaveBeenCalledTimes(3);
});
