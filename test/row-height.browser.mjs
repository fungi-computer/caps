import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import process from "node:process";
import { join } from "node:path";
import { URL } from "node:url";
import { chromium } from "playwright";
import { launchIsolatedChromium } from "../../../tooling/proof-runner/isolated-chromium.mjs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WindowHeader, WindowActions } from "../dist/components/window.js";
import { AppStatusBar } from "../dist/blocks/app-status-bar.js";

// Rows stay at 32px at every window width. Only a touch-first device
// (`pointer: coarse`) grows them to 44px. Each App runs in its own frame, so
// two windows side by side must not read as a phone.
const shots = process.env.CAPS_ROW_SHOTS;
const noop = () => undefined;
const windowMarkup = renderToStaticMarkup(
  createElement(
    "section",
    { className: "caps-window" },
    createElement(WindowHeader, {
      title: "Backpack",
      density: "compact",
      handleProps: {},
      primary: [{ id: "run", label: "Run", icon: "play" }],
      actions: createElement(WindowActions, {
        title: "Backpack",
        onClose: noop,
        onMinimize: noop,
        onToggleMaximize: noop,
      }),
    }),
    createElement(
      "div",
      { style: { padding: "8px" } },
      createElement(
        "button",
        { type: "button", className: "btn caps-button caps-button-filled" },
        "Take",
      ),
    ),
    createElement(
      AppStatusBar,
      null,
      createElement(
        "button",
        {
          type: "button",
          className: "caps-keycap-button",
        },
        "Ready",
      ),
    ),
  ),
);
const css = await readFile(
  new URL("../dist/styles.css", import.meta.url),
  "utf8",
);
// Stipe supplies the spacing scale in a host; the bar's height reads it.
const tokens = ":root{--spacing-2xl:2rem}";
const frameDoc = `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${tokens}</style><style>${css}</style><body style="margin:0">${windowMarkup}</body>`;

async function measure(frame) {
  return frame.evaluate(() => {
    const height = (selector) =>
      globalThis.document.querySelector(selector).getBoundingClientRect()
        .height;
    return {
      width: globalThis.innerWidth,
      header: height(".caps-window-header"),
      headerButton: height(".caps-window-header button"),
      statusBar: height(".caps-app-status-bar"),
      bodyButton: height(".caps-window > div .caps-button"),
    };
  });
}

const browser = await launchIsolatedChromium(chromium, []);
try {
  // Desktop: two narrow App frames side by side in a wide viewport.
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 800 },
  });
  const page = await desktop.newPage();
  await page.setContent(
    `<body style="margin:0;display:flex">${[1, 2]
      .map(
        () =>
          `<iframe style="width:600px;height:300px;border:0" srcdoc="${frameDoc.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"></iframe>`,
      )
      .join("")}</body>`,
  );
  await page.waitForFunction(() =>
    [...globalThis.document.querySelectorAll("iframe")].every((f) =>
      f.contentDocument?.querySelector(".caps-app-status-bar"),
    ),
  );
  if (shots) {
    await mkdir(shots, { recursive: true });
    await page.screenshot({
      path: join(shots, "side-by-side.png"),
      clip: { x: 0, y: 0, width: 1440, height: 180 },
    });
  }
  for (const handle of await page.locator("iframe").elementHandles()) {
    const frame = await handle.contentFrame();
    const m = await measure(frame);
    assert.ok(m.width < 640, `frame is narrow (${m.width})`);
    assert.ok(m.header <= 32, `side-by-side header ${m.header}`);
    assert.ok(m.headerButton <= 32, `side-by-side button ${m.headerButton}`);
    assert.ok(m.statusBar <= 32, `side-by-side status bar ${m.statusBar}`);
    assert.ok(m.bodyButton <= 40, `side-by-side body button ${m.bodyButton}`);
  }

  await desktop.close();

  // A 390px viewport with a mouse is still 32px.
  const mouse = await browser.newContext({
    viewport: { width: 390, height: 800 },
  });
  const mousePage = await mouse.newPage();
  await mousePage.setContent(frameDoc);
  const mouseRows = await measure(mousePage);
  assert.ok(mouseRows.header <= 32, `390 mouse header ${mouseRows.header}`);
  assert.ok(
    mouseRows.headerButton <= 32,
    `390 mouse button ${mouseRows.headerButton}`,
  );
  assert.ok(
    mouseRows.statusBar <= 32,
    `390 mouse status bar ${mouseRows.statusBar}`,
  );
  assert.ok(
    mouseRows.bodyButton <= 40,
    `390 mouse body button ${mouseRows.bodyButton}`,
  );
  if (shots) await mousePage.screenshot({ path: join(shots, "mouse-390.png") });
  await mouse.close();

  // Touch-first (`pointer: coarse`) grows rows to 44px.
  const touch = await browser.newContext({
    viewport: { width: 390, height: 800 },
    hasTouch: true,
    isMobile: true,
  });
  const touchPage = await touch.newPage();
  await touchPage.setContent(frameDoc);
  assert.equal(
    await touchPage.evaluate(
      () => globalThis.matchMedia("(pointer: coarse)").matches,
    ),
    true,
  );
  const touchRows = await measure(touchPage);
  assert.ok(
    touchRows.headerButton >= 44,
    `touch button ${touchRows.headerButton}`,
  );
  assert.ok(
    touchRows.statusBar >= 44,
    `touch status bar ${touchRows.statusBar}`,
  );
  assert.ok(
    touchRows.bodyButton >= 44,
    `touch body button ${touchRows.bodyButton}`,
  );
  if (shots) await touchPage.screenshot({ path: join(shots, "touch-390.png") });
  await touch.close();
  globalThis.console.log(
    "Row height: 32px side by side and at 390px with a mouse; 44px under pointer: coarse.",
  );
} finally {
  await browser.close();
}
