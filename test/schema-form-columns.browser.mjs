import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const shotDirectory = process.env.CAPS_S1_SHOT_DIR;
const browser = await chromium.launch();
try {
  if (shotDirectory) await mkdir(shotDirectory, { recursive: true });
  for (const width of [1400, 390])
    for (const theme of ["latte", "mocha"]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        deviceScaleFactor: 2,
        reducedMotion: "reduce",
      });
      try {
        await page.goto(
          `${origin}/?story=forms--columns&mode=preview&theme=${theme}`,
        );
        await page.locator(".caps-columns-stage .caps-form").first().waitFor();
        await page.evaluate(() => globalThis.document.fonts.ready);
        const forms = await page
          .locator(".caps-columns-stage .caps-form")
          .evaluateAll((elements) =>
            elements.map((form) => {
              const fields = [...form.querySelectorAll(".caps-field")].filter(
                (field) => !field.closest(".caps-fieldset"),
              );
              return {
                fields: fields.map((field) => {
                  const row =
                    field.getAttribute("data-orientation") === "horizontal"
                      ? field.querySelector(":scope > .caps-field-row")
                      : field;
                  if (!row) throw new Error("Missing field row");
                  const label = field.querySelector(".caps-field-copy > label");
                  const control = field.querySelector(
                    ":scope > .caps-field-row > .caps-switch",
                  );
                  const style = globalThis.getComputedStyle(row);
                  return {
                    name: label?.textContent?.trim(),
                    orientation: field.getAttribute("data-orientation"),
                    display: style.display,
                    columns: style.gridTemplateColumns
                      .split(" ")
                      .filter(Boolean).length,
                    label: label
                      ? {
                          whiteSpace:
                            globalThis.getComputedStyle(label).whiteSpace,
                          textOverflow:
                            globalThis.getComputedStyle(label).textOverflow,
                          width: label.getBoundingClientRect().width,
                          title: label.title,
                          text: label.textContent?.trim(),
                          height: label.getBoundingClientRect().height,
                          lineHeight: Number.parseFloat(
                            globalThis.getComputedStyle(label).lineHeight,
                          ),
                        }
                      : null,
                    switchWidth: control?.getBoundingClientRect().width,
                  };
                }),
                groups: [...form.querySelectorAll(".caps-fieldset")].map(
                  (group) => {
                    const label = group.querySelector("legend");
                    const fields = group.querySelector(".caps-fieldset-fields");
                    if (!label || !fields)
                      throw new Error("Missing group legend or fields");
                    return {
                      name: label.textContent?.trim(),
                      display: globalThis.getComputedStyle(group).display,
                      columns:
                        fields.getBoundingClientRect().x -
                          label.getBoundingClientRect().x >
                        100
                          ? 2
                          : 1,
                      legend: label.getAttribute("title"),
                    };
                  },
                ),
              };
            }),
          );
        assert.equal(forms.length, 4, "the proof includes four opt-in forms");
        const expectedColumns = width === 1400 ? 2 : 1;
        for (const [formIndex, form] of forms.entries()) {
          assert.ok(form.fields.length > 0, `form ${formIndex} has fields`);
          for (const field of form.fields) {
            const context = `${width}/${theme}/form ${formIndex}/${field.name}`;
            assert.notEqual(
              field.orientation,
              "inline",
              `${context}: no inline choice in columns`,
            );
            assert.equal(field.display, "grid", `${context}: row is a grid`);
            assert.equal(
              field.columns,
              expectedColumns,
              `${context}: same layout for every field`,
            );
            if (width === 1400 && field.label) {
              assert.equal(
                field.label.whiteSpace,
                "nowrap",
                `${context}: label stays on one line`,
              );
              assert.equal(
                field.label.textOverflow,
                "ellipsis",
                `${context}: long label clips`,
              );
              assert.ok(
                field.label.width <= 145,
                `${context}: label fits the 9rem gutter`,
              );
              assert.ok(
                field.label.height <= field.label.lineHeight + 1,
                `${context}: label does not wrap`,
              );
              assert.ok(
                field.label.title &&
                  field.label.text?.startsWith(field.label.title),
                `${context}: full label is available`,
              );
            }
            if (field.switchWidth !== undefined)
              assert.ok(
                field.switchWidth <= 48,
                `${context}: switch width ${field.switchWidth}px`,
              );
          }
          for (const group of form.groups) {
            const context = `${width}/${theme}/form ${formIndex}/${group.name}`;
            assert.equal(group.display, "grid", `${context}: group is a grid`);
            assert.equal(
              group.columns,
              expectedColumns,
              `${context}: group follows the form layout`,
            );
            if (width === 1400)
              assert.equal(
                group.legend,
                group.name,
                `${context}: legend title`,
              );
          }
        }
        assert.ok(
          forms[1]?.fields.length > 10,
          "every declared field kind is in the narrow card, not a subset",
        );
        if (shotDirectory)
          await page.screenshot({
            path: resolve(shotDirectory, `columns-fixed-${width}-${theme}.png`),
            fullPage: true,
          });
        process.stdout.write(
          `PASS: ${width}/${theme}: ${forms.length} forms use ${expectedColumns} column(s); fixed switches and one-line labels\n`,
        );
      } finally {
        await page.close();
      }
    }
} finally {
  await browser.close();
}
