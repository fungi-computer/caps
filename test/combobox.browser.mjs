import assert from "node:assert/strict";
import console from "node:console";
import process from "node:process";
import { chromium } from "playwright";

const base = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${base}/?story=forms--multi-select&mode=preview`);
  const trigger = page.locator(".caps-combobox-trigger");
  await trigger.click();
  const input = page.getByRole("combobox");
  await page
    .getByRole("option", { name: "Travel laptop", exact: true })
    .click();
  assert(
    await input.evaluate(
      (element) => element === globalThis.document.activeElement,
    ),
    "mouse selection retains search focus",
  );
  await page.keyboard.type("Studio");
  assert.equal(await input.inputValue(), "Studio");
  await page.keyboard.press("ArrowDown");
  assert.match(await input.getAttribute("aria-activedescendant"), /studio$/);
  await page.keyboard.press("Enter");
  assert.equal(
    await page
      .getByRole("option", { name: "Studio", exact: true })
      .getAttribute("aria-selected"),
    "false",
    "keyboard selection still toggles the filtered option",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(() =>
    globalThis.document.activeElement?.matches(".caps-combobox-trigger"),
  );
  const label = page.locator("label", { hasText: "Computers" });
  assert(
    await label.evaluate((element) =>
      element.control?.matches(".caps-combobox-trigger"),
    ),
    "the visible Field label owns the trigger",
  );
  await label.click();
  await input.waitFor();
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
  await page.mouse.click(8, 8);
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.close();

  const touchPage = await browser.newPage({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 720, height: 900 },
  });
  await touchPage.goto(`${base}/?story=forms--multi-select&mode=preview`);
  await touchPage.locator(".caps-combobox-trigger").tap();
  const touchInput = touchPage.getByRole("combobox");
  await touchInput.tap();
  const travel = touchPage.getByRole("option", {
    name: "Travel laptop",
    exact: true,
  });
  await travel.tap();
  assert.equal(await travel.getAttribute("aria-selected"), "true");
  assert(
    await touchInput.evaluate(
      (element) => element === globalThis.document.activeElement,
    ),
    "touch selection retains an already-focused search input",
  );
  const list = touchPage.getByRole("listbox");
  // Constrain the existing four-option story to exercise native touch scrolling.
  await list.evaluate((element) => {
    element.style.maxHeight = "64px";
  });
  const box = await list.boundingBox();
  assert(box);
  const touch = await touchPage.context().newCDPSession(touchPage);
  const point = { x: box.x + box.width / 2, y: box.y + box.height - 6 };
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point],
  });
  for (const distance of [12, 24, 36, 48]) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: point.x, y: point.y - distance }],
    });
  }
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await touchPage.waitForFunction(
    () => globalThis.document.querySelector('[role="listbox"]').scrollTop > 0,
  );
  assert.equal(await touchPage.getByRole("dialog").count(), 1);
  await touchPage.close();
  console.log(
    "PASS: Combobox mouse/touch selection, continued typing/navigation, native Field label, outside dismissal, and touch scrolling.",
  );
} finally {
  await browser.close();
}
