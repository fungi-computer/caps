import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { chromium } from "playwright";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WindowHeader, WindowActions } from "../dist/components/window.js";

async function statusPointerProof(page, view) {
  await page.setViewportSize({ width: 390, height: 844 });
  // Render the real components and their SVG geometry, not a hand-drawn bead.
  // Browser hit testing is the claim; the component suite owns tooltip behavior.
  const renderOnly = () => {
    throw new Error("SSR hit-routing proof must not invoke a React action");
  };
  const header = renderToStaticMarkup(
    createElement(WindowHeader, {
      title: "Trellis",
      density: "compact",
      handleProps: {},
      back: { label: "Back in Trellis", onBack: renderOnly },
      crumbs: [
        { id: "home", label: "Trellis" },
        {
          id: "scope",
          label:
            view === "editor" ? "Bonsai checks" : "UI schedule report proof",
          siblings: [{ id: "all-runs", label: "All runs" }],
        },
        {
          id: "tool",
          label: view === "editor" ? "Editor" : "Runs",
          siblings: [
            { id: "editor", label: "Editor" },
            { id: "runs", label: "Runs" },
          ],
        },
        ...(view === "editor"
          ? [
              {
                id: "version",
                label: "Draft",
                siblings: [{ id: "1", label: "v1" }],
              },
            ]
          : []),
      ],
      onCrumb: renderOnly,
      primary:
        view === "editor"
          ? [
              { id: "run", label: "Run", icon: "play" },
              { id: "publish", label: "Publish", variant: "primary" },
            ]
          : [],
      menu: [{ id: "fork", label: "Fork" }],
      status:
        view === "editor"
          ? [
              {
                id: "saved",
                label: "Saved",
                presentation: "bead",
                tone: "success",
              },
              {
                id: "valid",
                label: "Valid",
                presentation: "bead",
                tone: "success",
              },
            ]
          : [],
      actions: createElement(WindowActions, {
        title: "Trellis",
        onClose: renderOnly,
        onMinimize: renderOnly,
        onToggleMaximize: renderOnly,
      }),
    }),
  );
  await page.setContent(`<section class="caps-window">${header}</section>`);
  await page.addStyleTag({
    content: await readFile(
      new URL("../dist/styles.css", import.meta.url),
      "utf8",
    ),
  });
  const ids = view === "editor" ? ["tool", "version"] : ["scope", "tool"];
  for (const id of ids) {
    const crumb = page.locator(`[data-caps-window-crumb="${id}"]`);
    const hit = await crumb.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;
      const target = globalThis.document.elementFromPoint(x, y);
      button.addEventListener("click", () => {
        button.dataset.clicked = "true";
      });
      return {
        x,
        y,
        reachesCrumb: target === button || button.contains(target),
        interceptor: target?.outerHTML,
        bounds: [
          button,
          ...globalThis.document.querySelectorAll(
            ".caps-window-status, .caps-status-bead",
          ),
        ].map((element) => ({
          className: element.getAttribute("class"),
          rect: element.getBoundingClientRect().toJSON(),
        })),
      };
    });
    assert.equal(
      hit.reachesCrumb,
      true,
      `${view}/${id} crumb intercepted: ${hit.interceptor}; bounds=${JSON.stringify(hit.bounds)}`,
    );
    await page.mouse.click(hit.x, hit.y);
    assert.equal(await crumb.getAttribute("data-clicked"), "true");
  }
  const items = await page
    .locator("header button, header .caps-window-status")
    .evaluateAll((elements) =>
      elements
        .map((element) => ({
          label: element.getAttribute("aria-label") ?? element.textContent,
          rect: element.getBoundingClientRect().toJSON(),
        }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0),
    );
  for (const [index, item] of items.entries()) {
    assert.ok(
      item.rect.left >= 0 && item.rect.right <= 390,
      `${view}: ${item.label} stays inside the viewport`,
    );
    for (const other of items.slice(index + 1)) {
      const overlap =
        Math.min(item.rect.right, other.rect.right) >
          Math.max(item.rect.left, other.rect.left) &&
        Math.min(item.rect.bottom, other.rect.bottom) >
          Math.max(item.rect.top, other.rect.top);
      assert.equal(
        overlap,
        false,
        `${view}: ${item.label} overlaps ${other.label}`,
      );
    }
  }
  if (view !== "editor") return;
  const bead = page.locator(".caps-window-status").first();
  const wrapperHit = await bead.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return element.contains(
      globalThis.document.elementFromPoint(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
      ),
    );
  });
  assert.equal(
    wrapperHit,
    true,
    "The status wrapper retains its own hover hit area",
  );
  await bead.focus();
  assert.equal(
    await bead.evaluate(
      (element) => element === globalThis.document.activeElement,
    ),
    true,
  );
}

const frame = (id) => `<section id="${id}" class="caps-window">
  <header class="caps-window-header"><span class="caps-window-name">Backpack</span></header>
  <div class="caps-window-body"><button class="btn btn-primary caps-button caps-button-filled">Take</button></div>
</section>`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const failures = [];
  for (const view of ["editor", "runs"]) {
    try {
      await statusPointerProof(page, view);
    } catch (cause) {
      failures.push(cause);
    }
  }
  if (failures.length)
    throw new AggregateError(failures, "Window header hit-routing failures");
  // The existing theme-inheritance proof owns its original desktop viewport.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.setContent(`<div data-theme="field-guide">
    ${frame("plain")}
    <div data-theme="paper">
      ${frame("paper")}
      <div data-theme="coin">${frame("coin")}</div>
      <div data-theme="mocha">${frame("nested-palette")}</div>
      <div class="caps-hud-card" data-kind="letter"><div class="caps-hud-plate" id="nested-plate">Status</div></div>
    </div>
    <div class="caps-hud-plate" id="plain-plate">Status</div>
  </div><div data-theme="mocha">${frame("plain-palette")}</div>`);
  await page.addStyleTag({
    content: await readFile(
      new URL("../dist/styles.css", import.meta.url),
      "utf8",
    ),
  });
  const result = await page.evaluate(() => {
    const read = (id) => {
      const element = globalThis.document.getElementById(id);
      const style = globalThis.getComputedStyle(element);
      const header = globalThis.getComputedStyle(
        element.querySelector(".caps-window-header"),
      );
      const button = globalThis.getComputedStyle(
        element.querySelector("button"),
      );
      return {
        face: style.backgroundColor,
        border: style.border,
        shadow: style.boxShadow,
        header: header.backgroundColor,
        buttonBorder: button.borderWidth,
        buttonWeight: button.fontWeight,
      };
    };
    return {
      plain: read("plain"),
      paper: read("paper"),
      coin: read("coin"),
      nestedPalette: read("nested-palette"),
      plainPalette: read("plain-palette"),
      nestedPlate: globalThis.getComputedStyle(
        globalThis.document.getElementById("nested-plate"),
      ).boxShadow,
      plainPlate: globalThis.getComputedStyle(
        globalThis.document.getElementById("plain-plate"),
      ).boxShadow,
    };
  });
  assert.match(
    result.paper.border,
    /^2px solid /u,
    "paper supplies the window frame",
  );
  assert.equal(
    result.coin.border,
    result.paper.border,
    "nested coin retains paper's window frame",
  );
  assert.equal(
    result.coin.shadow,
    result.paper.shadow,
    "nested coin retains paper's window shadow",
  );
  assert.equal(result.paper.buttonBorder, "2px");
  assert.equal(result.paper.buttonWeight, "700");
  assert.equal(
    result.coin.buttonBorder,
    "3px",
    "coin independently changes the control finish",
  );
  assert.deepEqual(
    result.nestedPalette,
    result.plainPalette,
    "a complete nested palette resets the paper finish",
  );
  assert.notEqual(result.plain.shadow, result.paper.shadow);
  assert.equal(
    result.nestedPlate,
    result.plainPlate,
    "a large card's lift does not leak into its nested plate",
  );
  globalThis.console.log(
    "Window theme: inherited paper, independent coin controls, complete-palette reset and nested HUD lift passed.",
  );
} finally {
  await browser.close();
}
