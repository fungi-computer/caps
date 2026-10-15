import assert from "node:assert/strict";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/?story=forms--icon-choices&mode=preview`);
  const prints = page.getByRole("radio", { name: "Prints", exact: true });
  const inkcap = page.getByRole("radio", { name: "Inkcap", exact: true });
  const read = page.getByRole("checkbox", { name: "Read files", exact: true });
  const write = page.getByRole("checkbox", {
    name: "Write files",
    exact: true,
  });
  await prints.waitFor();
  await prints.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await inkcap.isChecked(),
    true,
    "native radio arrows select Inkcap",
  );
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await prints.isChecked(),
    true,
    "native arrows skip disabled Vishnu",
  );
  await read.focus();
  await page.keyboard.press("Space");
  assert.equal(await read.isChecked(), false, "Space toggles native checkbox");
  await write.click();
  const formData = () =>
    page
      .getByRole("form", { name: "Icon choices" })
      .evaluate((form) => Array.from(new globalThis.FormData(form)));
  assert.deepEqual(await formData(), [
    ["runtime", "prints"],
    ["access", "write"],
  ]);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  assert.deepEqual(await formData(), [
    ["runtime", "prints"],
    ["access", "read"],
  ]);
  assert.equal(await read.isChecked(), true);
  assert.equal(
    await page.getByRole("checkbox", { name: "Run commands" }).isDisabled(),
    true,
  );
  assert.equal(
    await page.getByRole("radio", { name: "Vishnu" }).isDisabled(),
    true,
  );
  await page.keyboard.press("Shift+Tab");
  assert.equal(
    await write.evaluate(
      (input) => input === globalThis.document.activeElement,
    ),
    true,
    "Tab reaches the native input",
  );
  assert.equal(
    await write.evaluate(
      (input) => globalThis.getComputedStyle(input.parentElement).outlineStyle,
    ),
    "solid",
    "visible native focus ring",
  );
  const dimensions = await page
    .locator(".caps-icon-choice")
    .evaluateAll((keys) =>
      keys.map((key) => ({
        width: key.getBoundingClientRect().width,
        height: key.getBoundingClientRect().height,
      })),
    );
  assert.ok(
    dimensions.every((key) => key.width >= 56 && key.height >= 52),
    "all icon choices retain a touch target",
  );
  assert.deepEqual(errors, []);
  process.stdout.write(
    "PASS: icon choices retain native keyboard, form, reset, disabled and focus behaviour\n",
  );
} finally {
  await browser.close();
}
