import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import {
  launchIsolatedChromium,
  portsOf,
} from "../../../tooling/proof-runner/isolated-chromium.mjs";

const output = join(process.cwd(), ".botanical", "overlay-layer-shots");
await mkdir(output, { recursive: true });
const origin = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61004";
const browser = await launchIsolatedChromium(chromium, portsOf(origin));
async function expectText(locator, text) {
  await locator.filter({ hasText: text }).waitFor();
}
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
        `${origin}/?story=overlays--window-composition&mode=preview&theme=${theme}`,
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
        `${origin}/?story=app-root-overlays--app-root&mode=preview&theme=${theme}`,
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

      // A toast opens below the App's top header, not over its controls,
      // whether the row stays at one line or wraps; a header that is not at
      // the top, or has scrolled away, does not hold it down; and it speaks
      // in the sans font. The default is the 32px fallback plus the 8px gap.
      const fallbackTop = 40;
      for (const [story, expectation] of [
        ["app-root-overlays--header-clearance", "below"],
        ["app-root-overlays--header-clearance-wrapped", "below"],
        ["app-root-overlays--header-near-top", "below"],
        ["app-root-overlays--header-not-at-top", "default"],
        ["app-root-overlays--header-scrolled-away", "scrolls"],
      ]) {
        await page.goto(
          `${origin}/?story=${story}&mode=preview&theme=${theme}`,
        );
        // The story's own padding would push the header off the top.
        await page.addStyleTag({
          content: ".caps-workbench-provider { padding: 0 !important; }",
        });
        await page.getByRole("button", { name: "Show notice" }).click();
        const headerToast = page
          .locator("[data-sonner-toast]")
          .filter({ hasText: "Run started" });
        await headerToast.waitFor();
        await page.waitForTimeout(600);
        const header = await page.locator("[data-app-header]").boundingBox();
        let toastBox = await headerToast.boundingBox();
        assert.ok(header && toastBox);
        const label = `${story} ${width}/${theme}`;
        if (expectation === "default")
          assert.ok(
            Math.abs(toastBox.y - fallbackTop) <= 1,
            `${label}: a header away from the top is ignored (toast top ${toastBox.y})`,
          );
        else
          assert.ok(
            toastBox.y >= header.y + header.height,
            `${label}: the toast (top ${toastBox.y}) stays below the header row (bottom ${header.y + header.height})`,
          );
        if (expectation === "scrolls") {
          await page.evaluate(() => {
            globalThis.scrollTo(0, 1200);
          });
          await page.waitForTimeout(600);
          toastBox = await headerToast.boundingBox();
          assert.ok(toastBox);
          assert.ok(
            Math.abs(toastBox.y - fallbackTop) <= 1,
            `${label}: the clearance drops once the header scrolls away (toast top ${toastBox.y})`,
          );
        }
        const fonts = await headerToast.evaluate((element) => ({
          toast: globalThis.getComputedStyle(element).fontFamily,
          sans: globalThis
            .getComputedStyle(globalThis.document.documentElement)
            .getPropertyValue("--font-sans")
            .trim(),
        }));
        assert.ok(fonts.sans.length > 0, "the theme defines --font-sans");
        assert.equal(
          fonts.toast.replaceAll('"', ""),
          fonts.sans.replaceAll('"', ""),
          `${story}: toast font is the sans stack`,
        );
        await page.screenshot({
          path: join(output, `${story}-${width}-${theme}.png`),
        });
      }

      // A shell's ordered roots put popovers under dialogs; a menu and a
      // picker opened inside a dialog must still paint over it.
      await page.goto(
        `${origin}/?story=overlays--shell-layers&mode=preview&theme=${theme}`,
      );
      await page
        .getByRole("button", { name: "Move Agent", exact: true })
        .click();
      const shellDialog = page.getByRole("dialog", { name: "Move Agent" });
      await shellDialog.waitFor();
      await shellDialog
        .getByRole("button", { name: "More", exact: true })
        .click();
      const shellMenu = page.getByRole("menu");
      await shellMenu.waitFor();
      for (const name of ["Duplicate", "Archive"])
        assert.equal(
          await hits(shellMenu.getByRole("menuitem", { name, exact: true })),
          true,
          `the dialog's menu row ${name} paints over the dialog`,
        );
      await page.screenshot({
        path: join(output, `shell-menu-${width}-${theme}.png`),
        animations: "disabled",
      });
      await page.keyboard.press("Escape");
      await shellMenu.waitFor({ state: "hidden" });
      await shellDialog.locator(".caps-combobox-trigger").click();
      const option = page.getByRole("option", { name: "Studio", exact: true });
      await option.waitFor();
      assert.equal(
        await hits(option),
        true,
        "the dialog's picker option paints over the dialog",
      );
      await page.screenshot({
        path: join(output, `shell-picker-${width}-${theme}.png`),
        animations: "disabled",
      });
      await option.click();
      await expectText(shellDialog.locator(".caps-combobox-trigger"), "Studio");
      await page.close();
    }
  }
} finally {
  await browser.close();
}
