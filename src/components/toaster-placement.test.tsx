// @vitest-environment jsdom
import { act } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "../test-utils/index.js";
import { OverlayRoot } from "./overlay-root.js";
import { Toaster, toast as toastApi } from "./toaster.js";

const hosts: HTMLElement[] = [];
afterEach(() => {
  toastApi.dismiss();
  cleanup();
  for (const host of hosts.splice(0)) host.remove();
  // jsdom has no matchMedia; each test installs its own.
  Reflect.deleteProperty(window, "matchMedia");
});

function screenWidth(narrow: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: narrow,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}

async function placement(): Promise<string | null | undefined> {
  const host = document.createElement("section");
  document.body.append(host);
  hosts.push(host);
  const make = () => document.createElement("section");
  render(
    <OverlayRoot
      containers={{
        popover: make(),
        dialog: make(),
        toast: host,
        tooltip: make(),
      }}
    >
      <Toaster />
    </OverlayRoot>,
  );
  act(() => {
    toastApi("Your Computer didn't start");
  });
  await vi.waitFor(() => {
    expect(host.querySelector("[data-sonner-toaster]")).not.toBeNull();
  });
  return host
    .querySelector("[data-sonner-toaster]")
    ?.getAttribute("data-y-position");
}

it("keeps a toast off the bottom edge on a phone, where the composer and a decision card sit", async () => {
  screenWidth(true);
  expect(await placement()).toBe("top");
});

it("keeps a toast top-right on a wide screen", async () => {
  screenWidth(false);
  expect(await placement()).toBe("top");
});
