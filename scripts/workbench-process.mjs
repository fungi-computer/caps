import { Buffer } from "node:buffer";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { access, lstat, readFile, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import process from "node:process";
import console from "node:console";
import { clearTimeout, setTimeout } from "node:timers";
import Ajv from "ajv";
import { isErrno, probeFile } from "./fs-probe.mjs";

export const packageRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const repositoryRoot = resolve(packageRoot, "../..");
export const stateRoot = resolve(repositoryRoot, ".botanical/caps-workbench");
const maxLogBytes = 64 * 1024;
const requireFromPackage = createRequire(join(packageRoot, "package.json"));
const requireFromRepository = createRequire(
  join(repositoryRoot, "package.json"),
);
const ajv = new Ajv({ allErrors: true, strict: true });
const validateLadlePackage = ajv.compile({
  type: "object",
  required: ["name"],
  properties: { name: { const: "@ladle/react" } },
  additionalProperties: true,
});
const validateAxePackage = ajv.compile({
  type: "object",
  required: ["name"],
  properties: { name: { const: "axe-core" } },
  additionalProperties: true,
});

export function containedPath(root, candidate) {
  const rootPath = resolve(root);
  const candidatePath = resolve(candidate);
  const suffix = relative(rootPath, candidatePath);
  if (
    suffix === "" ||
    (suffix && !suffix.startsWith("..") && !isAbsolute(suffix))
  ) {
    return candidatePath;
  }
  throw new Error(`path escapes ${rootPath}: ${candidatePath}`);
}

export async function findExecutable(name) {
  const candidates = [
    join(packageRoot, "node_modules/.bin", name),
    join(repositoryRoot, "node_modules/.bin", name),
  ];
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch (error) {
      if (isErrno(error, "ENOENT")) continue;
      throw error;
    }
  }
  throw new Error(
    `cannot resolve ${name}; install package-local dependencies first`,
  );
}

function resolveModuleEntry(requireFrom, name) {
  try {
    return { kind: "resolved", entry: requireFrom.resolve(name) };
  } catch (cause) {
    if (
      cause?.code === "MODULE_NOT_FOUND" ||
      cause?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED"
    )
      return { kind: "missing" };
    throw cause;
  }
}

function appendBounded(target, chunk) {
  const next = `${target}${chunk}`;
  if (Buffer.byteLength(next) > maxLogBytes) {
    throw new Error("workbench child output exceeded 64 KiB");
  }
  return next;
}

export async function terminateProcessGroup(child, timeoutMs = 5_000) {
  const leaderAlive = () =>
    child.exitCode === null && child.signalCode === null;
  const groupExists = () => processGroupExists(child);
  if (!leaderAlive() && !groupExists()) return true;
  const deadline = Date.now() + timeoutMs;
  const killReserve = Math.min(1_000, Math.max(1, Math.floor(timeoutMs / 4)));
  const termDeadline = deadline - killReserve;
  if (groupExists() && child.pid && process.platform !== "win32")
    signalProcessGroup(child, "SIGTERM");
  else signalChild(child, "SIGTERM");
  while (leaderAlive() || groupExists()) {
    const remaining = termDeadline - Date.now();
    if (remaining <= 0) break;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
  }
  if (leaderAlive() || groupExists()) {
    if (groupExists() && child.pid && process.platform !== "win32")
      signalProcessGroup(child, "SIGKILL");
    else signalChild(child, "SIGKILL");
    while (leaderAlive() || groupExists()) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 25));
    }
  }
  if (leaderAlive() || groupExists()) {
    throw new Error(
      "workbench child process survived the 5 second teardown bound",
    );
  }
  return true;
}

export function signalChild(child, signal) {
  try {
    return child.kill(signal) ? { kind: "sent" } : { kind: "already-exited" };
  } catch (cause) {
    if (isErrno(cause, "ESRCH")) return { kind: "already-exited" };
    throw cause;
  }
}

function signalProcessGroup(child, signal) {
  if (!child.pid) return { kind: "no-process-id" };
  try {
    process.kill(-child.pid, signal);
    return { kind: "sent" };
  } catch (cause) {
    if (isErrno(cause, "ESRCH")) return { kind: "already-exited" };
    throw cause;
  }
}

function processGroupExists(child) {
  if (!child.pid) return false;
  if (process.platform === "win32")
    return child.exitCode === null && child.signalCode === null;
  try {
    process.kill(-child.pid, 0);
    return true;
  } catch (error) {
    if (isErrno(error, "ESRCH")) return false;
    if (isErrno(error, "EPERM")) return true;
    throw error;
  }
}

export function spawnBounded(
  executable,
  args,
  { cwd = packageRoot, timeoutMs, label, discardStdout = false },
) {
  const child = spawn(executable, args, {
    cwd,
    detached: process.platform !== "win32",
    env: { ...process.env, CI: "true", BROWSER: "none" },
    shell: false,
    // Builds that list every emitted asset outgrow the bounded log.
    stdio: ["ignore", discardStdout ? "ignore" : "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let timedOut = false;
  let outputError;
  let cleanupPromise;
  let stopPromise;
  let stopRequested = false;
  let rejectCompletion;
  const failAndCleanup = (error) => {
    outputError ??= error;
    cleanupPromise ??= terminateProcessGroup(child);
    cleanupPromise.catch((cleanupError) => rejectCompletion?.(cleanupError));
  };
  child.stdout?.on("data", (chunk) => {
    try {
      stdout = appendBounded(stdout, chunk);
    } catch (error) {
      failAndCleanup(error);
    }
  });
  child.stderr.on("data", (chunk) => {
    try {
      stderr = appendBounded(stderr, chunk);
    } catch (error) {
      failAndCleanup(error);
    }
  });
  const timeout =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          failAndCleanup(new Error(`${label} exceeded ${timeoutMs / 1000}s`));
        }, timeoutMs)
      : undefined;
  const completion = new Promise((resolvePromise, reject) => {
    rejectCompletion = reject;
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", async (code, signal) => {
      clearTimeout(timeout);
      try {
        await cleanupPromise;
      } catch (error) {
        reject(error);
        return;
      }
      // Ladle exits its CLI before helper processes finish their normal shutdown.
      // Allow one cleanup polling interval before classifying a successful exit as a leak.
      if (code === 0 && !timedOut && !outputError && processGroupExists(child))
        await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
      const hadLiveGroup = processGroupExists(child);
      if (hadLiveGroup) {
        try {
          await terminateProcessGroup(child);
        } catch (error) {
          reject(error);
          return;
        }
      }
      if (outputError) {
        reject(outputError);
        return;
      }
      if (timedOut) {
        reject(new Error(`${label} exceeded ${timeoutMs / 1000}s`));
        return;
      }
      if (hadLiveGroup) {
        const status =
          code === 0
            ? "exited successfully with a live detached process group"
            : `exited ${code ?? "null"}/${signal ?? "none"} with a live detached process group`;
        reject(new Error(`${label} ${status}; the group was terminated`));
        return;
      }
      const ownedStopExit =
        stopRequested &&
        (signal === "SIGTERM" ||
          signal === "SIGKILL" ||
          code === 143 ||
          code === 137);
      if (code !== 0 && !ownedStopExit) {
        reject(
          new Error(
            `${label} exited ${code ?? "null"}/${signal ?? "none"}\n${stderr || stdout}`,
          ),
        );
        return;
      }
      resolvePromise({ stdout, stderr });
    });
  });
  // Record intent before signaling: Ladle may translate SIGTERM to exit143.
  // Both the close event and caller await this same group teardown.
  const stop = () => {
    stopPromise ??= (async () => {
      stopRequested = child.exitCode === null && child.signalCode === null;
      cleanupPromise ??= terminateProcessGroup(child);
      await cleanupPromise;
      await completion;
    })();
    return stopPromise;
  };
  return { child, completion, stop };
}

/** CLI interruption owns the same cleanup as normal completion. */
export function installCleanupSignals(cleanup) {
  const signals = { SIGINT: 2, SIGTERM: 15, SIGHUP: 1 };
  let stopping = false;
  const handlers = new Map();
  for (const [signal, number] of Object.entries(signals)) {
    const handler = () => {
      if (stopping) return;
      stopping = true;
      for (const name of Object.keys(signals)) {
        process.removeListener(name, handlers.get(name));
        process.on(name, handlers.get(name));
      }
      // Repeated signals must not restore default termination during cleanup.
      void Promise.resolve()
        .then(cleanup)
        .then(
          () => process.exit(128 + number),
          (cause) => {
            console.error(
              cause instanceof Error ? cause.message : String(cause),
            );
            process.exit(1);
          },
        );
    };
    handlers.set(signal, handler);
    process.once(signal, handler);
  }
  return () => {
    if (stopping) return;
    for (const [signal, handler] of handlers)
      process.removeListener(signal, handler);
  };
}

export async function runBounded(executable, args, options) {
  const { completion } = spawnBounded(executable, args, options);
  return completion;
}

export async function findFreePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0 }, resolvePromise);
  });
  const address = server.address();
  if (!address || !Number.isSafeInteger(address.port))
    throw new Error("failed to allocate a TCP port");
  const port = address.port;
  await new Promise((resolvePromise, reject) =>
    server.close((error) => (error ? reject(error) : resolvePromise())),
  );
  return port;
}

export async function waitForMeta(baseUrl, timeoutMs = 30_000) {
  const started = Date.now();
  let lastError = "no response";
  let lastFailure;
  while (Date.now() - started < timeoutMs) {
    const remaining = timeoutMs - (Date.now() - started);
    if (remaining <= 0) break;
    const controller = new globalThis.AbortController();
    const abortTimer = setTimeout(() => controller.abort(), remaining);
    try {
      const response = await globalThis.fetch(`${baseUrl}/meta.json`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (Buffer.byteLength(text) > 2 * 1024 * 1024)
        throw new Error("meta.json exceeds 2 MiB");
      return JSON.parse(text);
    } catch (error) {
      lastFailure = error;
      lastError = error instanceof Error ? error.message : String(error);
      const delay = Math.min(
        100,
        Math.max(0, timeoutMs - (Date.now() - started)),
      );
      if (delay > 0)
        await new Promise((resolvePromise) =>
          setTimeout(resolvePromise, delay),
        );
    } finally {
      clearTimeout(abortTimer);
    }
  }
  throw new Error(
    `Ladle did not expose /meta.json within 30s: ${lastError}`,
    lastFailure === undefined ? undefined : { cause: lastFailure },
  );
}

export async function resolveLadleRoot() {
  const packageEntry = resolveModuleEntry(requireFromPackage, "@ladle/react");
  const repositoryEntry =
    packageEntry.kind === "resolved"
      ? packageEntry
      : resolveModuleEntry(requireFromRepository, "@ladle/react");
  if (repositoryEntry.kind === "missing")
    throw new Error(
      "cannot resolve @ladle/react; install package-local dependencies first",
    );
  const ladleEntry = repositoryEntry.entry;
  let current = dirname(ladleEntry);
  for (let index = 0; index < 8; index += 1) {
    const packageFile = join(current, "package.json");
    const result = await probeFile(() => readFile(packageFile, "utf8"));
    if (
      result.kind === "present" &&
      validateLadlePackage(JSON.parse(result.value))
    )
      return await realpath(current);
    current = dirname(current);
  }
  throw new Error("resolved @ladle/react entry has no bounded package root");
}

export async function resolveAxeScript(ladleRoot) {
  const ladleRequire = createRequire(join(ladleRoot, "package.json"));
  let selected;
  try {
    selected = ladleRequire.resolve("axe-core/axe.min.js");
  } catch (error) {
    if (
      error?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED" &&
      error?.code !== "MODULE_NOT_FOUND"
    )
      throw error;
    try {
      selected = ladleRequire.resolve("axe-core/axe.js");
    } catch (fallbackError) {
      if (
        fallbackError?.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED" &&
        fallbackError?.code !== "MODULE_NOT_FOUND"
      )
        throw fallbackError;
      throw new Error(
        "@ladle/react does not expose its shipped axe-core script",
        { cause: fallbackError },
      );
    }
  }
  const scriptPath = await realpath(selected);
  let axePackageRoot = dirname(scriptPath);
  let packageDescriptor;
  for (let index = 0; index < 6; index += 1) {
    const result = await probeFile(() =>
      readFile(join(axePackageRoot, "package.json"), "utf8"),
    );
    if (result.kind === "present") {
      packageDescriptor = JSON.parse(result.value);
      if (validateAxePackage(packageDescriptor)) break;
    }
    axePackageRoot = dirname(axePackageRoot);
  }
  if (!validateAxePackage(packageDescriptor))
    throw new Error("resolved Ladle Axe script is not owned by axe-core");
  const stat = await lstat(scriptPath);
  if (!stat.isFile() || stat.size > 10 * 1024 * 1024)
    throw new Error("Ladle Axe script is not a bounded regular file");
  return containedPath(axePackageRoot, scriptPath);
}

export async function importPlaywright() {
  const packageEntry = resolveModuleEntry(requireFromPackage, "playwright");
  const repositoryEntry =
    packageEntry.kind === "resolved"
      ? packageEntry
      : resolveModuleEntry(requireFromRepository, "playwright");
  if (repositoryEntry.kind === "missing")
    throw new Error("cannot resolve repository-owned Playwright 1.62.1");
  const { entry } = repositoryEntry;
  const imported = await import(pathToFileURL(entry).href);
  const playwright = imported.default ?? imported;
  if (!playwright.chromium)
    throw new Error("repository-owned Playwright has no Chromium runtime");
  return playwright;
}
