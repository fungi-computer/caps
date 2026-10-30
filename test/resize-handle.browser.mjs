import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import console from "node:console";
import { fileURLToPath, URL } from "node:url";
import { chromium } from "playwright";

const origin = process.env.CAPS_WORKBENCH_URL;
assert.ok(origin, "Run through the maintained workbench-proofs command");
const output =
  process.env.CAPS_RESIZE_OUTPUT ??
  fileURLToPath(
    new URL(
      "../../../.botanical/caps-resize-handle/latest-proof",
      import.meta.url,
    ),
  );
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const specimens = [];
try {
  for (const theme of ["latte", "mocha"]) {
    const context = await browser.newContext({
      viewport: { width: 1120, height: 640 },
      deviceScaleFactor: 2,
      colorScheme: theme === "mocha" ? "dark" : "light",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      `${origin}/?story=layouts--resize-handle--both-orientations&mode=preview&theme=${theme === "mocha" ? "dark" : "light"}`,
    );
    await page.locator("[data-resize-story]").waitFor();
    await page.evaluate(() => globalThis.document.fonts.ready);
    const fonts = await page.evaluate(() => ({
      dpr: globalThis.devicePixelRatio,
      theme: globalThis.document.body.dataset.theme,
      loaded: [...globalThis.document.fonts]
        .filter((font) => font.status === "loaded")
        .map((font) => font.family),
    }));
    assert.equal(fonts.dpr, 2);
    assert.equal(fonts.theme, theme);
    assert.ok(fonts.loaded.some((name) => name.includes("Nunito")));
    assert.ok(fonts.loaded.some((name) => name.includes("Maple Mono")));
    await page.locator("[data-resize-story]").screenshot({
      path: join(output, `${theme}.png`),
    });
    const geometry = await page.getByRole("separator").evaluateAll((handles) =>
      handles.map((handle) => {
        const grip = handle.querySelector(".caps-resize-grip");
        if (!grip) throw new Error("Resize grip missing");
        const outer = handle.getBoundingClientRect();
        const inner = grip.getBoundingClientRect();
        return {
          orientation: handle.getAttribute("aria-orientation"),
          position: globalThis.getComputedStyle(handle).position,
          hitWidth: outer.width,
          hitHeight: outer.height,
          offsetX: inner.x + inner.width / 2 - (outer.x + outer.width / 2),
          offsetY: inner.y + inner.height / 2 - (outer.y + outer.height / 2),
          width: inner.width,
          height: inner.height,
        };
      }),
    );
    await writeFile(
      join(output, `${theme}.json`),
      JSON.stringify({ fonts, geometry, errors }, null, 2) + "\n",
    );
    specimens.push({ page, theme, geometry, errors });
  }
  // Capture both real themes before checking the regression, including on red.
  for (const { page, theme, geometry, errors } of specimens) {
    assert.deepEqual(errors, [], `${theme}: no page errors`);
    assert.equal(geometry.length, 2);
    for (const grip of geometry) {
      const label = `${theme}/${grip.orientation}`;
      assert.equal(
        grip.position,
        "absolute",
        `${label}: caller class owns placement`,
      );
      assert.ok(
        grip.hitWidth >= 24 && grip.hitHeight >= 24,
        `${label}: transparent hit area preserved`,
      );
      assert.ok(
        Math.abs(grip.offsetX) <= 0.5,
        `${label}: grip centred on x (${grip.offsetX}px)`,
      );
      assert.ok(
        Math.abs(grip.offsetY) <= 0.5,
        `${label}: grip centred on y (${grip.offsetY}px)`,
      );
      assert.equal(grip.width, grip.orientation === "vertical" ? 6 : 28, label);
      assert.equal(
        grip.height,
        grip.orientation === "vertical" ? 28 : 6,
        label,
      );
      const handle = page.locator(
        `[role="separator"][aria-orientation="${grip.orientation}"]`,
      );
      const initial = Number(await handle.getAttribute("aria-valuenow"));
      const minimum = Number(await handle.getAttribute("aria-valuemin"));
      const maximum = Number(await handle.getAttribute("aria-valuemax"));
      const forward =
        grip.orientation === "vertical" ? "ArrowRight" : "ArrowDown";
      const backward =
        grip.orientation === "vertical" ? "ArrowLeft" : "ArrowUp";
      await handle.focus();
      await page.keyboard.press(forward);
      assert.equal(
        Number(await handle.getAttribute("aria-valuenow")),
        initial + 32,
      );
      assert.equal(
        await handle.evaluate((node) => node.matches(":focus-visible")),
        true,
      );
      assert.notEqual(
        await handle.evaluate(
          (node) => globalThis.getComputedStyle(node).outlineStyle,
        ),
        "none",
      );
      await page.keyboard.press("End");
      await page.keyboard.press(forward);
      assert.equal(Number(await handle.getAttribute("aria-valuenow")), maximum);
      await page.keyboard.press("Home");
      await page.keyboard.press(backward);
      assert.equal(Number(await handle.getAttribute("aria-valuenow")), minimum);
      await handle.evaluate((node) => node.blur());
      await handle.hover();
      assert.equal(
        await handle.evaluate(
          (node) => globalThis.getComputedStyle(node).outlineStyle,
        ),
        "none",
      );
      const box = await handle.boundingBox();
      assert.ok(box);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(
        grip.orientation === "vertical" ? x + 40 : x,
        grip.orientation === "horizontal" ? y + 40 : y,
      );
      await page.mouse.up();
      assert.equal(
        Number(await handle.getAttribute("aria-valuenow")),
        minimum + 40,
        `${label}: caller's existing captured-pointer owner resizes`,
      );
      await page.mouse.move(x + 120, y + 120);
      assert.equal(
        Number(await handle.getAttribute("aria-valuenow")),
        minimum + 40,
      );
    }
    await page.emulateMedia({ forcedColors: "active" });
    assert.equal(
      await page
        .locator(".caps-resize-grip")
        .first()
        .evaluate((node) => globalThis.getComputedStyle(node).borderTopStyle),
      "solid",
      `${theme}: visible grip edge when forced colours remove shadows`,
    );
    console.log(
      `${theme}: centred dotted knob, keyboard bounds/focus and Maosaico pointer drag passed at DPR 2`,
    );
  }
} finally {
  await browser.close();
}
