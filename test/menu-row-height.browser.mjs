import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import {
  launchIsolatedChromium,
  portsOf,
} from "../../../tooling/proof-runner/isolated-chromium.mjs";

// Menu rows are 32px or less with a mouse at every width. Only a touch-first
// device (`pointer: coarse`) grows each row's hit area to 44px.
const origin = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const shots = process.env.CAPS_MENU_ROW_SHOTS;
const browser = await launchIsolatedChromium(chromium, portsOf(origin));

/** Open the touch-targets story's More menu and measure its rows. */
async function menuRows(page, name) {
  await page.goto(`${origin}/?story=navigation--touch-targets&mode=preview`);
  await page.getByRole("button", { name: "More", exact: true }).click();
  const items = page.getByRole("menu").getByRole("menuitem");
  await items.first().waitFor();
  // The popup fades in; settle it so a screenshot shows the open menu.
  await page
    .getByRole("menu")
    .evaluate((menu) =>
      Promise.all(menu.getAnimations().map((animation) => animation.finished)),
    );
  if (shots) {
    await mkdir(shots, { recursive: true });
    await page.screenshot({ path: join(shots, `${name}.png`) });
  }
  return items.evaluateAll((rows) =>
    rows.map((row) => row.getBoundingClientRect().height),
  );
}

try {
  for (const width of [1440, 390]) {
    const mouse = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const mouseRows = await menuRows(await mouse.newPage(), `mouse-${width}`);
    assert.ok(mouseRows.length > 0, "the menu has rows");
    for (const height of mouseRows)
      assert.ok(height <= 32, `${width} mouse menu row ${height}`);
    await mouse.close();

    const touch = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
      hasTouch: true,
      isMobile: true,
    });
    const touchPage = await touch.newPage();
    const touchRows = await menuRows(touchPage, `touch-${width}`);
    assert.equal(
      await touchPage.evaluate(
        () => globalThis.matchMedia("(pointer: coarse)").matches,
      ),
      true,
    );
    for (const height of touchRows)
      assert.ok(height >= 44, `${width} touch menu row ${height}`);
    await touch.close();
  }
  globalThis.console.log(
    "Menu rows: 32px or less with a mouse at 1440 and 390; 44px under pointer: coarse.",
  );
} finally {
  await browser.close();
}
