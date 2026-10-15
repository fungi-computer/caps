import assert from "node:assert/strict";
import process from "node:process";
import { chromium } from "playwright";

const base = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(
    `${base}/?story=surfaces--surface--screen-material&mode=preview`,
  );
  const screen = page.locator(".caps-screen").first();
  await screen.waitFor();
  for (const theme of ["latte", "mocha", "future-theme"]) {
    const colors = await screen.evaluate((element, value) => {
      for (const ancestor of globalThis.document.querySelectorAll(
        "[data-theme]",
      )) {
        ancestor.setAttribute("data-theme", value);
        if (value === "future-theme") {
          ancestor.style.setProperty("--color-base-100", "#dce3eb");
          ancestor.style.setProperty("--color-base-200", "#b6c1ce");
          ancestor.style.setProperty("--color-base-300", "#8e9dae");
          ancestor.style.setProperty("--color-base-content", "#263442");
        }
      }
      const style = globalThis.getComputedStyle(element);
      const context = globalThis.document
        .createElement("canvas")
        .getContext("2d");
      const rgb = (color) => {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const probe = globalThis.document.createElement("div");
      probe.style.backgroundColor = "var(--color-base-100)";
      probe.style.color = "var(--color-base-content)";
      element.append(probe);
      const expected = globalThis.getComputedStyle(probe);
      const result = {
        background: rgb(style.backgroundColor),
        text: rgb(style.color),
        expectedBackground: rgb(expected.backgroundColor),
        expectedText: rgb(expected.color),
      };
      probe.remove();
      return result;
    }, theme);
    assert.deepEqual(
      colors.background,
      colors.expectedBackground,
      `${theme}: screen uses the standard surface`,
    );
    assert.deepEqual(
      colors.text,
      colors.expectedText,
      `${theme}: screen uses the standard content ink`,
    );
  }
} finally {
  await browser.close();
}
