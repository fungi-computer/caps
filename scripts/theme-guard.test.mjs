import assert from "node:assert/strict";
import { test } from "node:test";
import {
  componentOwners,
  cssViolations,
  sourceTree,
  sourceViolations,
} from "./theme-guard.mjs";

const source = (text, options) =>
  sourceViolations(sourceTree(text, "probe.tsx"), options);
const owners = componentOwners([
  sourceTree('const classes = "caps-button caps-button-filled";', "button.tsx"),
  sourceTree('const classes = "caps-card caps-card-title";', "card.tsx"),
]);

test("colors belong to themes; component strings and CSS values cannot carry hex", () => {
  for (const text of [
    'const style = { color: "#abc" };',
    "const fill = `#12345678`;",
    '<svg fill="#abcdef" />',
    "const style = `linear-gradient(${color}, #fff)`;",
  ])
    assert.match(source(text).join("\n"), /hex literals/u);
  for (const css of [
    ".x { color: #abc; }",
    ".x { background: linear-gradient(#12345678, transparent); }",
  ])
    assert.match(cssViolations(css, "probe.css").join("\n"), /hex literals/u);
  assert.deepEqual(
    source('const style = { color: "var(--color-primary)" }; // #fff'),
    [],
  );
  assert.deepEqual(
    cssViolations(
      '.x { fill: url("#abc"); color: var(--color-primary); } /* #fff */',
      "probe.css",
    ),
    [],
  );
});

test("CSS can consume a theme boundary but never branch on its name", () => {
  assert.deepEqual(
    cssViolations(
      "[data-theme] { --local: var(--color-primary); }",
      "probe.css",
    ),
    [],
  );
  for (const selector of [
    '[data-theme="latte"]',
    ":where([data-theme=mocha])",
    '[data-theme^="field"]',
  ])
    assert.match(
      cssViolations(
        `${selector} .caps-button { color: red; }`,
        "probe.css",
      ).join("\n"),
      /theme name/u,
    );
});

test("a host passes tokens; it cannot repaint another component through ancestry", () => {
  for (const selector of [
    ".caps-card .caps-button",
    ".caps-card > .caps-button-filled",
    ".caps-card :is(.caps-button:hover, .caps-button:focus-visible)",
    ".caps-card :is(.caps-card-title, .caps-button)",
    ":where(.caps-card > .caps-button)",
  ])
    assert.match(
      cssViolations(
        `${selector} { box-shadow: none; }`,
        "probe.css",
        owners,
      ).join("\n"),
      /cross-component paint/u,
    );
  for (const css of [
    ".caps-card { --caps-button-drop: none; }",
    ".caps-card > .caps-card-title { color: var(--color-primary); }",
    ".caps-card .caps-button { margin-top: 0; }",
    ".caps-button:has(.caps-card) { color: var(--color-primary); }",
  ])
    assert.deepEqual(cssViolations(css, "probe.css", owners), [], css);
});

test("variant contracts admit semantics and reject finishes in unions, aliases and CVA", () => {
  for (const value of [
    "primary",
    "outline",
    "interactive",
    "cartridge",
    "specimen",
    "segmented",
  ])
    assert.deepEqual(source(`type Props = { variant?: "${value}" };`), []);
  for (const text of [
    'type Props = { variant?: "coin" };',
    'type Finish = "chamfer"; type Props = { variant?: Finish };',
    'const choices = { variants: { variant: { arcade: "caps-card" } } };',
  ])
    assert.match(source(text).join("\n"), /not semantic/u);
});

test("cartridge theme literals use Stipe's enum while world art keeps its own vocabulary", () => {
  assert.deepEqual(
    source('const hud = { theme: "tide" }; const blood = "#ff0000";', {
      cartridge: true,
    }),
    [],
  );
  assert.match(
    source('const hud = { windows: [{ theme: "invented" }] };', {
      cartridge: true,
    }).join("\n"),
    /unknown Stipe theme/u,
  );
});

test("nested CSS has the same ownership rule as expanded selectors", () => {
  for (const css of [
    ".caps-card { .caps-button { color: red; } }",
    ".caps-card { @media (width > 400px) { & > .caps-button { color: red; } } }",
  ])
    assert.match(
      cssViolations(css, "probe.css", owners).join("\n"),
      /cross-component paint/u,
    );
});
