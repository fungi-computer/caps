import assert from "node:assert/strict";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion,
        permissions: ["clipboard-read", "clipboard-write"],
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${origin}/?story=forms--code-input&mode=preview`);
      const input = page.getByRole("textbox", { name: "Sign-in code" });
      await input.waitFor();
      await input.focus();
      await page.evaluate(() =>
        globalThis.navigator.clipboard.writeText("123 456"),
      );
      await input.press("Control+V");
      await page.waitForFunction(
        () =>
          globalThis.document.querySelector("[data-code-demo]").value.length >
          0,
      );
      const pasted = await input.inputValue();
      await input.fill("123456");
      await input.press("Home");
      const focusState = () =>
        input.evaluate((field) => {
          const slots = [
            ...field.parentElement.querySelectorAll(".caps-code-slot"),
          ];
          const active = slots.findIndex(
            (slot) => slot.dataset.active === "true",
          );
          const activeStyle = globalThis.getComputedStyle(slots[active]);
          const inactiveStyle = globalThis.getComputedStyle(
            slots.find((_, index) => index !== active),
          );
          return {
            position: field.selectionStart,
            active,
            edge: activeStyle
              .getPropertyValue("--caps-input-edge-width")
              .trim(),
            distinct: activeStyle.boxShadow !== inactiveStyle.boxShadow,
          };
        });
      assert.deepEqual(
        { pasted, focus: await focusState() },
        {
          pasted: "123456",
          focus: { position: 0, active: 0, edge: "2px", distinct: true },
        },
        "formatted paste preserves six digits; a rejected full code keeps visible native caret focus",
      );
      await input.press("9");
      assert.equal(
        await input.inputValue(),
        "123456",
        "a full code rejects insertion without dropping its last digit",
      );
      await input.press("ArrowRight");
      assert.deepEqual(await focusState(), {
        position: 1,
        active: 1,
        edge: "2px",
        distinct: true,
      });
      await input.press("Home");
      await input.press("Delete");
      await input.press("4");
      assert.equal(
        await input.inputValue(),
        "423456",
        "editing follows native selection",
      );
      await input.press("Home");
      await input.press("Shift+ArrowRight");
      await page.evaluate(() =>
        globalThis.navigator.clipboard.writeText("9 8"),
      );
      await input.press("Control+V");
      assert.equal(
        await input.inputValue(),
        "923456",
        "formatted paste respects selected capacity and preserves the suffix",
      );
      await input.press("Control+A");
      await input.press("4");
      assert.equal(
        await input.inputValue(),
        "4",
        "select-all replaces the complete code",
      );
      await input.fill("424242");
      await input.press("Home");
      assert.equal(
        await page.locator(".caps-code-input").getAttribute("data-status"),
        "accepted",
      );
      assert.deepEqual(
        await focusState(),
        { position: 0, active: 0, edge: "2px", distinct: true },
        "accepted status retains visible focus",
      );
      await input.evaluate((field) => {
        field.readOnly = true;
      });
      await input.press("Control+A");
      await page.evaluate(() =>
        globalThis.navigator.clipboard.writeText("1 2"),
      );
      await input.press("Control+V");
      assert.equal(
        await input.inputValue(),
        "424242",
        "formatted paste respects the native read-only state",
      );
      assert.deepEqual(errors, []);
      process.stdout.write(
        `PASS: code paste, native editing and visible status focus at ${width}/${reducedMotion}\n`,
      );
      await context.close();
    }
  }
} finally {
  await browser.close();
}
