import assert from "node:assert/strict";
import process from "node:process";
import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(
    `${process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61003"}/?story=checks--scroll-area--changing-content&mode=preview`,
  );
  const viewport = page.getByRole("region", { name: "Changing collection" });
  const frame = page.locator(".caps-scroll-area");
  await viewport.waitFor();
  await page.waitForFunction(() => {
    const viewport = globalThis.document.querySelector(".caps-scroll-viewport");
    return viewport.clientHeight > 0 && viewport.tabIndex === -1;
  });
  await page.getByRole("button", { name: "Load 500 rows" }).click();
  await page.waitForFunction(
    () => {
      const frame = globalThis.document.querySelector(".caps-scroll-area");
      return frame.hasAttribute("data-has-overflow-y");
    },
    undefined,
    { timeout: 2000 },
  );
  assert.equal(await viewport.getAttribute("tabindex"), "0");

  for (const fontSize of [16, 20]) {
    await page.evaluate(async (value) => {
      globalThis.document.documentElement.style.fontSize = `${value}px`;
      await new Promise((resolve) =>
        globalThis.requestAnimationFrame(() =>
          globalThis.requestAnimationFrame(resolve),
        ),
      );
    }, fontSize);
    for (const bottom of [false, true]) {
      await viewport.evaluate(async (element, end) => {
        element.scrollTop = end ? element.scrollHeight : 0;
        await new Promise((resolve) =>
          globalThis.requestAnimationFrame(() =>
            globalThis.requestAnimationFrame(resolve),
          ),
        );
      }, bottom);
      await page.waitForFunction((end) => {
        const viewport = globalThis.document.querySelector(
          ".caps-scroll-viewport",
        );
        return end
          ? viewport.scrollTop >=
              viewport.scrollHeight - viewport.clientHeight - 1
          : viewport.scrollTop === 0;
      }, bottom);
      const bounds = await frame.evaluate((element) => {
        const track = element
          .querySelector(".caps-scroll-track")
          .getBoundingClientRect();
        const thumb = element
          .querySelector(".caps-scroll-thumb")
          .getBoundingClientRect();
        return {
          top: thumb.top - track.top,
          bottom: track.bottom - thumb.bottom,
          height: thumb.height,
        };
      });
      assert(
        Math.abs(bottom ? bounds.bottom : bounds.top) < 1,
        JSON.stringify(bounds),
      );
    }
    const thumb = await page.locator(".caps-scroll-thumb").boundingBox();
    assert(thumb);
    await page.mouse.move(
      thumb.x + thumb.width / 2,
      thumb.y + thumb.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y - 50, {
      steps: 5,
    });
    await page.mouse.up();
    assert(
      await viewport.evaluate(
        (element) =>
          element.scrollTop < element.scrollHeight - element.clientHeight - 1,
      ),
    );
  }

  for (const name of ["Toggle screen", "Toggle surface", "Toggle screen"]) {
    const previous = await viewport.elementHandle();
    await page.getByRole("button", { name }).click();
    await page.locator(".caps-scroll-thumb").waitFor();
    await previous.evaluate((element) =>
      element.dispatchEvent(new globalThis.Event("scroll")),
    );
    await page.waitForTimeout(120);
    const samples = await viewport.evaluate(async (element) => {
      const thumb = element
        .closest(".caps-scroll-area")
        .querySelector(".caps-scroll-thumb-surface");
      element.scrollTop = 160;
      const start = globalThis.performance.now();
      const values = [];
      await new Promise((resolve) => {
        const sample = () => {
          values.push(
            new globalThis.DOMMatrix(
              globalThis.getComputedStyle(thumb).transform,
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
    assert(
      Math.max(...samples) > 1.005,
      `${name}: current viewport keeps thumb motion`,
    );
    assert(Math.abs(samples.at(-1) - 1) < 0.001, `${name}: motion settles`);
    await previous.dispose();
  }

  await viewport.evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.getByRole("button", { name: "Show two rows" }).click();
  await page.waitForFunction(
    () => {
      const frame = globalThis.document.querySelector(".caps-scroll-area");
      return !frame.hasAttribute("data-has-overflow-y");
    },
    undefined,
    { timeout: 2000 },
  );
  assert.equal(await viewport.getAttribute("tabindex"), "-1");
  process.stdout.write(
    "PASS: changing content, thumb bounds and drag at two font sizes, material-toggle motion, and overflow removal.\n",
  );
} finally {
  await browser.close();
}
