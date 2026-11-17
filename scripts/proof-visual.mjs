import { parseArgs } from "node:util";
import process from "node:process";
import { runWorkbenchProofs } from "../../../tooling/repository/src/core/workbench-proofs.ts";
import { buildWorkbench } from "./workbench-build.mjs";

const { positionals } = parseArgs({ allowPositionals: true });
if (positionals.length !== 1)
  throw new Error("Usage: pnpm proof:visual <story-id>");
process.env.CAPS_VISUAL_STORY = positionals[0];
await buildWorkbench();
await runWorkbenchProofs({
  directory: process.cwd(),
  output: "../../.botanical/caps-workbench",
  originEnvironment: "CAPS_WORKBENCH_URL",
  proofs: ["test/visual.browser.mjs", "test/contrast.browser.mjs"],
});
