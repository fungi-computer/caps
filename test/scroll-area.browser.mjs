import assert from "node:assert/strict";
import process from "node:process";
import console from "node:console";
import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({ reducedMotion });
    await page.goto(
      `${process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61003"}/?story=navigation--scrollbar&mode=preview`,
    );
    await page.locator(".caps-scroll-thumb-surface").waitFor();
    const samples = await page.evaluate(async () => {
      const viewport = globalThis.document.querySelector(
        ".caps-scroll-viewport",
      );
      const surface = globalThis.document.querySelector(
        ".caps-scroll-thumb-surface",
      );
      // Start from idle, not an arbitrary point in the mount's first sample interval.
      const mounted = globalThis.performance.now();
      await new Promise((resolve) => {
        const ready = () => {
          if (globalThis.performance.now() - mounted > 110) resolve();
          else globalThis.requestAnimationFrame(ready);
        };
        globalThis.requestAnimationFrame(ready);
      });
      const start = globalThis.performance.now();
      const values = [];
      viewport.scrollTop += 160;
      await new Promise((resolve) => {
        const sample = () => {
          values.push(
            new globalThis.DOMMatrix(
              globalThis.getComputedStyle(surface).transform,
            ).m22,
          );
          if (globalThis.performance.now() - start < 450)
            globalThis.requestAnimationFrame(sample);
          else resolve();
        };
        globalThis.requestAnimationFrame(sample);
      });
      return values;
    });
    if (reducedMotion === "reduce")
      assert(samples.every((value) => value === 1));
    else {
      assert(Math.max(...samples) > 1.005, "acceleration stretches");
      assert(Math.min(...samples) < 0.995, "deceleration compresses");
      assert(Math.max(...samples) < 1.05, "motion stays subtle");
      assert(Math.abs(samples.at(-1) - 1) < 0.001, "settles promptly");
    }
    const viewport = page.getByRole("region", {
      name: "Scrollable image collection",
    });
    await viewport.focus();
    await page.keyboard.press("End");
    await page.waitForFunction(() => {
      const e = globalThis.document.querySelector(".caps-scroll-viewport");
      return e.scrollTop >= e.scrollHeight - e.clientHeight - 1;
    });
    const thumb = await page.locator(".caps-scroll-thumb").boundingBox();
    assert(thumb);
    await page.mouse.move(
      thumb.x + thumb.width / 2,
      thumb.y + thumb.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y - 100, {
      steps: 5,
    });
    await page.mouse.up();
    assert(
      await viewport.evaluate(
        (e) => e.scrollTop < e.scrollHeight - e.clientHeight - 1,
      ),
      "dragging scrolls the native viewport",
    );
    await page.close();
  }
  console.log(
    "PASS: acceleration, deceleration, bounded settle, reduced motion, keyboard and drag.",
  );
} finally {
  await browser.close();
}
