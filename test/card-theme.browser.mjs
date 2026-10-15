import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { chromium } from "playwright";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Card } from "../dist/components/card.js";
import { GameShareCard } from "../dist/blocks/game-share-card.js";

const themes = [
  "latte",
  "mocha",
  "field-guide",
  "field-guide-night",
  "consulting",
  "phosphor",
  "codec",
];
const css = await readFile(
  new URL("../dist/styles.css", import.meta.url),
  "utf8",
);
const card = (id, props = {}) =>
  h(Card, { id, ...props }, h("a", { href: "#play" }, "Play"));
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    for (const theme of themes) {
      await page.setContent(
        renderToStaticMarkup(
          h(
            "div",
            { "data-theme": theme },
            card("plain-surface"),
            h(
              "div",
              { "data-theme": "vishnu" },
              card("inherited-surface"),
              card("stage", { variant: "outline" }),
              card("interactive", { variant: "interactive" }),
              card("featured", { featured: true, variant: "interactive" }),
              card("empty", { state: "empty" }),
              h(
                GameShareCard,
                {
                  id: "share",
                  heading: "A game",
                  action: h("a", { href: "#play" }, "Play"),
                },
                "Details",
              ),
              h(
                "div",
                { "data-theme": "mocha" },
                card("nested-palette", { variant: "outline" }),
              ),
            ),
            h(
              "div",
              { "data-theme": "mocha" },
              card("plain-palette", { variant: "outline" }),
            ),
          ),
        ),
      );
      await page.addStyleTag({ content: css });
      const result = await page.evaluate(() => {
        const read = (id) => {
          const style = globalThis.getComputedStyle(
            globalThis.document.getElementById(id),
          );
          return {
            face: style.backgroundColor,
            image: style.backgroundImage,
            border: style.border,
            shadow: style.boxShadow,
            font: style.font,
            color: style.color,
          };
        };
        return Object.fromEntries(
          [
            "plain-surface",
            "inherited-surface",
            "stage",
            "interactive",
            "featured",
            "empty",
            "share",
            "nested-palette",
            "plain-palette",
          ].map((id) => [id, read(id)]),
        );
      });
      assert.deepEqual(
        result["inherited-surface"],
        result["plain-surface"],
        `${theme}: ordinary nested surfaces retain their face`,
      );
      assert.deepEqual(
        result["nested-palette"],
        result["plain-palette"],
        `${theme}: complete palette resets the finish`,
      );
      assert.match(
        result.stage.border,
        /^3px solid /u,
        `${theme}: outlined stage frame`,
      );
      assert.match(
        result.empty.border,
        /^3px dashed /u,
        `${theme}: empty state`,
      );
      assert.match(
        result.featured.border,
        /^3px solid /u,
        `${theme}: featured frame`,
      );
      assert.match(
        result.interactive.image,
        /linear-gradient/u,
        `${theme}: interactive face`,
      );
      assert.equal(
        result.share.image,
        result.interactive.image,
        `${theme}: block consumes the same theme face`,
      );
      assert.equal(
        result.stage.font,
        result["plain-surface"].font,
        `${theme}: enclosing typography survives`,
      );
      await page.locator("#share").hover();
      assert.equal(
        await page
          .locator("#share")
          .evaluate(
            (element) => globalThis.getComputedStyle(element).animationName,
          ),
        "caps-card-wiggle",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      assert.equal(
        await page
          .locator("#share")
          .evaluate(
            (element) => globalThis.getComputedStyle(element).animationName,
          ),
        "none",
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
  } finally {
    await context.close();
  }
  globalThis.console.log(
    `Card theme: ${themes.length} palettes; nested surfaces, complete-palette reset, semantic states and reduced motion passed.`,
  );
} finally {
  await browser.close();
}
