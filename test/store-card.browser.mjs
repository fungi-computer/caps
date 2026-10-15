import assert from "node:assert/strict";
import process from "node:process";
import { URL } from "node:url";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { StoreCard } from "../dist/components/store-card.js";

const styles = await readFile(
  new URL("../dist/styles.css", import.meta.url),
  "utf8",
);
const markup = renderToStaticMarkup(
  createElement(StoreCard, {
    layout: "split",
    variant: "cartridge",
    title: "A small world",
    tagline:
      "Fell the grove, raise walls and brew the first ale before the guests lose patience.",
    cover: createElement("img", {
      src:
        "data:image/svg+xml," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"/>',
        ),
      alt: "World",
    }),
    href: "/play",
    seller: "Made by Ada · 37 plays",
    badges: ["Colony sim", "Staff pick"],
    action: createElement("a", { href: "/play" }, "Play"),
  }),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(markup);
  await page.addStyleTag({ content: styles });
  for (const width of [390, 1440])
    for (const theme of ["latte", "mocha"]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator("html").evaluate((root, theme) => {
        root.dataset.theme = theme;
      }, theme);
      const layout = await page.locator(".caps-store-card").evaluate((card) => {
        const rect = (selector) => {
          const box = card.querySelector(selector).getBoundingClientRect();
          return { x: box.x, y: box.y, right: box.right, bottom: box.bottom };
        };
        return {
          cover: rect(".caps-store-cover"),
          heading: rect(".caps-store-heading"),
          footer: rect(".caps-store-footer"),
          overflow:
            card.ownerDocument.documentElement.scrollWidth -
            card.ownerDocument.defaultView.innerWidth,
          nestedLinks: card.querySelectorAll("a a").length,
        };
      });
      assert.equal(
        layout.overflow,
        0,
        `${width}/${theme}: horizontal overflow`,
      );
      assert.equal(layout.nestedLinks, 0);
      assert.ok(
        layout.footer.y >= layout.heading.bottom - 1,
        "metadata overlaps description",
      );
      if (width === 1440) {
        assert.ok(
          layout.heading.x >= layout.cover.right - 1,
          "copy must sit beside the cover",
        );
        assert.ok(
          layout.footer.x >= layout.cover.right - 1,
          "metadata and action must sit beside the cover",
        );
      } else {
        assert.ok(
          layout.heading.y >= layout.cover.bottom - 1,
          "mobile copy must follow the cover",
        );
      }
    }
  await page.locator(".caps-store-open").focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator(".caps-store-action a")
      .evaluate((link) => link === link.ownerDocument.activeElement),
    true,
  );
  process.stdout.write(
    "PASS StoreCard split layout: 390/1440, latte/mocha, separate keyboard controls\n",
  );
} finally {
  await browser.close();
}
