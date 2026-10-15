import assert from "node:assert/strict";
import { chromium } from "playwright";
import process from "node:process";
import { URL } from "node:url";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppStatusBar } from "../dist/blocks/app-status-bar.js";
import { KeycapButton } from "../dist/components/keycap.js";

const origin = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const browser = await chromium.launch();
try {
  const css = await readFile(
    new URL(import.meta.resolve("@fungi.computer/caps/styles.css")),
    "utf8",
  );
  for (const width of [1440, 390])
    for (const theme of ["latte", "mocha"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.setContent(
        renderToStaticMarkup(
          createElement(
            "div",
            { "data-theme": theme },
            createElement(
              AppStatusBar,
              null,
              createElement(KeycapButton, { label: "Agents", expanded: true }),
              createElement(KeycapButton, {
                label: "Conversations",
                expanded: false,
              }),
            ),
            createElement(
              "div",
              { id: "outside" },
              createElement(KeycapButton, { label: "Outside", expanded: true }),
            ),
          ),
        ),
      );
      await page.addStyleTag({ content: css });
      const gaps = await page
        .locator(".caps-app-status-bar .caps-keycap-button")
        .evaluateAll((buttons) =>
          buttons.map((button) => {
            const lamp = button
              .querySelector(".caps-keycap-led")
              .getBoundingClientRect();
            const label = button
              .querySelector(".caps-keycap-button-label")
              .getBoundingClientRect();
            return {
              actual: label.left - lamp.right,
              expected: Number.parseFloat(
                globalThis.getComputedStyle(button).columnGap,
              ),
            };
          }),
        );
      for (const gap of gaps)
        assert.ok(
          Math.abs(gap.actual - gap.expected) <= 1,
          `${width}/${theme}: disclosure lamp uses the normal item gap (${gap.actual}px vs ${gap.expected}px)`,
        );
      assert.equal(
        await page
          .locator("#outside .caps-keycap-led")
          .evaluate((lamp) => globalThis.getComputedStyle(lamp).position),
        "absolute",
        "keys outside the status bar retain their corner lamp",
      );
      await page.close();
    }
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await page.goto(`${origin}/?story=layouts--viewport-edge&mode=preview`);
    const launcher = page.getByRole("button", {
      name: "Edge Apps",
      exact: true,
    });
    await launcher.click();
    for (const name of ["Library", "New chat"]) {
      const item = page.getByRole("button", { name, exact: true });
      await item.waitFor({ state: "visible" });
      const box = await item.boundingBox();
      assert.ok(
        box &&
          box.x >= 0 &&
          box.y >= 0 &&
          box.x + box.width <= width &&
          box.y + box.height <= 900,
        `${name} stays inside ${width}px viewport`,
      );
      assert.equal(
        await item.evaluate((node) =>
          node.closest("[data-side]")?.getAttribute("data-side"),
        ),
        "top",
        `${name} flips above the bottom-edge bar`,
      );
    }
    await page.getByRole("button", { name: "New chat", exact: true }).click();
    assert.equal(
      await page.getByLabel("Dial edge result").textContent(),
      "Chat selected",
    );
    assert.equal(await launcher.getAttribute("aria-expanded"), "false");
    await launcher.click();
    await page.getByRole("button", { name: "Library", exact: true }).click();
    assert.equal(
      await page.getByLabel("Dial edge result").textContent(),
      "Library selected",
    );
    await page.close();
  }
} finally {
  await browser.close();
}
