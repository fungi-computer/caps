import assert from "node:assert/strict";
import process from "node:process";
import { chromium } from "playwright";
import {
  launchIsolatedChromium,
  portsOf,
} from "../../../tooling/proof-runner/isolated-chromium.mjs";

// A modal Dialog opened from inside another modal Dialog stays reachable: no
// ancestor of its popup is aria-hidden or inert, and it is a named dialog in
// Chromium's accessibility tree.
const origin = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const browser = await launchIsolatedChromium(chromium, portsOf(origin));
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  await page.goto(`${origin}/?story=nested-dialog--nested-dialog&mode=preview`);
  await page
    .getByRole("button", { name: "Print settings", exact: true })
    .click();
  await page.getByRole("dialog", { name: "Print settings" }).waitFor();
  await page.getByRole("button", { name: "Delete print", exact: true }).click();
  // Wait on the DOM, not the accessibility tree, so a hidden dialog still
  // reports what hides it.
  await page.locator("h2", { hasText: "Delete this print?" }).waitFor();
  const inner = page.getByRole("dialog", { name: "Delete this print?" });
  const hiddenBy = await page.evaluate(() => {
    const title = [...globalThis.document.querySelectorAll("h2")].find(
      (node) => node.textContent === "Delete this print?",
    );
    const marks = [];
    for (let node = title; node !== null; node = node.parentElement)
      if (node.hasAttribute("aria-hidden") || node.hasAttribute("inert"))
        marks.push(
          `${node.tagName.toLowerCase()}${node.hasAttribute("aria-hidden") ? "[aria-hidden]" : ""}${node.hasAttribute("inert") ? "[inert]" : ""}`,
        );
    return marks;
  });
  assert.deepEqual(
    hiddenBy,
    [],
    `the inner dialog is hidden by ${hiddenBy.join(", ")}`,
  );
  const snapshot = await page.locator("body").ariaSnapshot();
  assert.match(snapshot, /dialog "Delete this print\?"/u, snapshot);
  await inner.getByRole("button", { name: "Cancel" }).click();
  await inner.waitFor({ state: "hidden" });
  await page.getByRole("dialog", { name: "Print settings" }).waitFor();
} finally {
  await browser.close();
}
