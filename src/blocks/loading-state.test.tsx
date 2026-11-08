// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render } from "../test-utils/index.js";
import { LoadingState } from "./loading-state.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("LoadingState", () => {
  it("sizes and shapes the blob loader and shows detail", () => {
    const view = render(
      <LoadingState
        detail="This takes a moment"
        message="Opening Prints…"
        size="lg"
        variant="bloom"
      />,
    );
    const loader = view.container.querySelector(".caps-loader");
    expect(loader?.className).toContain("caps-loader-lg");
    expect(loader?.getAttribute("data-variant")).toBe("bloom");
    expect(view.container.textContent).toContain("This takes a moment");
    expect(view.container.textContent).not.toContain("Still working");
  });

  it("shows an App icon above the loader", () => {
    const view = render(
      <LoadingState icon={<svg data-testid="icon" />} message="Opening…" />,
    );
    const root = view.container.querySelector(".caps-loading-state");
    expect(root?.hasAttribute("data-icon")).toBe(true);
    expect(root?.firstElementChild?.className).toContain(
      "caps-loading-state-icon",
    );
  });

  it("can drop its frame", () => {
    const view = render(<LoadingState framed={false} message="Opening…" />);
    expect(
      view.container
        .querySelector(".caps-loading-state")
        ?.getAttribute("data-framed"),
    ).toBe("false");
  });

  it("admits it is slow and offers Retry only when given onRetry", () => {
    vi.useFakeTimers();
    const onRetry = vi.fn();
    const view = render(
      <LoadingState
        message="Connecting…"
        onRetry={onRetry}
        slowAfterMs={500}
      />,
    );
    expect(view.container.querySelector("button")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(view.container.textContent).toContain("Still working…");
    const retry = view.container.querySelector("button");
    expect(retry?.textContent).toBe("Retry");
    act(() => {
      retry?.click();
    });
    expect(onRetry).toHaveBeenCalledOnce();
    cleanup();
    const quiet = render(
      <LoadingState message="Connecting…" slowAfterMs={500} />,
    );
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(quiet.container.textContent).toContain("Still working…");
    expect(quiet.container.querySelector("button")).toBeNull();
  });

  it("never turns slow with an infinite threshold", () => {
    vi.useFakeTimers();
    const view = render(
      <LoadingState message="Waiting" slowAfterMs={Number.POSITIVE_INFINITY} />,
    );
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(view.container.textContent).not.toContain("Still working");
  });
});
