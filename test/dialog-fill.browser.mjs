import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const base = process.env.CAPS_WORKBENCH_URL;
assert.ok(base, "CAPS_WORKBENCH_URL must point at the built Caps workbench");
const shots = process.env.PRINTS_VIEWER_SHOTS;
if (shots) await mkdir(shots, { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1400, 390]) {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(
        `${base}/?story=overlays--fill-dialog&mode=preview&theme=${theme}`,
      );
      const trigger = page.getByRole("button", {
        name: "Open full-window dialog",
      });
      await trigger.click();
      const popup = page.getByRole("dialog", { name: "Full-window dialog" });
      await popup.waitFor();
      assert.deepEqual(await popup.boundingBox(), {
        x: 0,
        y: 0,
        width,
        height: 900,
      });
      assert.equal(
        await page.evaluate(
          () =>
            globalThis.document.documentElement.scrollWidth <=
            globalThis.innerWidth,
        ),
        true,
        `${width}/${theme}: no horizontal document overflow`,
      );
      assert.equal(
        await popup.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
        true,
        `${width}/${theme}: no horizontal popup overflow`,
      );
      assert.equal(
        await popup.evaluate((element) =>
          element.ownerDocument.body.getAttribute("data-theme"),
        ),
        theme === "light" ? "latte" : "mocha",
      );
      if (shots) {
        await page.screenshot({
          path: join(shots, `dialog-fill-${width}-${theme}.png`),
        });
      }
      await page.keyboard.press("Escape");
      await popup.waitFor({ state: "hidden" });
      assert.equal(
        await trigger.evaluate(
          (element) => element === element.ownerDocument.activeElement,
        ),
        true,
      );
      assert.deepEqual(errors, [], `${width}/${theme}: no pageerror`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
