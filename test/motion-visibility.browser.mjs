import assert from "node:assert/strict";
import process from "node:process";
import { chromium } from "playwright";

const base = process.env.CAPS_WORKBENCH_URL ?? "http://127.0.0.1:61005";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ reducedMotion: "no-preference" });
  for (const [story, selector] of [
    ["status", "[data-status-preview] svg"],
    ["loader", '.caps-loader[data-variant="bloom"] svg'],
  ]) {
    await page.goto(`${base}/?story=feedback--${story}&mode=preview`);
    if (story === "status")
      await page.getByRole("button", { name: "bounce", exact: true }).click();
    const visual = page.locator(selector).first();
    await visual.waitFor();
    const counts = await visual.evaluate(async (element) => {
      const parent = element.parentElement;
      if (!parent) throw new Error("Missing visual parent");
      const scrollport = globalThis.document.createElement("div");
      scrollport.style.cssText =
        "position:relative;display:block;overflow:auto;width:240px;height:120px";
      const spacer = globalThis.document.createElement("div");
      spacer.style.height = "1000px";
      parent.insertBefore(scrollport, element);
      scrollport.append(element, spacer);
      let changes = 0;
      const mutations = new globalThis.MutationObserver((records) => {
        changes += records.length;
      });
      mutations.observe(element, {
        attributes: true,
        subtree: true,
        childList: true,
      });
      const intersect = (visible, change) =>
        new Promise((resolve, reject) => {
          const timeout = globalThis.setTimeout(() => {
            observer.disconnect();
            reject(new Error("Intersection did not settle"));
          }, 3000);
          const observer = new globalThis.IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting === visible))
              return;
            globalThis.clearTimeout(timeout);
            observer.disconnect();
            globalThis.requestAnimationFrame(resolve);
          });
          observer.observe(element);
          change();
        });
      const sample = async () => {
        changes = 0;
        await new Promise((resolve) => globalThis.setTimeout(resolve, 180));
        return changes;
      };
      try {
        await intersect(true, () => scrollport.scrollIntoView());
        const visible = await sample();
        await intersect(false, () => {
          scrollport.style.display = "none";
        });
        const hidden = await sample();
        await intersect(true, () => {
          scrollport.style.display = "block";
        });
        const resumed = await sample();
        await intersect(false, () => {
          scrollport.scrollTop = 600;
        });
        const offscreen = await sample();
        await intersect(true, () => {
          scrollport.scrollTop = 0;
        });
        const returned = await sample();
        return { visible, hidden, resumed, offscreen, returned };
      } finally {
        mutations.disconnect();
        parent.insertBefore(element, scrollport);
        scrollport.remove();
      }
    });
    assert.ok(counts.visible > 0, `${story}: visible motion updates`);
    assert.equal(counts.hidden, 0, `${story}: hidden ancestor pauses motion`);
    assert.ok(counts.resumed > 0, `${story}: unhidden motion resumes`);
    assert.equal(counts.offscreen, 0, `${story}: scrolled-out motion pauses`);
    assert.ok(counts.returned > 0, `${story}: scrolled-in motion resumes`);
    globalThis.console.log(`${story}: ${JSON.stringify(counts)}`);
  }
} finally {
  await browser.close();
}
