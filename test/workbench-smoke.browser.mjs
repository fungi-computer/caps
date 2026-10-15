// Visits every story of the root workbench (the one `.ladle/config.mjs`
// builds and botanical-workbench deploys) and fails on any story that loads
// blank. A module-load throw in the shared provider blanks every story, so
// this is the proof that the whole workbench still renders.
import assert from "node:assert/strict";
import console from "node:console";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import {
  importPlaywright,
  waitForMeta,
} from "../scripts/workbench-process.mjs";
import {
  assertMetaCoverage,
  readCoverage,
} from "../scripts/workbench-coverage.mjs";

const visitBudgetMs = 240_000;
const storyTimeoutMs = 20_000;
const parallelPages = 6;

/** Resolves once the story shows content or rejects with why it is blank. */
async function visitStory(context, baseUrl, storyId) {
  const page = await context.newPage();
  const errors = [];
  const reportedFailures = [];
  const expectedFailures =
    {
      "bazaar--unreachable": ["Bazaar request failed Error: offline"],
      "grove--inbox-retry": [
        '{"source":"agar","operation":"inbox.refresh","failureKind":"Error"} {}',
      ],
      "grove--missing-session": [
        "Chat Session opening failed Error: Session baseline unavailable",
      ],
    }[storyId] ?? [];
  let rejectOnError;
  const errored = new Promise((_, reject) => {
    rejectOnError = reject;
  });
  const record = (message) => {
    errors.push(message);
    rejectOnError(new Error(message));
  };
  page.on("pageerror", (error) => record(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text().split("\n")[0];
    if (expectedFailures.includes(text)) reportedFailures.push(text);
    else record(`console: ${text}`);
  });
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`no content within ${storyTimeoutMs / 1000}s`)),
      storyTimeoutMs,
    );
  });
  let failure;
  try {
    await Promise.race([
      (async () => {
        await page.goto(
          `${baseUrl}/?story=${encodeURIComponent(storyId)}&mode=preview`,
          { waitUntil: "domcontentloaded", timeout: storyTimeoutMs },
        );
        await page.waitForFunction(
          () =>
            globalThis.document.documentElement.hasAttribute(
              "data-storyloaded",
            ),
          undefined,
          { timeout: storyTimeoutMs },
        );
        if (await page.locator("[data-ladle-error]").count())
          throw new Error("Ladle rendered [data-ladle-error]");
        // The provider shell and guide header are not the story; require
        // something rendered beside them inside the provider.
        await page.waitForFunction(
          () => {
            const shell = globalThis.document.querySelector(
              "[data-caps-workbench]",
            );
            if (!shell) return false;
            for (const child of shell.children) {
              if (child.matches(".caps-guide-header")) continue;
              if (child.textContent?.trim()) return true;
              for (const element of [child, ...child.querySelectorAll("*")]) {
                const box = element.getBoundingClientRect();
                if (box.width > 0 && box.height > 0) return true;
              }
            }
            return false;
          },
          undefined,
          { timeout: storyTimeoutMs },
        );
      })(),
      errored,
      timeout,
    ]);
    // Late errors from the first render still count against the story.
    if (errors.length) throw new Error(errors[0]);
    assert.deepEqual(
      reportedFailures,
      expectedFailures,
      `${storyId}: fixture refusal is reported`,
    );
  } catch (cause) {
    failure = cause;
  }
  clearTimeout(timer);
  try {
    await page.close();
  } catch (cleanupFailure) {
    if (failure !== undefined)
      throw new AggregateError(
        [failure, cleanupFailure],
        `${storyId}: story and page cleanup failed`,
        { cause: cleanupFailure },
      );
    throw cleanupFailure;
  }
  if (failure !== undefined) throw failure;
}

async function visitAll(browser, baseUrl, storyIds) {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
  });
  const failures = [];
  const deadline = Date.now() + visitBudgetMs;
  const queue = [...storyIds];
  const worker = async () => {
    for (let storyId = queue.shift(); storyId; storyId = queue.shift()) {
      if (Date.now() > deadline) {
        failures.push({ storyId, reason: "not visited: total budget spent" });
        continue;
      }
      try {
        await visitStory(context, baseUrl, storyId);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        failures.push({ storyId, reason: reason.split("\n")[0].slice(0, 300) });
      }
    }
  };
  await Promise.all(Array.from({ length: parallelPages }, worker));
  await context.close();
  return failures.sort((a, b) => a.storyId.localeCompare(b.storyId));
}

async function main() {
  const started = Date.now();
  const baseUrl = process.env.CAPS_WORKBENCH_URL;
  if (!baseUrl)
    throw new Error(
      "Set CAPS_WORKBENCH_URL to the owned prepared root workbench",
    );
  let browser;
  let failure;
  try {
    const meta = await waitForMeta(baseUrl, 30_000);
    assertMetaCoverage(meta, await readCoverage());
    const storyIds = Object.keys(meta.stories);
    const playwright = await importPlaywright();
    browser = await playwright.chromium.launch({ headless: true });
    const failures = await visitAll(browser, baseUrl, storyIds);
    const summary = {
      stories: storyIds.length,
      passed: storyIds.length - failures.length,
      failed: failures.length,
      seconds: Math.round((Date.now() - started) / 1000),
    };
    console.log(JSON.stringify(summary));
    if (failures.length) {
      for (const { storyId, reason } of failures)
        console.error(`BLANK ${storyId}: ${reason}`);
      process.exitCode = 1;
    }
  } catch (cause) {
    failure = cause;
  }
  try {
    await browser?.close();
  } catch (cleanupFailure) {
    if (failure !== undefined)
      throw new AggregateError(
        [failure, cleanupFailure],
        "Caps workbench and browser cleanup failed",
        { cause: cleanupFailure },
      );
    throw cleanupFailure;
  }
  if (failure !== undefined) throw failure;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
