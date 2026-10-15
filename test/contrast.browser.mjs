import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { URL } from "node:url";
import { chromium } from "playwright";

// WCAG AA for normal text and for the 3:1 non-text focus indicator.
const TEXT_AA = 4.5;
const FOCUS_AA = 3;

const read = (specifier) =>
  readFile(new URL(import.meta.resolve(specifier)), "utf8");
const stipe = await read("@fungi.computer/stipe/styles.css");
const caps = await read("@fungi.computer/caps/styles.css");

// The theme inventory is Stipe's own selectors; game finishes are measured
// inside the palettes they inherit.
const unique = (pattern) => [
  ...new Set([...stipe.matchAll(pattern)].map((match) => match[1])),
];
const themes = unique(/\[data-theme="([a-z0-9-]+)"\]/gu);
assert.ok(themes.length >= 10, `found themes: ${themes.join(", ")}`);

const gameThemes = ["ember", "tide", "tape", "sunrise"];
const combinations = themes
  .filter((theme) => !gameThemes.includes(theme))
  .map((theme) => ({ theme }));
// Game tints and end-card finishes inherit a field-guide palette. Measure the
// real composition, including tape selecting night colors beneath either tint.
for (const palette of ["field-guide", "field-guide-night"]) {
  for (const tint of [undefined, "ember", "tide"]) {
    for (const finish of [undefined, "tape", "sunrise"]) {
      combinations.push({ theme: palette, tint, finish });
    }
  }
}
combinations.push({ scheme: "light" }, { scheme: "dark" });

const browser = await chromium.launch();
const failures = [];
let measured = 0;
try {
  const page = await browser.newPage();
  await page.setContent(
    '<div id="palette"><div id="tint"><div id="scope"><a id="link" class="btn btn-link caps-button" href="#">Link</a><span id="ring"></span><span id="quiet" class="badge caps-badge badge-secondary caps-badge-quiet">2 GB RAM</span><article class="prose-caps"><a id="prose" href="#">Prose</a></article><div id="screen" class="caps-screen"></div></div></div></div>',
  );
  await page.evaluate(() => {
    const screen = globalThis.document.querySelector("#screen");
    for (const state of ["unchecked", "checked", "mixed"]) {
      const checkbox = globalThis.document.createElement("span");
      checkbox.className = "caps-checkbox";
      checkbox.dataset.state = state;
      checkbox.innerHTML =
        '<svg class="caps-checkbox-visual"><rect class="caps-checkbox-track" /></svg>';
      screen.append(checkbox);
    }
    for (const tone of [
      "neutral",
      "primary",
      "secondary",
      "accent",
      "success",
      "info",
      "warning",
      "error",
    ]) {
      const badge = globalThis.document.createElement("span");
      badge.className = `badge caps-badge caps-badge-quiet badge-${tone}`;
      badge.dataset.quietTone = tone;
      badge.textContent = "Quiet badge";
      globalThis.document.querySelector("#scope").append(badge);
    }
  });
  await page.addStyleTag({ content: caps });
  // Measure settled colors, not a mid-transition frame.
  await page.addStyleTag({
    content: "*, *::before, *::after { transition: none !important; }",
  });
  // A complete nested colorway resets an outer consulting colorway.
  for (const outer of ["consulting-night", "consulting-riso-glomzy"]) {
    const nested = await page.evaluate((theme) => {
      globalThis.document.documentElement.dataset.theme = theme;
      const scope = globalThis.document.querySelector("#scope");
      scope.dataset.theme = "consulting";
      const style = globalThis.getComputedStyle(scope);
      return { ink: style.color, paper: style.backgroundColor };
    }, outer);
    assert.deepEqual(nested, {
      ink: "rgb(61, 85, 136)",
      paper: "rgb(244, 238, 225)",
    });
  }
  await page.evaluate(() => {
    delete globalThis.document.documentElement.dataset.theme;
  });
  for (const combo of combinations) {
    await page.emulateMedia({ colorScheme: combo.scheme ?? "light" });
    const sample = await page.evaluate((c) => {
      const scope = globalThis.document.querySelector("#scope");
      scope.removeAttribute("data-theme");
      const palette = globalThis.document.querySelector("#palette");
      const tint = globalThis.document.querySelector("#tint");
      palette.removeAttribute("data-theme");
      tint.removeAttribute("data-theme");
      if (c.tint || c.finish) {
        palette.dataset.theme = c.theme;
        if (c.tint) tint.dataset.theme = c.tint;
        scope.dataset.theme = c.finish ?? "paper";
      } else if (c.theme) scope.dataset.theme = c.theme;
      const canvas = globalThis.document
        .createElement("canvas")
        .getContext("2d");
      const rgb = (color) => {
        canvas.clearRect(0, 0, 1, 1);
        canvas.fillStyle = "#000";
        canvas.fillStyle = color;
        canvas.fillRect(0, 0, 1, 1);
        return [...canvas.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const resolve = (property, target) => {
        const probe = globalThis.document.createElement("i");
        probe.style.color = `var(${property})`;
        target.append(probe);
        const value = globalThis.getComputedStyle(probe).color;
        probe.remove();
        return rgb(value);
      };
      const screen = globalThis.document.querySelector("#screen");
      const link = globalThis.document.querySelector("#link");
      const prose = globalThis.document.querySelector("#prose");
      const quiet = globalThis.document.querySelector("#quiet");
      return {
        quietBadge: rgb(globalThis.getComputedStyle(quiet).color),
        quiet: [...scope.querySelectorAll("[data-quiet-tone]")].map(
          (badge) => ({
            tone: badge.dataset.quietTone,
            ink: rgb(globalThis.getComputedStyle(badge).color),
          }),
        ),
        canvas100: resolve("--color-base-100", scope),
        canvas200: resolve("--color-base-200", scope),
        muted: resolve("--stipe-fg-muted", scope),
        ring: resolve("--caps-focus-ring", scope),
        buttonLink: rgb(globalThis.getComputedStyle(link).color),
        screenGlass: rgb(globalThis.getComputedStyle(screen).backgroundColor),
        screenInk: resolve("--caps-control-ink", screen),
        screenDim: resolve("--caps-control-dim", screen),
        checkboxes: [...screen.querySelectorAll(".caps-checkbox")].map(
          (box) => ({
            state: box.dataset.state,
            ink: rgb(globalThis.getComputedStyle(box).color),
            outline: rgb(
              globalThis.getComputedStyle(box.querySelector("rect")).stroke,
            ),
            depth: globalThis
              .getComputedStyle(box.querySelector("svg"))
              .getPropertyValue("--depth")
              .trim(),
          }),
        ),
        proseLink: rgb(globalThis.getComputedStyle(prose).color),
      };
    }, combo);
    const luminance = (channels) => {
      const [r, g, b] = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const label = Object.values(combo).join("/");
    for (const checkbox of sample.checkboxes) {
      assert.equal(checkbox.depth, "0", `${label} checkbox must be flat`);
      for (const [part, ink] of [
        ["ink", checkbox.ink],
        ["outline", checkbox.outline],
      ]) {
        measured += 1;
        const value = ratio(ink, sample.screenGlass);
        if (value < FOCUS_AA)
          failures.push(
            `${label} ${checkbox.state} checkbox ${part}: ${value.toFixed(2)}:1 < ${FOCUS_AA}`,
          );
      }
    }
    // Controls on a screen: lit ink reads as text, dim ink as a 3:1 shape.
    for (const [name, ink, floor] of [
      ["screen ink", sample.screenInk, TEXT_AA],
      ["screen dim", sample.screenDim, FOCUS_AA],
    ]) {
      measured += 1;
      const value = ratio(ink, sample.screenGlass);
      if (value < floor) {
        failures.push(
          `${label} ${name} on the screen: ${value.toFixed(2)}:1 < ${floor}`,
        );
      }
    }
    for (const [name, ink, floor] of [
      ["button link", sample.buttonLink, TEXT_AA],
      ["quiet badge", sample.quietBadge, TEXT_AA],
      ["prose link", sample.proseLink, TEXT_AA],
      ["focus ring", sample.ring, FOCUS_AA],
      // Hub uses the automatic Catppuccin theme; its supporting text must
      // remain readable on both the page and its cards.
      ...(!combo.theme || ["latte", "mocha"].includes(combo.theme)
        ? [["muted text", sample.muted, TEXT_AA]]
        : []),
      ...sample.quiet.map((badge) => [
        `quiet ${badge.tone}`,
        badge.ink,
        TEXT_AA,
      ]),
    ]) {
      for (const [surface, canvas] of [
        ["base-100", sample.canvas100],
        ["base-200", sample.canvas200],
      ]) {
        measured += 1;
        const value = ratio(ink, canvas);
        if (value < floor) {
          failures.push(
            `${label} ${name} on ${surface}: ${value.toFixed(2)}:1 < ${floor}`,
          );
        }
      }
    }
  }
} finally {
  await browser.close();
}
assert.deepEqual(failures, [], `contrast failures:\n${failures.join("\n")}`);
process.stdout.write(
  `contrast ok: ${combinations.length} theme combinations, ${measured} measurements\n`,
);
