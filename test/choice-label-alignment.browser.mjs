import assert from "node:assert/strict";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const browser = await chromium.launch();
try {
  for (const width of [1440, 390])
    for (const theme of ["light", "dark"])
      for (const density of ["normal", "compact"]) {
        const page = await browser.newPage({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
        });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const story =
          density === "normal"
            ? "forms--choice-label-alignment"
            : "forms--choice-label-alignment-compact";
        await page.goto(
          `${origin}/?story=${story}&mode=preview&theme=${theme}`,
        );
        await page.locator(".screen-form-study").waitFor();
        await page.evaluate(() => globalThis.document.fonts.ready);
        const rows = await page
          .locator('.caps-field[data-orientation="inline"]')
          .evaluateAll((fields) =>
            fields.map((field) => {
              const input = field.querySelector("input");
              const label = field.querySelector(".caps-label");
              if (!input || !label || !input.parentElement)
                throw new Error("Missing native choice or label");
              const range = globalThis.document.createRange();
              range.selectNodeContents(label);
              const text = range.getClientRects()[0];
              if (!text) throw new Error("Missing label's first line");
              const control = input.parentElement.getBoundingClientRect();
              return {
                label: label.textContent,
                screen: !!field.closest(".caps-screen"),
                delta:
                  text.y + text.height / 2 - control.y - control.height / 2,
              };
            }),
          );
        assert.equal(
          rows.length,
          16,
          "both contexts include checkbox, mixed, disabled, wrapped and radio labels",
        );
        for (const row of rows)
          assert.ok(
            Math.abs(row.delta) <= 1,
            `${width}/${theme}/${density}/${row.screen ? "Screen" : "ordinary"}: ${row.label} first-line centre offset ${row.delta}px exceeds 1px`,
          );
        assert.deepEqual(errors, []);
        await page.close();
      }
  process.stdout.write(
    "PASS: first-line label centres within 1px of native checkbox/radio centres; both contexts, densities, themes and widths\n",
  );
} finally {
  await browser.close();
}
