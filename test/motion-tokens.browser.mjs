import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { chromium } from "playwright";

// The compiled public CSS, without Ladle: what a consumer actually ships.
const css = await readFile(
  new URL(import.meta.resolve("@fungi.computer/caps/styles.css")),
  "utf8",
);

const browser = await chromium.launch();
try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({ reducedMotion });
    await page.setContent(
      '<div data-theme="latte"><button class="btn caps-button caps-button-filled" id="press">Press</button><div data-theme="mocha" style="--stipe-motion-normal: 400ms"><button class="btn caps-button caps-button-filled" id="nested">Press</button></div></div>',
    );
    await page.addStyleTag({ content: css });
    const durations = await page.evaluate(() =>
      ["#press", "#nested"].map(
        (selector) =>
          globalThis.getComputedStyle(
            globalThis.document.querySelector(selector),
          ).transitionDuration,
      ),
    );
    if (reducedMotion === "no-preference") {
      // Caps transitions read the theme's tokens, not hard-coded times, and a
      // nested override reaches the controls inside it.
      assert.equal(durations[0], "0.12s, 0.12s, 0.18s, 0.18s, 0.28s");
      assert.equal(durations[1], "0.12s, 0.12s, 0.4s, 0.4s, 0.28s");
    } else {
      // Reduced motion keeps short fades; no spatial transition is enabled.
      for (const duration of durations) assert.equal(duration, "0.12s");
      const properties = await page
        .locator("#press, #nested")
        .evaluateAll((elements) =>
          elements.map(
            (element) =>
              globalThis.getComputedStyle(element).transitionProperty,
          ),
        );
      assert.deepEqual(properties, ["opacity", "opacity"]);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
