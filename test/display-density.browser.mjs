import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const base = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const shotDirectory = process.env.CAPS_DISPLAY_DENSITY_SHOT_DIR;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 1,
  });
  await page.goto(
    `${base}/?story=surfaces--surface--display-density&mode=preview`,
  );
  const displays = page.locator(".caps-display-gasket[data-display-density]");
  await displays.nth(1).waitFor();

  if (shotDirectory) await mkdir(shotDirectory, { recursive: true });
  const results = [];
  for (const theme of ["latte", "mocha"]) {
    await page.evaluate((name) => {
      for (const element of globalThis.document.querySelectorAll(
        "[data-theme]",
      )) {
        element.setAttribute("data-theme", name);
      }
    }, theme);
    const padding = await displays.evaluateAll((elements) =>
      elements.map(
        (element) => globalThis.getComputedStyle(element).paddingTop,
      ),
    );
    results.push({ theme, padding });
    if (shotDirectory) {
      await page.screenshot({
        path: resolve(shotDirectory, `${theme}.png`),
        fullPage: true,
      });
    }
  }
  for (const { theme, padding } of results) {
    assert.ok(
      Number.parseFloat(padding[1]) < Number.parseFloat(padding[0]),
      `${theme}: compact Display gasket padding ${padding[1]} is smaller than default ${padding[0]}`,
    );
  }
} finally {
  await browser.close();
}
