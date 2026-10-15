import { Buffer } from "node:buffer";
import { parseArgs } from "node:util";
import console from "node:console";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import process from "node:process";
import { probeFile } from "./fs-probe.mjs";
import {
  containedPath,
  findExecutable,
  packageRoot,
  repositoryRoot,
  runBounded,
  stateRoot,
} from "./workbench-process.mjs";
import { assertMetaCoverage, readCoverage } from "./workbench-coverage.mjs";

const workbenchBuildBudgetMs = 60_000;

function stepBudget(deadline, fallbackMs, label) {
  if (deadline === undefined) return fallbackMs;
  const remaining = deadline - Date.now();
  if (remaining <= 0)
    throw new Error(
      `Caps workbench ${label} exceeded 60s total budget before starting`,
    );
  return Math.min(fallbackMs, remaining);
}

export async function buildWorkbench() {
  const deadline = Date.now() + workbenchBuildBudgetMs;
  await prepareWorkbench({ deadline });
  return buildPreparedWorkbench({ deadline });
}

/** Build the stories after the current package and workbench checks pass. */
export async function buildPreparedWorkbench({ deadline } = {}) {
  const coverage = await readCoverage();
  const outputRoot = containedPath(
    join(packageRoot, "../../.botanical"),
    stateRoot,
  );
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  const ladle = await findExecutable("ladle");
  const result = await runBounded(
    ladle,
    [
      "build",
      "--outDir",
      relative(packageRoot, outputRoot),
      "--config",
      ".ladle",
      "--viteConfig",
      ".ladle/vite.config.mjs",
    ],
    {
      cwd: packageRoot,
      timeoutMs: stepBudget(deadline, workbenchBuildBudgetMs, "Ladle build"),
      label: "Ladle build",
    },
  );
  const metaPath = join(outputRoot, "meta.json");
  const metaResult = await probeFile(() => stat(metaPath));
  const metaStat = metaResult.kind === "present" ? metaResult.value : undefined;
  if (!metaStat?.isFile() || metaStat.size > 2 * 1024 * 1024) {
    throw new Error("Ladle build did not produce a bounded meta.json");
  }
  const meta = JSON.parse(await readFile(metaPath, "utf8"));
  assertMetaCoverage(meta, coverage);
  return {
    output: outputRoot,
    bytes: metaStat.size,
    stdoutBytes: Buffer.byteLength(result.stdout),
    stderrBytes: Buffer.byteLength(result.stderr),
  };
}

export async function prepareWorkbench({ deadline } = {}) {
  await runBounded(
    "pnpm",
    ["--filter", "@fungi.computer/caps...", "run", "build"],
    {
      cwd: repositoryRoot,
      timeoutMs: stepBudget(deadline, 60_000, "Caps package build"),
      label: "Caps workspace dependency build before workbench",
    },
  );
  const tsc = await findExecutable("tsc");
  await runBounded(tsc, ["-p", "tsconfig.workbench.json", "--noEmit"], {
    cwd: packageRoot,
    timeoutMs: stepBudget(deadline, 30_000, "Caps workbench typecheck"),
    label: "Caps workbench typecheck",
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values } = parseArgs({ options: { prepared: { type: "boolean" } } });
  const build = values.prepared ? buildPreparedWorkbench : buildWorkbench;
  build()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
