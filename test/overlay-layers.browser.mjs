import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const output = join(process.cwd(), ".botanical", "overlay-layer-shots");
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
async function hits(locator) {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return element.contains(
      globalThis.document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      ),
    );
  });
}
try {
  for (const width of [1440, 390]) {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      await page.goto(
        `${process.env.CAPS_WORKBENCH_URL}/?story=overlays--window-composition&mode=preview&theme=${theme}`,
      );
      await page
        .getByRole("button", { name: "Window details", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "More", exact: true }).click();
      const menu = page.getByRole("menu");
      await menu.waitFor();
      assert.equal(
        await hits(menu.getByRole("menuitem", { name: "Duplicate" })),
        true,
      );
      assert.equal(
        await dialog.evaluate((popup) => {
          const menuPopup = globalThis.document.querySelector('[role="menu"]');
          return (
            menuPopup !== null &&
            Boolean(
              popup.compareDocumentPosition(menuPopup) &
              globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
            )
          );
        }),
        true,
      );
      await page.screenshot({
        path: join(output, `menu-${width}-${theme}.png`),
        fullPage: true,
      });
      await menu.getByRole("menuitem", { name: "Duplicate" }).click();
      await menu.waitFor({ state: "hidden" });
      assert.equal(await hits(dialog), true);
      await dialog.getByRole("button", { name: "Help", exact: true }).hover();
      const tooltip = page.getByRole("tooltip");
      await tooltip.waitFor();
      assert.equal(await hits(tooltip), true);

      await page.goto(
        `${process.env.CAPS_WORKBENCH_URL}/?story=app-root-overlays--app-root&mode=preview&theme=${theme}`,
      );
      await page
        .getByRole("button", { name: "Take over", exact: true })
        .click();
      const confirm = page.getByRole("dialog");
      await confirm.waitFor();
      assert.equal(
        await hits(
          confirm.getByText("You will reply to this visitor.", { exact: true }),
        ),
        true,
      );
      assert.equal(
        await page.locator('[role="separator"]').evaluate((handle) => {
          const box = handle.getBoundingClientRect();
          const target = globalThis.document.elementFromPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
          );
          return Boolean(
            target?.closest(".caps-dialog-popup, .caps-dialog-backdrop"),
          );
        }),
        true,
      );
      await confirm.getByRole("button", { name: "Show notice" }).click();
      const notice = page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "Conversation ready" });
      await notice.waitFor();
      assert.equal(await hits(notice), true);
      await page.screenshot({
        path: join(output, `confirm-toast-${width}-${theme}.png`),
        fullPage: true,
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
