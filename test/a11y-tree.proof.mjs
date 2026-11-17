import process from "node:process";
import { expect, test as base } from "playwright/test";
import {
  launchIsolatedChromium,
  portsOf,
} from "../../../tooling/proof-runner/isolated-chromium.mjs";

const test = base.extend({
  browser: [
    async ({ playwright }, use) => {
      const browser = await launchIsolatedChromium(
        playwright.chromium,
        portsOf(process.env.CAPS_WORKBENCH_URL),
      );
      try {
        await use(browser);
      } finally {
        await browser.close();
      }
    },
    { scope: "worker" },
  ],
});

test("overlay menu inside a window", async ({ page }) => {
  await page.goto("/?story=overlays--window-composition&mode=preview");
  await page
    .getByRole("button", { name: "Window details", exact: true })
    .click();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByRole("menu")).toMatchAriaSnapshot(`
    - menu "More":
      - menuitem "Duplicate"
      - menuitem "Share" [disabled]
  `);
});

test("dialog name, description and close action", async ({ page }) => {
  await page.goto("/?story=overlays--dialog&mode=preview");
  await page.getByRole("button", { name: "Show details" }).click();
  await expect(page.getByRole("dialog")).toMatchAriaSnapshot(`
    - dialog "Details":
      - heading "Details" [level=2]
      - paragraph: Shiitake runs on this Computer. Press Escape to close.
      - button "Close"
  `);
});

test("combobox expanded, selected and disabled choices", async ({ page }) => {
  await page.goto("/?story=forms--combobox&mode=preview");
  const trigger = page.locator(".caps-combobox-trigger");
  await expect(trigger).toMatchAriaSnapshot(`- button "Computers": Workbench`);
  await trigger.click();
  await expect(page.getByRole("combobox")).toMatchAriaSnapshot(`
    - combobox "Search Computers" [expanded]
  `);
  await expect(page.getByRole("listbox")).toMatchAriaSnapshot(`
    - listbox:
      - option "Workbench" [selected]
      - option "Studio"
      - option "Travel laptop"
      - option "Archive · unavailable" [disabled]
  `);
});

test("error toast announces the failure and recovery detail", async ({
  page,
}) => {
  await page.goto("/?story=feedback--toaster&mode=preview");
  await page.getByRole("button", { name: "Show error toast" }).click();
  await expect(page.getByRole("region", { name: "Notifications alt+T" }))
    .toMatchAriaSnapshot(`
      - region "Notifications alt+T":
        - list:
          - listitem:
            - button "Close toast"
            - text: Couldn’t upload image Connection interrupted. Your original file is safe.
    `);
});
