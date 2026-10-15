import console from "node:console";
import process from "node:process";
import {
  installCleanupSignals,
  findExecutable,
  findFreePort,
  packageRoot,
  spawnBounded,
  waitForMeta,
} from "./workbench-process.mjs";
import { prepareWorkbench } from "./workbench-build.mjs";
import { assertMetaCoverage, readCoverage } from "./workbench-coverage.mjs";

export async function serveWorkbench() {
  const coverage = await readCoverage();
  await prepareWorkbench();
  const port = await findFreePort();
  const ladle = await findExecutable("ladle");
  const { completion, stop } = spawnBounded(
    ladle,
    [
      "serve",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--config",
      ".ladle",
      "--noWatch",
    ],
    { cwd: packageRoot, timeoutMs: 0, label: "Ladle serve" },
  );
  const baseUrl = `http://127.0.0.1:${port}`;
  const removeSignals = installCleanupSignals(stop);
  let primaryFailure;
  try {
    const meta = await Promise.race([
      waitForMeta(baseUrl, 30_000),
      completion.then(() => {
        throw new Error("Ladle exited before readiness");
      }),
    ]);
    const stories = assertMetaCoverage(meta, coverage);
    console.log(
      JSON.stringify({
        url: baseUrl,
        stories: Object.keys(stories).length,
      }),
    );
    await completion;
  } catch (error) {
    primaryFailure = error;
  }
  let cleanupFailure;
  try {
    await stop();
  } catch (error) {
    cleanupFailure = error;
  }
  removeSignals();
  if (primaryFailure && cleanupFailure) {
    throw new AggregateError(
      [primaryFailure, cleanupFailure],
      "Ladle serve and cleanup failed",
    );
  }
  if (primaryFailure) throw primaryFailure;
  if (cleanupFailure) throw cleanupFailure;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  serveWorkbench().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
