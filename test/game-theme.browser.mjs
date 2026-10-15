import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { chromium } from "playwright";

// Retained game palette values. Tape selects night values even within a day
// game; the tint continues through the material boundary.
const primary = {
  moss: ["rgb(83, 103, 68)", "rgb(155, 169, 135)"],
  ember: ["rgb(164, 70, 42)", "rgb(224, 132, 85)"],
  tide: ["rgb(47, 98, 115)", "rgb(134, 185, 194)"],
};
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(15_000);
  const css = await readFile(
    new URL("../dist/styles.css", import.meta.url),
    "utf8",
  );
  let comparisons = 0;
  for (const palette of ["field-guide", "field-guide-night"]) {
    for (const tint of ["moss", "ember", "tide"]) {
      for (const finish of ["plain", "tape", "sunrise"]) {
        await page.setContent(`<div data-theme="${palette}"><div data-theme="paper"><div ${tint === "moss" ? "" : `data-theme="${tint}"`}>
          <section class="caps-hud-card" ${finish === "plain" ? "" : `data-theme="${finish}"`}>
            <h2 class="caps-hud-card-title"><span class="caps-hud-card-title-text">A new beginning</span></h2>
            <div class="caps-hud-card-body">The settlement carries on.</div>
            <button class="btn btn-primary caps-button caps-button-filled">Look around</button>
            <i id="primary" style="color:var(--color-primary)"></i>
            <div id="terminal" data-theme="phosphor"><i style="color:var(--color-primary)"></i></div>
          </section></div></div></div>`);
        await page.addStyleTag({ content: css });
        await page.addStyleTag({
          content:
            "*, *::before, *::after { transition: none !important; animation: none !important; }",
        });
        const sample = await page.evaluate(() => {
          const style = (selector) =>
            globalThis.getComputedStyle(
              globalThis.document.querySelector(selector),
            );
          return {
            primary: style("#primary").color,
            ink: style(".caps-hud-card").color,
            rimWidth: style(".caps-hud-card").borderTopWidth,
            rimColor: style(".caps-hud-card").borderTopColor,
            image: style(".caps-hud-card").backgroundImage,
            font: style(".caps-hud-card-body").fontFamily,
            titleFont: style(".caps-hud-card-title-text").fontFamily,
            buttonBorder: style("button").borderWidth,
            buttonShadow: style("button").boxShadow,
            terminal: style("#terminal i").color,
          };
        });
        const label = `${palette}/${tint}/${finish}`;
        const night = palette === "field-guide-night" || finish === "tape";
        assert.equal(
          sample.primary,
          primary[tint][night ? 1 : 0],
          `${label} tint`,
        );
        assert.equal(
          sample.ink,
          night ? "rgb(238, 228, 206)" : "rgb(41, 42, 34)",
          `${label} ink`,
        );
        assert.equal(
          sample.terminal,
          "rgb(180, 245, 117)",
          `${label} nested complete palette`,
        );
        assert.equal(sample.buttonBorder, "2px", `${label} paper controls`);
        assert.match(
          sample.buttonShadow,
          /0px 2px 0px 0px$/,
          `${label} paper control depth`,
        );
        if (finish === "tape") {
          assert.equal(sample.rimWidth, "6px", label);
          assert.equal(sample.rimColor, "rgb(200, 91, 72)", label);
          assert.equal(sample.font, "monospace", label);
          assert.equal(sample.titleFont, "monospace", label);
          assert.match(sample.image, /repeating-linear-gradient/, label);
        } else if (finish === "sunrise") {
          assert.equal(sample.rimWidth, "6px", label);
          assert.equal(sample.rimColor, "rgb(217, 155, 81)", label);
          assert.match(sample.image, /^linear-gradient/, label);
        } else
          assert.match(sample.image, /^url\("data:image\/svg\+xml,/, label);
        comparisons += 1;
      }
    }
  }
  globalThis.console.log(
    `Game theme: ${comparisons} day/night tint and end-card compositions passed.`,
  );
  for (const host of [
    "latte",
    "mocha",
    "field-guide",
    "field-guide-night",
    "consulting",
    "phosphor",
    "codec",
  ]) {
    await page.setContent(`<div data-theme="${host}">
      <div id="host-scrim" class="caps-game-scrim"></div>
      <div class="caps-game-shell"><div data-theme="field-guide"><div data-theme="paper">
        <div id="game-scrim" class="caps-game-scrim"></div>
      </div></div></div></div>`);
    await page.addStyleTag({ content: css });
    const colors = await page.evaluate(() =>
      ["#host-scrim", "#game-scrim"].map(
        (selector) =>
          globalThis.getComputedStyle(
            globalThis.document.querySelector(selector),
          ).backgroundColor,
      ),
    );
    assert.equal(
      colors[1],
      colors[0],
      `${host}: nested game retains host scrim`,
    );
  }
  globalThis.console.log("Game scrim: all seven host palettes retained.");
} finally {
  await browser.close();
}
