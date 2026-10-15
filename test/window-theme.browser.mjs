import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { chromium } from "playwright";

const frame = (id) => `<section id="${id}" class="caps-window">
  <header class="caps-window-header"><span class="caps-window-name">Backpack</span></header>
  <div class="caps-window-body"><button class="btn btn-primary caps-button caps-button-filled">Take</button></div>
</section>`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(`<div data-theme="field-guide">
    ${frame("plain")}
    <div data-theme="paper">
      ${frame("paper")}
      <div data-theme="coin">${frame("coin")}</div>
      <div data-theme="mocha">${frame("nested-palette")}</div>
      <div class="caps-hud-card" data-kind="letter"><div class="caps-hud-plate" id="nested-plate">Status</div></div>
    </div>
    <div class="caps-hud-plate" id="plain-plate">Status</div>
  </div><div data-theme="mocha">${frame("plain-palette")}</div>`);
  await page.addStyleTag({
    content: await readFile(
      new URL("../dist/styles.css", import.meta.url),
      "utf8",
    ),
  });
  const result = await page.evaluate(() => {
    const read = (id) => {
      const element = globalThis.document.getElementById(id);
      const style = globalThis.getComputedStyle(element);
      const header = globalThis.getComputedStyle(
        element.querySelector(".caps-window-header"),
      );
      const button = globalThis.getComputedStyle(
        element.querySelector("button"),
      );
      return {
        face: style.backgroundColor,
        border: style.border,
        shadow: style.boxShadow,
        header: header.backgroundColor,
        buttonBorder: button.borderWidth,
        buttonWeight: button.fontWeight,
      };
    };
    return {
      plain: read("plain"),
      paper: read("paper"),
      coin: read("coin"),
      nestedPalette: read("nested-palette"),
      plainPalette: read("plain-palette"),
      nestedPlate: globalThis.getComputedStyle(
        globalThis.document.getElementById("nested-plate"),
      ).boxShadow,
      plainPlate: globalThis.getComputedStyle(
        globalThis.document.getElementById("plain-plate"),
      ).boxShadow,
    };
  });
  assert.match(
    result.paper.border,
    /^2px solid /u,
    "paper supplies the window frame",
  );
  assert.equal(
    result.coin.border,
    result.paper.border,
    "nested coin retains paper's window frame",
  );
  assert.equal(
    result.coin.shadow,
    result.paper.shadow,
    "nested coin retains paper's window shadow",
  );
  assert.equal(result.paper.buttonBorder, "2px");
  assert.equal(result.paper.buttonWeight, "700");
  assert.equal(
    result.coin.buttonBorder,
    "3px",
    "coin independently changes the control finish",
  );
  assert.deepEqual(
    result.nestedPalette,
    result.plainPalette,
    "a complete nested palette resets the paper finish",
  );
  assert.notEqual(result.plain.shadow, result.paper.shadow);
  assert.equal(
    result.nestedPlate,
    result.plainPlate,
    "a large card's lift does not leak into its nested plate",
  );
  globalThis.console.log(
    "Window theme: inherited paper, independent coin controls, complete-palette reset and nested HUD lift passed.",
  );
} finally {
  await browser.close();
}
