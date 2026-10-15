import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const shots = process.env.CAPS_DISABLED_SHOTS;
if (shots) await mkdir(shots, { recursive: true });
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL("..", import.meta.url)),
  server: { host: "127.0.0.1", port: 0 },
  logLevel: "error",
});
await server.listen();
const origin = server.resolvedUrls?.local[0];
assert.ok(origin, "fixture server has an origin");
const browser = await chromium.launch();
const face = async (button, opacity = "1") => {
  await button
    .page()
    .waitForFunction(
      ({ element, expected }) =>
        globalThis.getComputedStyle(element).opacity === expected,
      { element: await button.elementHandle(), expected: opacity },
      { timeout: 5000 },
    );
  return button.evaluate((element) => {
    const style = globalThis.getComputedStyle(element);
    return {
      background: style.backgroundColor,
      image: style.backgroundImage,
      color: style.color,
      border: style.border,
      marginInlineStart: style.marginInlineStart,
      marginBlockStart: style.marginBlockStart,
      radius: style.borderRadius,
      outline: `${style.outlineWidth} ${style.outlineStyle}`,
      shadow: style.boxShadow,
      cut: style.clipPath,
      opacity: style.opacity,
    };
  });
};
const sameFace = (ready, disabled, label) => {
  assert.equal(ready.opacity, "1", `${label}: enabled opacity`);
  assert.equal(disabled.opacity, "0.45", `${label}: disabled dims`);
  assert.deepEqual(
    { ...disabled, opacity: ready.opacity },
    ready,
    `${label}: disabled retains the filled face and shape`,
  );
};

try {
  for (const theme of ["latte", "mocha", "field-guide", "field-guide-night"]) {
    for (const width of [390, 1280]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(new URL("test/disabled-filled.html", origin).href);
      await page.evaluate((value) => {
        globalThis.document.documentElement.dataset.theme = value;
      }, theme);
      const input = page.getByRole("textbox", { name: "Name", exact: true });
      const submit = page.getByRole("button", { name: "Save", exact: true });
      await input.waitFor();
      const ready = await face(submit);
      const capture = async (state) => {
        if (shots)
          await page.screenshot({
            path: resolve(shots, `${theme}-${width}-${state}.png`),
            fullPage: true,
            animations: "disabled",
          });
      };
      await capture("ready");
      for (const variant of ["primary", "secondary", "accent", "destructive"]) {
        const group = page.getByRole("region", { name: variant, exact: true });
        const enabled = await face(
          group.getByRole("button", { name: "Ready" }),
        );
        sameFace(
          enabled,
          await face(group.getByRole("button", { name: "Disabled" }), "0.45"),
          `${theme}/${variant}/native`,
        );
        sameFace(
          enabled,
          await face(group.getByRole("link"), "0.45"),
          `${theme}/${variant}/aria`,
        );
      }
      const keys = page.getByRole("region", { name: "Molded primary key" });
      const readyKey = await face(
        keys.getByRole("button", { name: "Ready", exact: true }),
      );
      const disabledKey = keys.getByRole("button", {
        name: "Disabled",
        exact: true,
      });
      assert.equal(await disabledKey.isDisabled(), true);
      sameFace(
        readyKey,
        await face(disabledKey, "0.45"),
        `${theme}/disabled KeycapButton`,
      );
      sameFace(
        readyKey,
        await face(
          keys.getByRole("button", { name: "Unavailable key", exact: true }),
          "0.45",
        ),
        `${theme}/aria-disabled KeycapButton`,
      );
      const joined = page.getByRole("region", { name: "Joined action" });
      sameFace(
        await face(joined.getByRole("button", { name: "Ready" })),
        await face(joined.getByRole("button", { name: "Disabled" }), "0.45"),
        `${theme}/joined action`,
      );
      const nested = page.getByRole("region", {
        name: "Nested Composer action",
      });
      sameFace(
        await face(nested.getByRole("button", { name: "Ready" })),
        await face(nested.getByRole("button", { name: "Disabled" }), "0.45"),
        `${theme}/nested Composer action`,
      );
      await input.fill("");
      await input.blur();
      await page.getByText("Enter a name.", { exact: true }).waitFor();
      assert.equal(await submit.isDisabled(), true);
      await capture("invalid");
      sameFace(ready, await face(submit, "0.45"), `${theme}/invalid submit`);
      await input.press("Enter");
      assert.equal(await page.getByLabel("Saved count").textContent(), "0");
      await input.fill("River");
      await submit.click();
      await page.waitForFunction(
        () =>
          globalThis.document
            .querySelector('button[type="submit"]')
            ?.getAttribute("aria-busy") === "true",
      );
      await page.mouse.move(0, 0);
      assert.equal(await submit.isDisabled(), true);
      await capture("pending");
      sameFace(ready, await face(submit, "0.45"), `${theme}/pending submit`);
      await input.press("Enter");
      await page
        .getByRole("button", { name: "Finish save", exact: true })
        .click();
      await page.getByLabel("Saved count").filter({ hasText: /^1$/ }).waitFor();
      assert.deepEqual(await face(submit), ready);
      assert.equal(await submit.isDisabled(), false);
      assert.deepEqual(errors, []);
      await page.close();
    }
  }
  process.stdout.write(
    "PASS: disabled filled buttons, invalid submit and pending guards across four themes and two widths\n",
  );
} finally {
  await browser.close();
  await server.close();
}
