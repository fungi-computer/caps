import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import process from "node:process";
import { chromium } from "playwright";

const base = process.env.CAPS_WORKBENCH_URL ?? "http://localhost:61007";
for (const name of [
  "button",
  "card",
  "badge",
  "select",
  "scroll-area",
  "window",
]) {
  const recipe = JSON.parse(
    await readFile(
      new URL(`../registry/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
  assert.ok(recipe.css['@import "@fungi.computer/stipe/styles.css"']);
  if (name === "button") {
    // Stipe 255b84c0f38 (Levi, 2026-10-13) deliberately excludes Buttons
    // from --stipe-shadow-raised so their own faint top highlight survives.
    const material =
      recipe.css["@layer utilities"][
        ".caps-button-filled,.caps-button.btn-outline"
      ];
    const filled = recipe.css["@layer utilities"][".caps-button-filled"];
    const outline = recipe.css["@layer utilities"][".caps-button.btn-outline"];
    assert.deepEqual(
      {
        lip: material["--caps-key-lip"],
        resting: material["--caps-key-rest-shadow"],
        pressed: material["--caps-key-pressed-shadow"],
        filledHighlight: filled["--caps-key-top-edge"],
        filledDrop: filled["--caps-button-filled-drop"],
        filledShadow: filled.boxShadow,
        outlineShadow: outline.boxShadow,
      },
      {
        lip: "calc(var(--depth) * 1px)",
        resting:
          "inset 0 1px 0\n        oklch(100% 0 0 / calc(var(--depth) * var(--caps-key-top-edge, 0.14))),\n      0 var(--caps-key-lip) 0\n        color-mix(\n          in oklab,\n          var(--caps-key-face),\n          var(--caps-key-lip-ink, var(--color-base-content)) 14%\n        )",
        pressed:
          "inset 0 1px 0 oklch(0% 0 0 / calc(var(--depth) * 0.08)), 0 0 0 transparent",
        filledHighlight: "0.06",
        filledDrop:
          "var(\n      --caps-button-drop,\n      var(--caps-key-rest-shadow)\n    )",
        filledShadow: "var(--caps-button-filled-drop)",
        outlineShadow:
          "var(\n      --caps-button-outline-drop,\n      var(--caps-button-drop, var(--caps-key-rest-shadow))\n    )",
      },
      "button: registry preserves the exact independent key material",
    );
    assert.doesNotMatch(JSON.stringify(recipe.css), /--stipe-shadow-raised/u);
  } else {
    assert.match(
      JSON.stringify(recipe.css),
      /--stipe-shadow-/u,
      `${name}: registry includes material consumption`,
    );
  }
}
const browser = await chromium.launch();
try {
  // Exercise the public compiled CSS without Ladle's source aliases or provider.
  const delivery = await browser.newPage();
  await delivery.setContent(
    '<div class="caps-surface" id="outer"><div class="caps-surface" id="inner"><div class="caps-screen">Public display <code class="font-mono">/machine/value</code></div></div></div><button class="btn btn-primary caps-button caps-button-filled" disabled>Queue</button>',
  );
  await delivery.addStyleTag({
    content: await readFile(
      new URL(import.meta.resolve("@fungi.computer/caps/styles.css")),
      "utf8",
    ),
  });
  for (const theme of [
    "latte",
    "mocha",
    "field-guide",
    "field-guide-night",
    "phosphor",
    "codec",
    "light",
    "dark",
  ]) {
    const result = await delivery.evaluate((name) => {
      globalThis.document.documentElement.dataset.theme = name;
      const screen = globalThis.document.querySelector(".caps-screen");
      const style = globalThis.getComputedStyle(screen);
      const nestedSurface = globalThis.document.querySelector("#inner");
      const nestedStyle = globalThis.getComputedStyle(nestedSurface);
      const queue = globalThis.document.querySelector("button");
      const queueStyle = globalThis.getComputedStyle(queue);
      const canvas = globalThis.document
        .createElement("canvas")
        .getContext("2d");
      const luminance = (color) => {
        canvas.fillStyle = color;
        canvas.fillRect(0, 0, 1, 1);
        const linear = [...canvas.getImageData(0, 0, 1, 1).data]
          .slice(0, 3)
          .map((channel) => {
            const value = channel / 255;
            return value <= 0.04045
              ? value / 12.92
              : ((value + 0.055) / 1.055) ** 2.4;
          });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      // Resolve paired theme tokens through CSS so assertions check painted colours.
      const painted = (token) => {
        const probe = globalThis.document.createElement("span");
        probe.style.color = `var(${token})`;
        globalThis.document.body.append(probe);
        const color = globalThis.getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const ink = luminance(style.color);
      const face = luminance(style.backgroundColor);
      const nested = globalThis.document.createElement("div");
      nested.dataset.theme = name;
      globalThis.document.body.append(nested);
      const rootMuted = globalThis
        .getComputedStyle(globalThis.document.documentElement)
        .getPropertyValue("--stipe-fg-muted");
      const surface = globalThis.document.querySelector(".caps-surface");
      const surfaceStyle = globalThis.getComputedStyle(surface);
      const nestedMuted = globalThis
        .getComputedStyle(nested)
        .getPropertyValue("--stipe-fg-muted");
      nested.remove();
      return {
        rootMuted,
        nestedMuted,
        contrast: (Math.max(ink, face) + 0.05) / (Math.min(ink, face) + 0.05),
        queueOpacity: queueStyle.opacity,
        queueOutline: queueStyle.outlineStyle,
        screenFont: style.fontFamily,
        sansFont: globalThis
          .getComputedStyle(globalThis.document.documentElement)
          .getPropertyValue("--font-sans")
          .trim(),
        nestedFrame: nestedStyle.borderTopWidth,
        nestedShadow: nestedStyle.boxShadow,
        nestedEdge: globalThis.getComputedStyle(nestedSurface, "::before")
          .boxShadow,
        frame: globalThis.getComputedStyle(
          globalThis.document.querySelector("#outer"),
        ).borderTopWidth,
        depth: globalThis
          .getComputedStyle(globalThis.document.documentElement)
          .getPropertyValue("--depth")
          .trim(),
        linework: painted("--stipe-linework"),
        cardPaper: painted("--card-paper"),
        cardBackPaper: painted("--card-back-paper"),
        cardRule: painted("--card-rule"),
        cardInk: painted("--card-ink"),
        newsprintRule: painted("--newsprint-column-rule"),
        marginaliaInk: painted("--marginalia-ink"),
        spore: painted("--growth-spore"),
        mycelium: painted("--growth-mycelium"),
        fruiting: painted("--growth-fruiting"),
        surfaceRadius: surfaceStyle.borderTopLeftRadius,
      };
    }, theme);
    assert.ok(
      result.contrast >= 4.5,
      `${theme}: display text contrast ${result.contrast}`,
    );
    assert.match(result.screenFont, /Nunito/u, `${theme}: screen uses sans`);
    assert.equal(
      result.queueOutline,
      "none",
      `${theme}: disabled Queue does not become an outline`,
    );
    assert.equal(result.nestedFrame, "1px", `${theme}: nested casing is flat`);
    assert.equal(result.nestedShadow, "none", `${theme}: nested depth is flat`);
    assert.equal(result.nestedEdge, "none", `${theme}: nested edge is flat`);
    assert.equal(result.queueOpacity, "0.45", `${theme}: disabled Queue dims`);
    if (theme === "field-guide")
      assert.equal(result.cardBackPaper, "rgb(238, 236, 228)");
    if (theme === "field-guide-night")
      assert.equal(result.cardBackPaper, "rgb(41, 59, 63)");
    assert.equal(
      result.rootMuted,
      result.nestedMuted,
      `${theme}: root and nested muted ink agree`,
    );
    // Stipe 255b84c0f38 (Levi, 2026-10-13) deliberately gives everyday
    // palettes a 1px quiet-plastic rim; the flat themes already use 1px.
    assert.equal(
      result.frame,
      "1px",
      `${theme}: surface keeps its hairline rim`,
    );
    if (theme === "field-guide") {
      assert.equal(result.depth, "0");
      assert.equal(result.linework, "rgb(41, 42, 34)");
      assert.equal(result.surfaceRadius, "3px");
      assert.deepEqual(
        [
          result.cardPaper,
          result.cardRule,
          result.cardInk,
          result.newsprintRule,
          result.marginaliaInk,
          result.spore,
          result.mycelium,
          result.fruiting,
        ],
        [
          "rgb(246, 246, 242)",
          "rgb(98, 91, 73)",
          "rgb(41, 42, 34)",
          "rgb(200, 194, 179)",
          "rgb(98, 91, 73)",
          "rgb(167, 108, 55)",
          "rgb(83, 103, 68)",
          "rgb(158, 81, 69)",
        ],
      );
    }
    if (theme === "field-guide-night") {
      assert.equal(result.depth, "0");
      assert.equal(result.linework, "rgb(238, 228, 206)");
      assert.equal(result.surfaceRadius, "3px");
      assert.deepEqual(
        [
          result.cardPaper,
          result.cardRule,
          result.cardInk,
          result.newsprintRule,
          result.marginaliaInk,
          result.spore,
          result.mycelium,
          result.fruiting,
        ],
        [
          "rgb(32, 50, 55)",
          "rgb(192, 182, 159)",
          "rgb(238, 228, 206)",
          "rgb(82, 99, 103)",
          "rgb(192, 182, 159)",
          "rgb(194, 154, 105)",
          "rgb(155, 169, 135)",
          "rgb(189, 129, 117)",
        ],
      );
    }
  }
  // A finish changes material only; its complete parent still owns type/colour.
  await delivery.addStyleTag({
    content:
      '[data-theme="test-finish"] { --root-bg: transparent; --depth: 0; }',
  });
  for (const theme of ["latte", "consulting"]) {
    const nested = await delivery.evaluate((name) => {
      const parent = globalThis.document.createElement("section");
      parent.dataset.theme = name;
      const finish = globalThis.document.createElement("div");
      finish.dataset.theme = "test-finish";
      parent.append(finish);
      globalThis.document.body.append(parent);
      const properties = [
        "--font-sans",
        "--font-mono",
        "--radius-button",
        "--stipe-fg-muted",
        "--color-primary",
        "--color-base-content",
        "color-scheme",
      ];
      const read = (node) =>
        properties.map((key) =>
          globalThis.getComputedStyle(node).getPropertyValue(key).trim(),
        );
      const result = {
        parent: read(parent),
        finish: read(finish),
        background: globalThis.getComputedStyle(finish).backgroundColor,
      };
      parent.remove();
      return result;
    }, theme);
    assert.deepEqual(
      nested.finish,
      nested.parent,
      `${theme}: finish inherits typography and palette`,
    );
    assert.equal(
      nested.background,
      "rgba(0, 0, 0, 0)",
      `${theme}: finish does not paint a page`,
    );
  }
  await delivery.addStyleTag({
    content: `[data-theme="test-button-finish"] {
      --root-bg: transparent;
      --caps-button-border-width: 3px;
      --caps-button-weight: 900;
      --caps-button-drop: 0 6px 0 rgb(20 30 40);
      --caps-button-drop-active: none;
      --caps-button-press: 6px;
    }`,
  });
  await delivery.evaluate(() => {
    globalThis.document.body.insertAdjacentHTML(
      "beforeend",
      `<div data-theme="latte"><div data-theme="test-button-finish">
    <button class="btn btn-primary caps-button caps-button-filled">Filled finish</button>
    <button class="btn btn-outline caps-button">Outline finish</button>
  </div></div>`,
    );
  });
  for (const name of ["Filled finish", "Outline finish"]) {
    const button = delivery.getByRole("button", { name, exact: true });
    const resting = await button.evaluate((element) => {
      const style = globalThis.getComputedStyle(element);
      return [style.borderTopWidth, style.fontWeight, style.boxShadow];
    });
    assert.deepEqual(resting, [
      "3px",
      "900",
      "rgb(20, 30, 40) 0px 6px 0px 0px",
    ]);
    await button.hover();
    await delivery.mouse.down();
    // Finish state, independent of the transition's intermediate painted frame.
    await delivery.addStyleTag({
      content: ".caps-button { transition: none !important; }",
    });
    const pressed = await button.evaluate((element) => {
      const style = globalThis.getComputedStyle(element);
      return [style.translate, style.boxShadow];
    });
    assert.deepEqual(pressed, ["0px 6px", "none"]);
    await delivery.mouse.up();
  }
  await delivery.close();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.goto(
    `${base}/?story=foundations--material-themes--compare&mode=preview`,
  );
  const latte = page.getByRole("region", { name: "latte comparison" });
  const phosphor = page.getByRole("region", { name: "phosphor comparison" });
  await latte.waitFor();
  await latte.getByLabel("Find a computer").fill("Studio");
  assert.equal(
    await phosphor.getByLabel("Find a computer").inputValue(),
    "Studio",
  );
  await latte.getByRole("option", { name: "Studio" }).click();
  assert.equal(
    await phosphor
      .getByRole("option", { name: "Studio" })
      .getAttribute("aria-selected"),
    "true",
  );
  await latte.getByLabel("Example permission").uncheck();
  assert.equal(
    await phosphor.getByLabel("Example permission").isChecked(),
    false,
  );
  await phosphor.getByRole("button", { name: "Example action" }).click();
  assert.equal(
    await latte.getByRole("status").textContent(),
    "Example actions: 1",
  );
  await latte.getByLabel("Find a computer").fill("");
  const viewport = phosphor.locator(".caps-scroll-viewport");
  assert.equal(
    await viewport.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
    true,
  );
  await viewport.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  assert.ok(await viewport.evaluate((element) => element.scrollTop > 0));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () =>
        globalThis.document.documentElement.scrollWidth <=
        globalThis.innerWidth,
    ),
    true,
  );

  await page.goto(
    `${base}/?story=foundations--material-conformance--nested&mode=preview`,
  );
  const outer = page.getByLabel("Outer theme", { exact: true });
  const inner = page.getByLabel("Inner theme", { exact: true });
  await inner.waitFor();
  const sample = page.getByRole("region", { name: "Inner theme sample" });
  const themes = ["latte", "mocha", "phosphor", "codec", "light", "dark"];
  for (const theme of themes) {
    await inner.selectOption(theme);
    let expected;
    for (const enclosing of themes) {
      await outer.selectOption(enclosing);
      const actual = await sample.evaluate((element) => {
        const frame = globalThis.getComputedStyle(
          element.querySelector(".caps-surface"),
        );
        const screen = globalThis.getComputedStyle(
          element.querySelector(".caps-screen"),
        );
        const button = globalThis.getComputedStyle(
          element.querySelector(".caps-button"),
        );
        return {
          frame: frame.borderTopWidth,
          shadow: frame.boxShadow,
          image: frame.backgroundImage,
          ink: screen.color,
          face: screen.backgroundColor,
          texture: screen.backgroundImage,
          radius: button.borderRadius,
        };
      });
      expected ??= actual;
      assert.deepEqual(
        actual,
        expected,
        `${enclosing} > ${theme} must be isolated`,
      );
    }
    await sample.getByRole("button", { name: "Open themed dialog" }).click();
    const dialog = page.getByRole("dialog");
    assert.equal(
      await dialog.evaluate((element) =>
        element.closest("[data-theme]").getAttribute("data-theme"),
      ),
      theme,
    );
    await dialog.getByLabel("Dialog draft").fill(`Draft ${theme}`);
    await dialog.getByRole("button", { name: "Close dialog" }).click();
    await sample.getByRole("button", { name: "Open themed dialog" }).click();
    assert.equal(
      await dialog.getByLabel("Dialog draft").inputValue(),
      `Draft ${theme}`,
    );
    await page.keyboard.press("Escape");
    await sample.getByRole("button", { name: "Computer", exact: true }).click();
    const list = page.getByRole("listbox");
    assert.equal(
      await list.evaluate((element) =>
        element.closest("[data-theme]").getAttribute("data-theme"),
      ),
      theme,
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await sample
        .getByRole("button", { name: "Disabled action" })
        .isDisabled(),
      true,
    );
    const field = sample.getByRole("textbox", { name: "Invalid field" });
    await field.focus();
    assert.equal(await field.getAttribute("aria-invalid"), "true");
    assert.equal(
      await field.evaluate(
        (element) => element === globalThis.document.activeElement,
      ),
      true,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  const field = sample.getByRole("textbox", { name: "Normal field" });
  await field.focus();
  const accessible = await field.evaluate((element) => {
    const style = globalThis.getComputedStyle(element);
    return {
      outline: style.outlineStyle,
      transition: style.transitionDuration,
      transitionProperty: style.transitionProperty,
    };
  });
  assert.notEqual(accessible.outline, "none");
  // Stipe permits a short opacity fade, with spatial transitions suppressed.
  assert.equal(accessible.transitionProperty, "opacity");
  assert.equal(accessible.transition, "0.12s");
  await page.goto(
    `${base}/?story=editorial--technonomicon--cigarette-card-front-back&mode=preview`,
  );
  const card = page.locator(".caps-cigarette-card").first();
  await card.waitFor();
  assert.equal(
    await card
      .locator(".caps-cigarette-card-stat-value")
      .first()
      .evaluate((element) => globalThis.getComputedStyle(element).textAlign),
    "right",
  );
  assert.equal(
    await card.locator(".caps-cigarette-card-back").getAttribute("aria-hidden"),
    "true",
  );
  const cardBox = await card.boundingBox();
  assert.ok(
    cardBox && Math.abs(cardBox.height / cardBox.width - 88 / 63) < 0.01,
    "cigarette cards keep the 63:88 playing-card ratio",
  );
  await card.focus();
  await page.keyboard.press("Enter");
  assert.equal(await card.getAttribute("aria-pressed"), "true");
  const cardMotion = await card
    .locator(".caps-cigarette-card-inner")
    .evaluate((element) => globalThis.getComputedStyle(element).transform);
  assert.equal(cardMotion, "none");
  await page.keyboard.press("Space");
  assert.equal(await card.getAttribute("aria-pressed"), "false");
  await card.click();
  assert.equal(await card.getAttribute("aria-pressed"), "true");
  const touchPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  await touchPage.goto(
    `${base}/?story=editorial--technonomicon--cigarette-card-front-back&mode=preview`,
  );
  const touchCard = touchPage.locator(".caps-cigarette-card").first();
  await touchCard.waitFor();
  await touchCard.tap();
  assert.equal(await touchCard.getAttribute("aria-pressed"), "true");
  await touchPage.close();
  await page.goto(
    `${base}/?story=editorial--technonomicon--sketch-annotations&mode=preview`,
  );
  const overlay = page.locator(".caps-sketch-overlay").first();
  await overlay.waitFor({ state: "attached" });
  assert.ok((await overlay.locator("path").count()) >= 3);
  assert.equal(
    await overlay.locator("path").first().getAttribute("stroke"),
    "currentColor",
  );
  globalThis.console.log(
    "Material themes and editorial cards: theme tokens, controls, scroll, 36 nested pairs, themed portals, draft retention, focus, reduced motion, and card click/tap/Enter/Space, and the sketch layer passed.",
  );
} finally {
  await browser.close();
}
