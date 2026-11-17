import assert from "node:assert/strict";
import console from "node:console";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { URLSearchParams } from "node:url";
import { chromium } from "playwright";
import { waitForMeta } from "../scripts/workbench-process.mjs";
import {
  launchIsolatedChromium,
  portsOf,
} from "../../../tooling/proof-runner/isolated-chromium.mjs";

const origin = process.env.CAPS_WORKBENCH_URL;
const story = process.env.CAPS_VISUAL_STORY;
assert.ok(origin, "Set CAPS_WORKBENCH_URL to the prepared workbench");
assert.ok(story, "Pass a story id to proof:visual");
const meta = await waitForMeta(origin);
assert.ok(Object.hasOwn(meta.stories, story), `Unknown story: ${story}`);
const output = resolve(
  process.env.CAPS_VISUAL_OUTPUT ?? "../../.botanical/caps-visual",
  encodeURIComponent(story),
);
await mkdir(output, { recursive: true });
const browser = await launchIsolatedChromium(chromium, portsOf(origin));
try {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
        colorScheme: theme,
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(
        `${origin}/?${new URLSearchParams({ story, mode: "preview", theme })}`,
      );
      await page.locator("html[data-storyloaded]").waitFor();
      await page.locator("[data-caps-workbench]").waitFor();
      assert.equal(await page.locator("[data-ladle-error]").count(), 0);
      await page.evaluate(() => globalThis.document.fonts.ready);
      await page.screenshot({
        path: resolve(output, `${width}-${theme}.png`),
        animations: "disabled",
        fullPage: true,
      });
      assert.deepEqual(errors, [], "Story threw during rendering");
      await page.close();
    }
  }
  console.log(`PASS visual: ${story}, 1440/390 light/dark → ${output}`);
} finally {
  await browser.close();
}
