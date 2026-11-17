import process from "node:process";
import { findExecutable, runBounded } from "../scripts/workbench-process.mjs";

const result = await runBounded(
  await findExecutable("playwright"),
  ["test", "--config", "test/playwright.config.mjs"],
  { timeoutMs: 110_000, label: "Caps ARIA snapshots" },
);
process.stdout.write(result.stdout);
