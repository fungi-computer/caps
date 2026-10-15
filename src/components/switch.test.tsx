import { act, createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, requireValue } from "../test-utils/index.js";
import { Switch } from "./switch.js";

afterEach(cleanup);

describe("Switch", () => {
  it("keeps the controlled value until its owner accepts the change", () => {
    const changed = vi.fn();
    const clicked = vi.fn();
    const ref = createRef<HTMLInputElement>();
    const view = render(
      <Switch
        checked={false}
        ref={ref}
        onCheckedChange={changed}
        onClick={clicked}
        aria-label="Notifications"
      />,
    );
    const input = requireValue(ref.current, "native switch");
    act(() => {
      input.click();
    });
    expect(changed).toHaveBeenCalledWith(true);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(input.checked).toBe(false);
    expect(
      view.container
        .querySelector(".caps-switch")
        ?.getAttribute("data-checked"),
    ).toBe("false");
  });

  it("submits and resets an uncontrolled switch through its native form", async () => {
    const view = render(
      <form>
        <Switch
          name="notifications"
          defaultChecked
          aria-label="Notifications"
        />
      </form>,
    );
    const form = requireValue(view.container.querySelector("form"), "form");
    const input = requireValue(form.querySelector("input"), "native switch");
    expect(new FormData(form).get("notifications")).toBe("on");
    act(() => {
      input.click();
    });
    expect(new FormData(form).has("notifications")).toBe(false);
    await act(async () => {
      form.reset();
      await Promise.resolve();
    });
    expect(input.checked).toBe(true);
    expect(
      view.container
        .querySelector(".caps-switch")
        ?.getAttribute("data-checked"),
    ).toBe("true");
    expect(new FormData(form).get("notifications")).toBe("on");
  });

  it("does not change a disabled switch", () => {
    const changed = vi.fn();
    const view = render(
      <Switch
        disabled
        onCheckedChange={changed}
        aria-label="Managed setting"
      />,
    );
    const input = requireValue(
      view.container.querySelector("input"),
      "native switch",
    );
    act(() => {
      input.click();
    });
    expect(input.checked).toBe(false);
    expect(changed).not.toHaveBeenCalled();
  });
});
