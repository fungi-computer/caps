import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import {
  FeedbackLayer,
  FeedbackMark,
  FeedbackWordMark,
} from "./game-feedback.js";

afterEach(cleanup);

describe("FeedbackLayer", () => {
  it("is a click-through layer that reports its paused state", () => {
    const ref = createRef<HTMLDivElement>();
    render(<FeedbackLayer ref={ref} paused aria-live="polite" />);
    const layer = requireValue(ref.current, "layer");
    expect(layer.classList).toContain("caps-feedback-layer");
    expect(layer.dataset.paused).toBe("true");
    expect(layer.getAttribute("aria-live")).toBe("polite");
  });
});

describe("FeedbackMark", () => {
  it("places itself on integer pixels with its life as a custom property", () => {
    const view = render(
      <FeedbackMark
        kind="deny"
        x={10.4}
        y={20.6}
        life={1800}
        label="No path"
      />,
    );
    const mark = requireValue(
      view.queryBySelector(".caps-feedback-mark"),
      "mark",
    );
    expect(mark.dataset.kind).toBe("deny");
    expect(mark.style.getPropertyValue("--caps-feedback-x")).toBe("10px");
    expect(mark.style.getPropertyValue("--caps-feedback-y")).toBe("21px");
    expect(mark.style.getPropertyValue("--caps-feedback-life")).toBe("1800ms");
    expect(view.queryBySelector(".caps-feedback-note")?.textContent).toBe(
      "No path",
    );
    expect(
      view.queryBySelector(".caps-feedback-ring")?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("draws gains as signed outlined pixel numbers in the kind's tone", () => {
    const view = render(<FeedbackMark kind="gain" x={0} y={0} amount={3} />);
    const number = requireValue(
      view.queryBySelector(".caps-pixel-number"),
      "number",
    );
    expect(number.dataset).toMatchObject({ tone: "warning", outline: "true" });
    expect(number.textContent).toBe("+3");
    const loss = render(<FeedbackMark kind="gain" x={0} y={0} amount={-2} />);
    expect(
      loss.queryBySelector(".caps-pixel-number")?.getAttribute("data-tone"),
    ).toBe("error");
  });

  it("refuses a point or life it cannot place", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => null);
    expect(() =>
      render(<FeedbackMark kind="hit" x={Number.NaN} y={0} />),
    ).toThrow(RangeError);
    expect(() =>
      render(<FeedbackMark kind="hit" x={0} y={0} life={0} />),
    ).toThrow(RangeError);
    quiet.mockRestore();
  });
});

describe("FeedbackWordMark", () => {
  it("places itself on integer pixels, sized and toned by its props", () => {
    const view = render(
      <FeedbackWordMark
        text="CRUNCH"
        x={4.4}
        y={9.6}
        life={700}
        tone="bite"
        size="l"
      />,
    );
    const mark = requireValue(
      view.queryBySelector(".caps-feedback-word"),
      "mark",
    );
    expect(mark.dataset.tone).toBe("bite");
    expect(mark.dataset.size).toBe("l");
    expect(mark.style.getPropertyValue("--caps-feedback-x")).toBe("4px");
    expect(mark.style.getPropertyValue("--caps-feedback-y")).toBe("10px");
    expect(view.queryBySelector(".caps-feedback-word-text")?.textContent).toBe(
      "CRUNCH",
    );
    expect(view.queryBySelector(".caps-feedback-word-jaw")).toBe(null);
  });

  it("draws a two-phase jaw accent only when asked", () => {
    const view = render(
      <FeedbackWordMark text="SNAP" x={0} y={0} accent="jaw" />,
    );
    const jaw = requireValue(
      view.queryBySelector(".caps-feedback-word-jaw"),
      "jaw",
    );
    expect(view.queryBySelector(".caps-feedback-word-jaw-top")).not.toBe(null);
    expect(view.queryBySelector(".caps-feedback-word-jaw-bottom")).not.toBe(
      null,
    );
    expect(jaw.getAttribute("aria-hidden")).toBe("true");
  });

  it("refuses a point, life or text it cannot draw", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => null);
    expect(() =>
      render(<FeedbackWordMark text="OK" x={Number.NaN} y={0} />),
    ).toThrow(RangeError);
    expect(() =>
      render(<FeedbackWordMark text="OK" x={0} y={0} life={0} />),
    ).toThrow(RangeError);
    expect(() =>
      render(<FeedbackWordMark text="way too long text" x={0} y={0} />),
    ).toThrow(RangeError);
    expect(() => render(<FeedbackWordMark text="" x={0} y={0} />)).toThrow(
      RangeError,
    );
    quiet.mockRestore();
  });
});
