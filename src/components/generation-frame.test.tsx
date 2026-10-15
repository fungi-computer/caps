import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";

import { GenerationFrame, type GenerationStatus } from "./generation-frame.js";
import { SendAction, type SendActionState } from "./send-action.js";

// SAFETY: React reads this flag to enable act() outside a test renderer.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
afterEach(() => {
  act(() => {
    root?.unmount();
  });
  document.body.replaceChildren();
});

function mount(node: React.ReactNode) {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => {
    root?.render(node);
  });
  return host;
}

function frame(status: GenerationStatus) {
  return (
    <GenerationFrame status={status} failure="Refused" aspectRatio={1.5}>
      <img alt="Result" src="data:," />
    </GenerationFrame>
  );
}

test("a working frame is busy and announces its status, with no media yet", () => {
  const host = mount(frame("generating"));
  const element = host.querySelector(".caps-generation-frame");
  expect(element?.getAttribute("aria-busy")).toBe("true");
  expect(host.querySelector('[role="status"]')?.textContent).toBe("Generating");
  expect(host.querySelector("img")).toBeNull();
});

test("the frame keeps one box: done shows the media, failed shows the failure", () => {
  const host = mount(frame("generating"));
  act(() => {
    root?.render(frame("done"));
  });
  expect(host.querySelector("img")?.getAttribute("alt")).toBe("Result");
  expect(host.querySelector('[role="status"]')).toBeNull();
  act(() => {
    root?.render(frame("failed"));
  });
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("Refused");
  expect(host.querySelector("img")).toBeNull();
  expect(
    host.querySelector(".caps-generation-frame")?.hasAttribute("data-aspect"),
  ).toBe(true);
});

function send(state: SendActionState, onStop?: () => void) {
  return <SendAction aria-label="Send" onStop={onStop} state={state} />;
}

test("the send key is disabled with nothing to send or while it cannot stop", () => {
  const host = mount(send("empty"));
  const button = () => host.querySelector("button");
  expect(button()?.disabled).toBe(true);
  act(() => {
    root?.render(send("ready"));
  });
  expect(button()?.disabled).toBe(false);
  act(() => {
    root?.render(send("busy"));
  });
  expect(button()?.disabled).toBe(true);
  expect(button()?.getAttribute("aria-busy")).toBe("true");
});

test("a stoppable send key becomes Stop while busy", () => {
  const stop = vi.fn();
  const host = mount(send("busy", stop));
  const button = host.querySelector("button");
  expect(button?.getAttribute("aria-label")).toBe("Stop");
  act(() => {
    button?.click();
  });
  expect(stop).toHaveBeenCalledOnce();
});
