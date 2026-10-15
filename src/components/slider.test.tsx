// @vitest-environment jsdom
import { act, createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cleanup,
  fireInput,
  render,
  requireValue,
} from "../test-utils/index.js";
import { Slider } from "./slider.js";

afterEach(cleanup);

describe("Caps Slider", () => {
  it("keeps the native range contract while applying caller-owned presentation", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    const uncheckedCallerProps = { type: "text" };
    const view = render(
      <main>
        <Slider
          {...uncheckedCallerProps}
          aria-label="Playback position"
          className="slider-custom"
          data-playback="ready"
          defaultValue={35}
          max={120}
          min={5}
          onChange={onChange}
          ref={ref}
          size="sm"
          step={5}
          tone="warning"
        />
        <Slider aria-label="Unavailable value" disabled />
      </main>,
    );
    const sliders = view.container.querySelectorAll<HTMLInputElement>("input");
    const slider = requireValue(sliders[0], "Slider input");
    const disabledSlider = requireValue(sliders[1], "disabled Slider input");

    expect(slider.type).toBe("range");
    expect(ref.current).toBe(slider);
    expect(slider.value).toBe("35");
    expect(slider.min).toBe("5");
    expect(slider.max).toBe("120");
    expect(slider.step).toBe("5");
    expect(slider.getAttribute("aria-label")).toBe("Playback position");
    expect(slider.dataset.playback).toBe("ready");
    expect(slider.className.split(/\s+/)).toEqual(
      expect.arrayContaining([
        "range",
        "range-warning",
        "range-sm",
        "slider-custom",
      ]),
    );

    act(() => {
      fireInput(slider, "40");
    });
    expect(onChange).toHaveBeenCalled();
    expect(slider.value).toBe("40");

    expect(disabledSlider.disabled).toBe(true);
    expect(disabledSlider.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["range", "range-neutral", "range-md"]),
    );
  });
});
