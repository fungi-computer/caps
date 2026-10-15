import console from "node:console";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { parseArgs } from "node:util";
import {
  installCleanupSignals,
  findFreePort,
  findExecutable,
  importPlaywright,
  packageRoot,
  resolveAxeScript,
  resolveLadleRoot,
  stateRoot,
  spawnBounded,
  signalChild,
  waitForMeta,
} from "./workbench-process.mjs";
import {
  targetStoryIds,
  assertMetaCoverage,
  readCoverage,
} from "./workbench-coverage.mjs";
import { buildWorkbench } from "./workbench-build.mjs";

export const targetMarkers = Object.freeze({
  keyboard: "[data-caps-workbench-keyboard]",
  controlled: "[data-caps-workbench-controlled]",
  uncontrolled: "[data-caps-workbench-uncontrolled]",
  accessible: "[data-caps-workbench-accessible]",
  cleanup: "[data-caps-workbench-cleanup]",
  responsive: "[data-caps-workbench-responsive]",
  latte: '[data-caps-workbench-theme="latte"]',
  mocha: '[data-caps-workbench-theme="mocha"]',
  dashboard: '[data-caps-workbench-composition="dashboard"]',
  parakeet: '[data-caps-workbench-composition="parakeet"]',
});

function fail(message) {
  throw new Error(`Caps workbench contract: ${message}`);
}

async function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} exceeded ${timeoutMs / 1000}s`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function loadStory(page, baseUrl, storyId, theme) {
  const url = `${baseUrl}/?story=${encodeURIComponent(storyId)}&mode=preview${theme ? `&theme=${theme}` : ""}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10_000 });
  try {
    await page.waitForFunction(
      () =>
        globalThis.document.documentElement.hasAttribute("data-storyloaded"),
      undefined,
      { timeout: 10_000 },
    );
  } catch (error) {
    const title = await page.title();
    const body = (await page.locator("body").innerText()).slice(0, 1_000);
    throw new Error(
      `Ladle did not load ${storyId} at ${page.url()} (${title}): ${error instanceof Error ? error.message : String(error)}; body=${body}`,
      { cause: error },
    );
  }
  if (await page.locator("[data-ladle-error]").count())
    fail(`Ladle rendered an error for ${storyId}`);
}

async function runAxe(page, axePath, storyId) {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async () => {
    if (!globalThis.axe)
      throw new Error("axe-core did not load in the workbench page");
    return globalThis.axe.run(globalThis.document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    });
  });
  const serious = result.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact),
  );
  if (serious.length) {
    const details = serious
      .flatMap((violation) =>
        violation.nodes.slice(0, 5).map((node) => {
          const targets = node.target.join(" ");
          const summary = node.failureSummary?.replaceAll(/\s+/gu, " ").trim();
          return `${violation.id}(${targets}${summary ? `: ${summary}` : ""})`;
        }),
      )
      .join("; ");
    fail(`${storyId} has serious/critical Axe violations: ${details}`);
  }
  return {
    storyId,
    violations: result.violations.length,
    incomplete: result.incomplete.length,
  };
}

async function assertScrollToBottomBlob(page, baseUrl) {
  await loadStory(page, baseUrl, "feedback--scroll-to-bottom-blob");
  const target = page.locator("[data-scroll-blob-workbench]");
  await target.getByRole("button", { name: "Flick into history" }).click();
  const jump = target.getByRole("button", {
    name: "Jump to bottom",
    exact: true,
  });
  await jump.waitFor();
  await page.waitForFunction(
    () =>
      globalThis.document
        .querySelector("[data-motion-state]")
        ?.getAttribute("data-motion-state") === "resting",
  );
  await target.getByRole("button", { name: "Three new messages" }).click();
  await target
    .getByRole("button", { name: "Jump to bottom, 3 new messages" })
    .waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () =>
      !globalThis.document.querySelector("[data-drop-body]")?.style.transform,
  );
  await target
    .getByRole("button", { name: "Jump to bottom, 3 new messages" })
    .focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () =>
      globalThis.document.activeElement?.getAttribute("aria-label") ===
      "Message",
  );
  await page.waitForFunction(
    () =>
      globalThis.document
        .querySelector("[data-motion-state]")
        ?.getAttribute("data-motion-state") === "hidden",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

async function assertNamedTargets(page, baseUrl, axePath) {
  const found = targetStoryIds;
  const runtimeErrors = [];
  page.on("pageerror", (error) => {
    if (runtimeErrors.length < 32)
      runtimeErrors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error" && runtimeErrors.length < 32)
      runtimeErrors.push(`console: ${message.text()}`);
  });
  const assertNoRuntimeErrors = () => {
    if (runtimeErrors.length)
      fail(`browser runtime errors: ${runtimeErrors.join(" | ")}`);
  };

  await loadStory(page, baseUrl, found.keyboard);
  const keyboardTarget = page
    .locator(`${targetMarkers.keyboard}[role="listbox"]`)
    .first();
  await keyboardTarget.focus();
  if (
    !(await keyboardTarget.evaluate(
      (node) => globalThis.document.activeElement === node,
    ))
  ) {
    fail("keyboard target did not receive focus");
  }
  const beforeActive = await keyboardTarget.getAttribute(
    "aria-activedescendant",
  );
  if (!beforeActive) fail("keyboard target has no initial active descendant");
  await keyboardTarget.press("ArrowDown");
  const afterActive = await keyboardTarget.getAttribute(
    "aria-activedescendant",
  );
  if (!afterActive || afterActive === beforeActive)
    fail("ArrowDown did not move to a different active descendant");
  await keyboardTarget.press("Home");
  if (!(await keyboardTarget.getAttribute("aria-activedescendant")))
    fail("Home removed the active descendant");
  await keyboardTarget.press("End");
  if (!(await keyboardTarget.getAttribute("aria-activedescendant")))
    fail("End removed the active descendant");
  assertNoRuntimeErrors();

  await loadStory(page, baseUrl, found.controlled);
  const controlledTarget = page.locator(targetMarkers.controlled).first();
  const controlledRadio = controlledTarget.getByRole("radio", {
    name: "Mocha",
  });
  const beforeCount = Number(
    (await controlledTarget.getAttribute("data-callback-count")) ?? "0",
  );
  await controlledRadio.click({ timeout: 5_000 });
  const afterCount = Number(
    (await controlledTarget.getAttribute("data-callback-count")) ?? "0",
  );
  if (
    !Number.isFinite(beforeCount) ||
    !Number.isFinite(afterCount) ||
    afterCount <= beforeCount
  ) {
    fail("controlled target did not record a host callback after activation");
  }
  if ((await controlledTarget.getAttribute("data-value")) !== "mocha")
    fail("controlled target did not expose the selected host value");
  assertNoRuntimeErrors();

  await loadStory(page, baseUrl, "blocks--composer");
  const composer = page.locator('[data-conformance="composer"]').first();
  await composer.waitFor();
  const composerGeometry = await composer.evaluate((node) => {
    const input = node.querySelector("textarea");
    const rootStyle = globalThis.getComputedStyle(node);
    const inputStyle = input ? globalThis.getComputedStyle(input) : null;
    return {
      display: rootStyle.display,
      alignItems: rootStyle.alignItems,
      minWidth: rootStyle.minWidth,
      inputMinHeight: inputStyle?.minHeight,
    };
  });
  if (
    composerGeometry.display !== "flex" ||
    composerGeometry.alignItems !== "flex-end" ||
    composerGeometry.minWidth !== "0px" ||
    composerGeometry.inputMinHeight !== "48px"
  )
    fail(
      `Composer story geometry changed: ${JSON.stringify(composerGeometry)}`,
    );
  assertNoRuntimeErrors();

  await loadStory(page, baseUrl, found.uncontrolled);
  const uncontrolledTarget = page.locator(targetMarkers.uncontrolled).first();
  const secondTab = uncontrolledTarget.getByRole("tab", { name: "Two" });
  await secondTab.click();
  if ((await secondTab.getAttribute("aria-selected")) !== "true")
    fail("uncontrolled target did not select its activated tab");
  if (
    !(await uncontrolledTarget
      .getByText("Second panel", { exact: true })
      .isVisible())
  )
    fail("uncontrolled target did not render the selected panel");
  assertNoRuntimeErrors();

  await loadStory(page, baseUrl, found.accessible);
  const accessibleTarget = page.locator(targetMarkers.accessible).first();
  const accessibleName = await accessibleTarget.evaluate((node) => {
    const labelledBy = node.getAttribute("aria-labelledby");
    const labelledText = labelledBy
      ? labelledBy
          .split(/\s+/u)
          .map(
            (id) => globalThis.document.getElementById(id)?.textContent ?? "",
          )
          .join(" ")
      : "";
    return (
      node.getAttribute("aria-label") ??
      (labelledText.trim() || node.textContent?.trim() || "")
    );
  });
  if (!accessibleName) fail("accessible target has no accessible name");
  if (
    !(await accessibleTarget.getAttribute("role")) &&
    !(await accessibleTarget.evaluate((node) => node.tagName !== "DIV"))
  ) {
    fail("accessible target has no explicit role or semantic element");
  }
  if ((await accessibleTarget.getAttribute("aria-invalid")) !== "true")
    fail("accessible target does not expose aria-invalid=true");
  const describedBy = await accessibleTarget.getAttribute("aria-describedby");
  if (!describedBy) fail("accessible target does not expose aria-describedby");
  const descriptionText = await accessibleTarget.evaluate((node) =>
    node
      .getAttribute("aria-describedby")
      ?.split(/\s+/u)
      .map(
        (id) =>
          globalThis.document.getElementById(id)?.textContent?.trim() ?? "",
      )
      .join(" "),
  );
  if (!descriptionText)
    fail("accessible target aria-describedby has no host text");
  assertNoRuntimeErrors();

  await loadStory(page, baseUrl, found.cleanup);
  const cleanupTarget = page.locator(targetMarkers.cleanup).first();
  const tooltipTrigger = cleanupTarget.getByRole("button", {
    name: "Hover me",
  });
  await tooltipTrigger.focus();
  await tooltipTrigger.hover();
  const tooltipContent = page.getByText("Cleanly removable content", {
    exact: true,
  });
  await tooltipContent.waitFor({ state: "visible", timeout: 5_000 });
  await cleanupTarget.getByRole("button", { name: "Unmount" }).click();
  if ((await cleanupTarget.getAttribute("data-cleanup-state")) !== "unmounted")
    fail("cleanup target did not unmount its transient content");
  await tooltipContent.waitFor({ state: "detached", timeout: 5_000 });
  if (await tooltipContent.count())
    fail("cleanup target left tooltip content mounted after unmount");
  await cleanupTarget.getByRole("button", { name: "Remount" }).click();
  if ((await cleanupTarget.getAttribute("data-cleanup-state")) !== "clean")
    fail("cleanup target did not restore clean state");
  if (
    (await cleanupTarget.getByRole("button", { name: "Hover me" }).count()) !==
    1
  )
    fail("cleanup target did not remount its tooltip trigger");
  assertNoRuntimeErrors();

  await loadStory(page, baseUrl, found.responsive);
  await page.setViewportSize({ width: 320, height: 720 });
  const responsiveTarget = page.locator(targetMarkers.responsive).first();
  const narrowColumns = await responsiveTarget.evaluate(
    (node) => globalThis.getComputedStyle(node).gridTemplateColumns,
  );
  const responsiveOverflow = await page.evaluate(
    () =>
      globalThis.document.documentElement.scrollWidth - globalThis.innerWidth,
  );
  if (responsiveOverflow > 1)
    fail(
      `responsive story overflows a 320px viewport by ${responsiveOverflow}px`,
    );
  await page.setViewportSize({ width: 1280, height: 800 });
  const wideColumns = await responsiveTarget.evaluate(
    (node) => globalThis.getComputedStyle(node).gridTemplateColumns,
  );
  if (!narrowColumns || !wideColumns || narrowColumns === wideColumns)
    fail("responsive target did not change grid density across viewports");
  assertNoRuntimeErrors();

  await loadStory(page, baseUrl, found.themes);
  const themeValues = {};
  for (const theme of ["latte", "mocha"]) {
    const themeRoot = page.locator(targetMarkers[theme]).first();
    if (!(await themeRoot.count())) fail(`${theme} theme marker is absent`);
    themeValues[theme] = await themeRoot.evaluate((node) =>
      globalThis
        .getComputedStyle(node)
        .getPropertyValue("--color-base-100")
        .trim(),
    );
    if (!themeValues[theme])
      fail(`${theme} theme has no Stipe --color-base-100 value`);
  }
  if (themeValues.latte === themeValues.mocha)
    fail("latte and mocha do not produce distinct Stipe semantic theme values");
  assertNoRuntimeErrors();

  await assertScrollToBottomBlob(page, baseUrl);
  await assertInputGroupGeometry(page, baseUrl);
  assertNoRuntimeErrors();

  const axeResults = [];
  for (const storyId of new Set([
    found.keyboard,
    found.controlled,
    found.uncontrolled,
    found.accessible,
    found.dashboard,
    found.parakeet,
  ])) {
    await loadStory(page, baseUrl, storyId);
    axeResults.push(await runAxe(page, axePath, storyId));
    assertNoRuntimeErrors();
  }
  return { found, axeResults };
}

/** Regression: a joined button's base and press transform must not break its seam. */
export async function assertInputGroupGeometry(page, baseUrl) {
  for (const theme of ["latte", "mocha"]) {
    await loadStory(page, baseUrl, "forms--input", theme);
    const group = page.locator(".input-study-joined .caps-input-group");
    await group.waitFor();
    for (const pressed of [false, true]) {
      await group.locator("button").evaluate((button, active) => {
        button.classList.toggle("btn-active", active);
      }, pressed);
      await page.waitForTimeout(260);
      const aligned = await group.evaluate((node) => {
        const input = node.querySelector("input");
        const button = node.querySelector("button");
        if (!input || !button) return false;
        const a = input.getBoundingClientRect();
        const b = button.getBoundingClientRect();
        const shadows = globalThis
          .getComputedStyle(button)
          .boxShadow.split(/,(?![^()]*\))/);
        return (
          a.top === b.top &&
          a.bottom === b.bottom &&
          Math.abs(a.right - b.left) <= 1 &&
          shadows.every(
            (shadow) => shadow.includes("inset") || shadow.trim() === "none",
          )
        );
      });
      if (!aligned)
        fail(`input group has an uneven seam (${theme}, pressed=${pressed})`);
    }
  }
}

async function assertLibraryBrowse(page, baseUrl, axePath, meta) {
  await mkdir(join(packageRoot, "../../.botanical"), { recursive: true });
  const artifactRoot = await mkdtemp(
    join(packageRoot, "../../.botanical/caps-library-"),
  );
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/?story=welcome--caps&theme=light`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("heading", { name: "Make yourself at home." }).waitFor();
  const links = await page
    .locator(".caps-library a")
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        new globalThis.URL(node.href).searchParams.get("story"),
      ),
    );
  for (const story of links) {
    if (!story || !(story in meta.stories))
      fail(`library links to a missing story: ${story}`);
  }
  const catalogCount = await page
    .getByRole("navigation", { name: "All Caps components" })
    .getByRole("link")
    .count();
  if (catalogCount !== 59)
    fail(`library shows ${catalogCount} components, expected 59`);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Example saved." })
    .waitFor();
  const latte = await page
    .locator("[data-caps-workbench]")
    .evaluate((node) => globalThis.getComputedStyle(node).backgroundColor);
  await page.screenshot({
    path: join(artifactRoot, "welcome-latte.png"),
    fullPage: true,
  });
  await runAxe(page, axePath, "welcome--caps");
  await page
    .getByRole("button", { name: "Switch to dark theme.", exact: true })
    .click();
  await page.waitForFunction(
    () => globalThis.document.body.dataset.theme === "mocha",
  );
  const mocha = await page
    .locator("[data-caps-workbench]")
    .evaluate((node) => globalThis.getComputedStyle(node).backgroundColor);
  if (latte === mocha)
    fail("Ladle theme toggle did not change Caps surface colors");
  await page.screenshot({
    path: join(artifactRoot, "welcome-mocha.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Explore the components", exact: true })
    .click();
  await page.getByRole("heading", { name: "Button", exact: true }).waitFor();
  if ((await page.locator("body").getAttribute("data-theme")) !== "mocha")
    fail("library navigation reset the selected theme");
  await page
    .locator(".caps-guide-header")
    .getByRole("link", { name: "Caps", exact: true })
    .click();
  await page.getByRole("heading", { name: "Make yourself at home." }).waitFor();
  const search = page.getByRole("textbox", { name: "Search stories" });
  await search.fill("dropdown");
  await page.locator('.ladle-aside a[href*="overlays--dropdown-menu"]').click();
  await page
    .getByRole("heading", { name: "Dropdown menu", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Story source", exact: true }).click();
  const sourceDialog = page.getByRole("dialog", {
    name: "Dialog with the story source code.",
    exact: true,
  });
  await sourceDialog.waitFor({ state: "visible" });
  await page.screenshot({
    path: join(artifactRoot, "menu-source.png"),
    fullPage: true,
  });
  await sourceDialog.getByRole("button", { name: "Close modal" }).click();
  await sourceDialog.waitFor({ state: "hidden" });
  await search.fill("workbench navigation");
  await page
    .locator('.ladle-aside a[href*="layouts--workbench-navigation"]')
    .waitFor();
  await search.fill("window composition");
  await page
    .locator('.ladle-aside a[href*="overlays--window-composition"]')
    .waitFor();
  await page.goto(`${baseUrl}/?story=welcome--caps&theme=dark&mode=preview`, {
    waitUntil: "domcontentloaded",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("heading", { name: "Make yourself at home." }).waitFor();
  const overflow = await page.evaluate(
    () =>
      globalThis.document.documentElement.scrollWidth - globalThis.innerWidth,
  );
  if (overflow > 1)
    fail(`library overflows the narrow viewport by ${overflow}px`);
  await page.screenshot({
    path: join(artifactRoot, "welcome-narrow.png"),
    fullPage: true,
  });
  if (errors.length) fail(`library runtime errors: ${errors.join(" | ")}`);
  const result = {
    artifactRoot,
    catalogCount,
    checkedLinks: links.length,
    latte,
    mocha,
    overflow,
    errors,
  };
  await writeFile(
    join(artifactRoot, "browse-result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  return result;
}

async function assertOverlays(page, baseUrl, axePath) {
  const storyId = "overlays--window-composition";
  await mkdir(join(packageRoot, "../../.botanical"), { recursive: true });
  const artifactRoot = await mkdtemp(
    join(packageRoot, "../../.botanical/caps-overlays-"),
  );
  const runtimeErrors = [];
  page.on("pageerror", (error) =>
    runtimeErrors.push(`pageerror: ${error.message}`),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      runtimeErrors.push(`console: ${message.text()}`);
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadStory(page, baseUrl, storyId, "light");
  const trigger = page.getByRole("button", { name: "Window details" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  try {
    await dialog.waitFor({ state: "visible" });
  } catch (error) {
    const opening = await page.evaluate(() => {
      const describe = (element) => {
        if (!element) return null;
        const style = globalThis.getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          attributes: Object.fromEntries(
            [...element.attributes].map(({ name, value }) => [name, value]),
          ),
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          scale: style.scale,
          width: bounds.width,
          height: bounds.height,
        };
      };
      return {
        activeElement: describe(globalThis.document.activeElement),
        popups: [
          ...globalThis.document.querySelectorAll(
            '[role="dialog"], .caps-dialog-popup, .modal-box',
          ),
        ].map(describe),
        triggers: [...globalThis.document.querySelectorAll("button")]
          .filter((button) => button.textContent?.trim() === "Window details")
          .map(describe),
      };
    });
    await writeFile(
      join(artifactRoot, "opening-failure.json"),
      `${JSON.stringify({ opening, runtimeErrors }, null, 2)}\n`,
    );
    throw error;
  }
  const field = dialog.getByRole("textbox", { name: "Name", exact: true });
  await field.waitFor({ state: "visible" });
  await page.waitForFunction(
    (element) => globalThis.document.activeElement === element,
    await field.elementHandle(),
  );

  const more = dialog.getByRole("button", { name: "More" });
  try {
    await more.click();
  } catch (error) {
    await page.screenshot({
      path: join(artifactRoot, "menu-opening-failure.png"),
      fullPage: true,
    });
    const layout = await more.evaluate((button) => {
      const nodes = [];
      for (let node = button; node; node = node.parentElement) {
        const style = globalThis.getComputedStyle(node);
        nodes.push({
          tag: node.tagName,
          className: node.className,
          bounds: node.getBoundingClientRect().toJSON(),
          overflow: style.overflow,
          position: style.position,
        });
      }
      return nodes;
    });
    await writeFile(
      join(artifactRoot, "menu-opening-failure.json"),
      JSON.stringify(layout, null, 2),
    );
    throw error;
  }
  const menu = page.getByRole("menu");
  await menu.waitFor({ state: "visible" });
  const duplicate = menu.getByRole("menuitem", { name: "Duplicate" });
  if (
    !(await duplicate.evaluate((item) => {
      const box = item.getBoundingClientRect();
      return item.contains(
        globalThis.document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        ),
      );
    }))
  )
    fail("nested menu paints below its dialog");
  const share = menu.getByRole("menuitem", { name: "Share" });
  if (
    (await share.getAttribute("aria-disabled")) !== "true" &&
    !(await share.evaluate((node) => node.hasAttribute("data-disabled")))
  )
    fail("overlay menu did not expose its disabled Share item");
  await duplicate.click();
  await menu.waitFor({ state: "hidden" });
  if (
    !(await dialog.evaluate((popup) => {
      const box = popup.getBoundingClientRect();
      return popup.contains(
        globalThis.document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        ),
      );
    }))
  )
    fail("dialog centre is covered");
  await dialog.getByRole("button", { name: "Help", exact: true }).hover();
  const tooltip = page.getByRole("tooltip");
  await tooltip.waitFor({ state: "visible" });
  if (
    !(await tooltip.evaluate((popup) => {
      const box = popup.getBoundingClientRect();
      return popup.contains(
        globalThis.document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        ),
      );
    }))
  )
    fail("tooltip paints below its dialog");
  await field.fill("Saved draft");

  await runAxe(page, axePath, storyId);
  await page.screenshot({
    path: join(artifactRoot, "latte-desktop.png"),
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Close" }).click();
  await page.waitForFunction(
    () => globalThis.document.activeElement?.textContent === "Workspace",
  );
  await trigger.click();
  await dialog.waitFor({ state: "visible" });
  if ((await field.inputValue()) !== "Saved draft")
    fail("overlay dialog did not retain its draft after close and reopen");
  await loadStory(page, baseUrl, storyId, "dark");
  await page.waitForFunction(
    () => globalThis.document.body.dataset.theme === "mocha",
  );
  await trigger.click();
  await dialog.waitFor({ state: "visible" });
  await page.screenshot({
    path: join(artifactRoot, "mocha-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 480, height: 720 });
  const overflow = await page.evaluate(
    () =>
      globalThis.document.documentElement.scrollWidth - globalThis.innerWidth,
  );
  if (overflow > 1)
    fail(`overlay composition overflows narrow viewport by ${overflow}px`);
  await page.screenshot({
    path: join(artifactRoot, "mocha-narrow.png"),
    fullPage: true,
  });
  if (runtimeErrors.length)
    fail(`overlay browser runtime errors: ${runtimeErrors.join(" | ")}`);
  await writeFile(
    join(artifactRoot, "result.json"),
    `${JSON.stringify({ storyId, themes: ["latte", "mocha"], narrowOverflow: overflow }, null, 2)}\n`,
  );
  return { storyId, artifactRoot, narrowOverflow: overflow };
}

async function closeBrowserServerBounded(browserServer, timeoutMs = 5_000) {
  const browserProcess = browserServer.process();
  const deadline = Date.now() + timeoutMs;
  const gracefulDeadline =
    deadline - Math.min(1_500, Math.max(1, Math.floor(timeoutMs / 3)));
  const killDeadline =
    deadline - Math.min(250, Math.max(1, Math.floor(timeoutMs / 20)));
  let closeError;
  let closeSettled = false;
  const closePromise = browserServer.close().catch((error) => {
    closeError = error;
  });
  closePromise.then(() => {
    closeSettled = true;
  });
  while (!closeSettled && Date.now() < gracefulDeadline)
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
  const isAlive = () =>
    browserProcess?.exitCode === null && browserProcess?.signalCode === null;
  if (!closeSettled || isAlive()) {
    if (isAlive()) signalChild(browserProcess, "SIGTERM");
    while (isAlive() && Date.now() < killDeadline)
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
    if (isAlive()) {
      signalChild(browserProcess, "SIGKILL");
      while (isAlive() && Date.now() < deadline)
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
    }
  }
  if (isAlive()) fail("Chromium survived the 5 second teardown bound");
  if (closeError) throw closeError;
}

export async function runWorkbenchContract({
  overlays = false,
  browse = false,
} = {}) {
  return inspectWorkbench(await buildWorkbench(), { overlays, browse });
}

/** Inspect an artifact returned by the maintained workbench builder. */
export async function inspectWorkbench(
  buildResult,
  { overlays = false, browse = false } = {},
) {
  const coverage = await readCoverage();
  let completion;
  let stop;
  let browser;
  let browserServer;
  let browserLaunch;
  let removeSignals;
  let primaryFailure;
  let cleanupPromise;
  const cleanup = () =>
    (cleanupPromise ??= (async () => {
      const cleanupTasks = [];
      if (browserLaunch) {
        cleanupTasks.push(browserLaunch.then(closeBrowserServerBounded));
      }
      if (stop) cleanupTasks.push(stop());
      const cleanupResults = await Promise.allSettled(cleanupTasks);
      const cleanupFailures = cleanupResults
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason);
      const stateFailures = [];
      if (cleanupFailures.length === 0) {
        try {
          await rm(stateRoot, { recursive: true, force: true });
        } catch (error) {
          stateFailures.push(error);
        }
      } else {
        console.error(
          "workbench state retained because process cleanup failed",
        );
      }
      const failures = [...cleanupFailures, ...stateFailures];
      if (failures.length)
        throw new AggregateError(failures, "workbench cleanup failed");
    })());
  try {
    const port = await findFreePort();
    const ladle = await findExecutable("ladle");
    ({ completion, stop } = spawnBounded(
      ladle,
      [
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--outDir",
        relative(packageRoot, buildResult.output),
        "--config",
        ".ladle",
        "--viteConfig",
        ".ladle/vite.config.mjs",
      ],
      {
        cwd: packageRoot,
        timeoutMs: 120_000,
        label: "Ladle preview",
      },
    ));
    removeSignals = installCleanupSignals(cleanup);
    const baseUrl = `http://127.0.0.1:${port}`;
    const meta = await Promise.race([
      waitForMeta(baseUrl, 30_000),
      completion.then(() => {
        throw new Error("Ladle exited before readiness");
      }),
    ]);
    assertMetaCoverage(meta, coverage);
    const targets = await withTimeout(
      Promise.race([
        (async () => {
          const playwright = await importPlaywright();
          browserLaunch = playwright.chromium.launchServer({
            headless: true,
            timeout: 10_000,
          });
          browserServer = await browserLaunch;
          browser = await playwright.chromium.connect(
            browserServer.wsEndpoint(),
            {
              timeout: 10_000,
            },
          );
          const page = await browser.newPage({
            viewport: { width: 1024, height: 768 },
          });
          page.setDefaultTimeout(5_000);
          const axePath = await resolveAxeScript(await resolveLadleRoot());
          if (browse || overlays) {
            const selected = {};
            if (browse)
              selected.browse = await assertLibraryBrowse(
                page,
                baseUrl,
                axePath,
                meta,
              );
            if (overlays)
              selected.overlays = await assertOverlays(page, baseUrl, axePath);
            return selected;
          }
          return assertNamedTargets(page, baseUrl, axePath);
        })(),
        completion.then(
          () => {
            throw new Error(
              "Ladle exited before browser/Axe contract completed",
            );
          },
          (error) => {
            throw error;
          },
        ),
      ]),
      60_000,
      "Caps workbench browser/Axe contract",
    );
    console.log(
      JSON.stringify(
        { build: buildResult, stories: coverage.items.length, targets },
        null,
        2,
      ),
    );
  } catch (error) {
    primaryFailure = error;
  }
  let cleanupFailure;
  try {
    await cleanup();
  } catch (cause) {
    cleanupFailure = cause;
  } finally {
    removeSignals?.();
  }
  const failures = [
    ...(primaryFailure ? [primaryFailure] : []),
    ...(cleanupFailure ? [cleanupFailure] : []),
  ];
  if (failures.length > 1) {
    throw new AggregateError(failures, "workbench contract and cleanup failed");
  }
  if (failures.length === 1) throw failures[0];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({
    options: {
      overlays: { type: "boolean", default: false },
      browse: { type: "boolean", default: false },
    },
  });
  runWorkbenchContract({
    overlays: values.overlays,
    browse: values.browse,
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
