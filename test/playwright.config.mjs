import process from "node:process";
import { defineConfig } from "playwright/test";

if (!process.env.CAPS_WORKBENCH_URL)
  throw new Error("Run pnpm test:a11y against the prepared workbench");

export default defineConfig({
  testDir: ".",
  testMatch: "a11y-tree.proof.mjs",
  outputDir: "../../../.botanical/caps-aria-results",
  workers: 1,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: process.env.CAPS_WORKBENCH_URL,
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  },
});
