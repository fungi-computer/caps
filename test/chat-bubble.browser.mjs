import process from "node:process";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { ChatBubble } from "../dist/components/chat-bubble.js";

const styles = await readFile(
  new URL("../dist/styles.css", import.meta.url),
  "utf8",
);
const content = renderToStaticMarkup(
  createElement(
    "div",
    { className: "prose" },
    ...["settled", "pending", "error"].map((state) =>
      createElement(
        ChatBubble,
        { side: "agent", state, key: state, name: "Shiitake" },
        createElement(
          "div",
          null,
          createElement("p", null, "A little room to breathe."),
          createElement("p", null, "And a second thought."),
        ),
      ),
    ),
  ),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(content);
  await page.addStyleTag({ content: styles });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["latte", "mocha"]) {
      await page.locator("html").evaluate((root, value) => {
        root.dataset.theme = value;
      }, theme);
      const rhythm = await page
        .locator(".caps-chat-body")
        .evaluateAll((bodies) =>
          bodies.map((body) => {
            const paragraphs = body.querySelectorAll("p");
            return {
              first: globalThis.getComputedStyle(paragraphs[0]).marginTop,
              last: globalThis.getComputedStyle(paragraphs[1]).marginBottom,
              between: parseFloat(
                globalThis.getComputedStyle(paragraphs[1]).marginTop,
              ),
              fits: body.getBoundingClientRect().right <= globalThis.innerWidth,
            };
          }),
        );
      for (const turn of rhythm) {
        assert.equal(turn.first, "0px", "the bubble owns its top padding");
        assert.equal(turn.last, "0px", "the bubble owns its bottom padding");
        assert.ok(
          turn.between > 0,
          "separate paragraphs keep their reading gap",
        );
        assert.ok(turn.fits, "turns fit the viewport");
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  const dots = await page
    .locator(".caps-chat-typing i")
    .evaluateAll((items) =>
      items.map((item) => globalThis.getComputedStyle(item).animationName),
    );
  assert.deepEqual(dots, ["none", "none", "none"]);
} finally {
  await browser.close();
}
process.stdout.write(
  "ChatBubble rich text fits both widths and themes; reduced-motion dots stay still.\n",
);
