// Visits every story of the root workbench (the one `.ladle/config.mjs`
// builds and botanical-workbench deploys) and fails on any story that loads
// blank. A module-load throw in the shared provider blanks every story, so
// this is the proof that the whole workbench still renders.
import console from "node:console";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import {
  importPlaywright,
  waitForMeta,
} from "../scripts/workbench-process.mjs";
import {
  launchIsolatedChromium,
  portsOf,
} from "../../../tooling/proof-runner/isolated-chromium.mjs";
import {
  assertMetaCoverage,
  readCoverage,
} from "../scripts/workbench-coverage.mjs";

/** What Chromium logs for a story's deliberate msw HTTP refusal. */
const refused = (status, text) =>
  `Failed to load resource: the server responded with a status of ${String(status)} (${text})`;
const unavailable = [refused(503, "Service Unavailable")];
const storyTimeoutMs = 20_000;
const parallelPages = 6;

/** Resolves once the story shows content or rejects with why it is blank. */
async function visitStory(context, baseUrl, storyId) {
  const page = await context.newPage();
  const errors = [];
  // Stories that stage a refusal may log it; any other console error fails the
  // story. The log arrives asynchronously (and, for Grove's first inbox read, only
  // when no remount supersedes it), so its presence is not asserted here: each
  // fixture's own proof owns that.
  const allowedFailures =
    {
      "desktop--directory-unavailable": unavailable,
      "desktop--inbox-unavailable": [
        ...unavailable,
        "Desktop Gill read failed {surfaceId: grove, viewId: inbox, cause: Error: Fixture Inbox read refused",
      ],
      "fungi-landing--invitation--unavailable": unavailable,
      "vishnu-portal--catalog-error": unavailable,
      "vishnu-portal--play-error": [
        ...unavailable,
        "Could not load game ApiError: request failed (503)",
      ],
      "vishnu-portal--play-missing": [refused(404, "Not Found")],
      "grove--conversation-unavailable": [
        "Chat Session opening failed Error: This conversation is temporarily unavailable. Try again when your Agent reconnects.",
      ],
      "grove--inbox-retry": [
        '{"source":"agar","operation":"inbox.refresh","failureKind":"Error"} {}',
      ],
      "grove--missing-session": [
        "Chat Session opening failed Error: Session baseline unavailable",
      ],
      "inkcap--activity-recording-failure": [
        "Inkcap document activity could not be recorded {}",
      ],
      "inkcap--files-unavailable": ["Inkcap directory listing failed {}"],
      "inkcap--file-read-failed": [
        "Inkcap file read failed Error: App file unavailable (503)",
      ],
      "shed--terminal-failed": [
        "Shed terminal operation failed Error: The Computer disconnected before the terminal could open.",
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
    if (!allowedFailures.includes(text)) record(`console: ${text}`);
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
            // Dialog stories render only into a portal beside the Ladle root.
            const portals = [...globalThis.document.body.children].filter(
              (child) => !child.matches("#ladle-root, .ladle-background"),
            );
            for (const child of [...shell.children, ...portals]) {
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
  const queue = [...storyIds];
  const worker = async () => {
    for (let storyId = queue.shift(); storyId; storyId = queue.shift()) {
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
    browser = await launchIsolatedChromium(
      playwright.chromium,
      portsOf(baseUrl),
      { headless: true },
    );
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
