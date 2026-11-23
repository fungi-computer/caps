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
  for (const width of [1280, 390]) {
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
  // A long file name ends in an ellipsis on one row, and the menu stays
  // inside a phone's screen instead of growing past its edge.
  const narrow = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await narrow.newPage();
  await page.goto(`${origin}/?story=overlays--long-names&mode=preview`);
  await page.getByRole("button", { name: "Open files", exact: true }).click();
  const choices = page.getByRole("menu").getByRole("menuitemradio");
  await choices.first().waitFor();
  const long = await choices.evaluateAll((rows) =>
    rows.map((row) => {
      const label = row.querySelector("span");
      return {
        height: row.getBoundingClientRect().height,
        right: row.getBoundingClientRect().right,
        cut: label !== null && label.scrollWidth > label.clientWidth,
      };
    }),
  );
  if (shots) {
    await page
      .getByRole("menu")
      .evaluate((menu) =>
        Promise.all(menu.getAnimations().map((motion) => motion.finished)),
      );
    await page.screenshot({ path: join(shots, "long-names-390.png") });
  }
  assert.equal(long.length, 3);
  for (const { height, right } of long) {
    assert.ok(height <= 32, `long-name menu row ${height}`);
    assert.ok(right <= 390, `long-name menu row ends at ${right}`);
  }
  assert.deepEqual(
    long.map(({ cut }) => cut),
    [false, true, true],
    "only the long names are cut",
  );
  await narrow.close();
  globalThis.console.log(
    "Menu rows: 32px or less with a mouse at 1280 and 390; 44px under pointer: coarse; long names stay on one row inside a phone.",
  );
} finally {
  await browser.close();
}
