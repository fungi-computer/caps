import assert from "node:assert/strict";
import { fileURLToPath, URL } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { host: "127.0.0.1", port: 0 },
  logLevel: "error",
});
await server.listen();
const origin = server.resolvedUrls?.local[0];
assert.ok(origin);
const browser = await chromium.launch();
try {
  for (const height of [844, 900]) {
    for (const material of ["", "surface", "surface&screen"]) {
      const page = await browser.newPage({
        viewport: { width: 390, height },
        reducedMotion: "reduce",
      });
      await page.goto(`${origin}test/scroll-gutter.html?${material}`);
      const viewport = page.getByLabel("Responsive collection");
      await viewport.waitFor();
      // Responsive image rows straddle the overflow threshold: a narrower
      // viewport makes them shorter, so conditional gutter width feeds back.
      await viewport.evaluate((element) => {
        const content = element.querySelector("[data-responsive-content]");
        content.style.aspectRatio = `${element.clientWidth} / ${element.clientHeight + 2}`;
      });
      const frames = await viewport.evaluate(async (element) => {
        const values = [];
        for (let frame = 0; frame < 120; frame += 1) {
          await new Promise(globalThis.requestAnimationFrame);
          values.push({
            width: element.clientWidth,
            height: element.scrollHeight,
            overflow: element
              .closest(".caps-scroll-area")
              .hasAttribute("data-has-overflow-y"),
            tile: element
              .querySelector("[data-responsive-content] > div")
              .getBoundingClientRect().width,
          });
        }
        return values.slice(30);
      });
      assert.equal(
        new Set(frames.map((frame) => JSON.stringify(frame))).size,
        1,
        `${height}/${material || "plain"}: geometry and overflow settle for 90 frames`,
      );
      assert.equal(
        frames.at(-1).overflow,
        true,
        "responsive content overflows",
      );
      await viewport.evaluate((element) => {
        element.querySelector("[data-responsive-content]").style.aspectRatio =
          "auto";
      });
      await page.waitForFunction(
        () =>
          !globalThis.document
            .querySelector(".caps-scroll-area")
            .hasAttribute("data-has-overflow-y"),
      );
      assert.equal(
        await viewport.evaluate((element) => element.clientWidth),
        frames.at(-1).width,
        "removing overflow keeps the same content width",
      );
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
