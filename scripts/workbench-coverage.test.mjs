import assert from "node:assert/strict";
import { test } from "node:test";
import { readCoverage } from "./workbench-coverage.mjs";

test("the maintained workbench coverage matches the current registry", async () => {
  const coverage = await readCoverage();
  assert.ok(coverage.items.length > 0);
});

test("generation refuses a registry item without a story mapping", async () => {
  const { renderCoverage } = await import("./workbench-coverage.mjs");
  const coverage = await readCoverage();
  await assert.rejects(
    renderCoverage({ items: [...coverage.items, { name: "missing-story" }] }),
    /must contain the same inventory/u,
  );
});
