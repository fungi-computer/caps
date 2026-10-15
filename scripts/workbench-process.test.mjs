import assert from "node:assert/strict";
import { once } from "node:events";
import { URL } from "node:url";
import process from "node:process";
import { test } from "node:test";
import {
  installCleanupSignals,
  spawnBounded,
  terminateProcessGroup,
} from "./workbench-process.mjs";

function start(code) {
  const run = spawnBounded(process.execPath, ["--eval", code], {
    timeoutMs: 10_000,
    label: "process lifecycle fixture",
  });
  const outcome = run.completion.then(
    (value) => ({ kind: "completed", value }),
    (cause) => ({ kind: "failed", cause }),
  );
  return { ...run, outcome };
}

function killFixtureGroup(group) {
  try {
    process.kill(-group, 0);
    process.kill(-group, "SIGKILL");
  } catch (cause) {
    if (cause.code !== "ESRCH") throw cause;
  }
}

function assertGroupGone(child) {
  assert.throws(() => process.kill(-child.pid, 0), { code: "ESRCH" });
}

test("owned shutdown accepts Ladle's numeric SIGTERM exit and reaps its group", async () => {
  const run = start(`
    process.on('SIGTERM', () => process.exit(143));
    process.stdout.write('ready');
    setInterval(() => {}, 1000);
  `);
  try {
    await once(run.child.stdout, "data");
    await Promise.all([run.stop(), run.stop()]);
    assert.equal((await run.outcome).kind, "completed");
    assertGroupGone(run.child);
  } finally {
    await terminateProcessGroup(run.child);
  }
});

test("unexpected numeric SIGTERM exit remains a failure", async () => {
  const run = start("process.exit(143)");
  const outcome = await run.outcome;
  assert.equal(outcome.kind, "failed");
  assert.match(outcome.cause.message, /exited 143/u);
  assertGroupGone(run.child);
});

test("owned shutdown preserves a different exit failure", async () => {
  const run = start(`
    process.on('SIGTERM', () => process.exit(1));
    process.stdout.write('ready');
    setInterval(() => {}, 1000);
  `);
  try {
    await once(run.child.stdout, "data");
    await assert.rejects(run.stop(), /exited 1/u);
    assert.equal((await run.outcome).kind, "failed");
    assertGroupGone(run.child);
  } finally {
    await terminateProcessGroup(run.child);
  }
});

test("owned shutdown escalates when its group ignores SIGTERM", async () => {
  const run = start(`
    process.on('SIGTERM', () => {});
    process.stdout.write('ready');
    setInterval(() => {}, 1000);
  `);
  try {
    await once(run.child.stdout, "data");
    await run.stop();
    assert.equal(run.child.signalCode, "SIGKILL");
    assertGroupGone(run.child);
  } finally {
    await terminateProcessGroup(run.child);
  }
});

test("owned shutdown waits for the leader to reap its descendant", async () => {
  const run = start(`
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['--eval', \`
      process.on('SIGTERM', () => process.exit(0));
      process.stdout.write('ready');
      setInterval(() => {}, 1000);
    \`], { stdio: ['ignore', 'pipe', 'ignore'] });
    process.on('SIGTERM', () => {
      child.once('exit', () => process.exit(143));
    });
    child.stdout.once('data', () => process.stdout.write('ready'));
  `);
  try {
    await once(run.child.stdout, "data");
    await run.stop();
    assert.equal((await run.outcome).kind, "completed");
    assertGroupGone(run.child);
  } finally {
    await terminateProcessGroup(run.child);
  }
});

test("late stop cannot forgive a child's own numeric termination exit", async () => {
  const run = start(`
    const { spawn } = require('node:child_process');
    const holder = spawn(process.execPath, ['--eval',
      "process.stdout.write(String(process.pid)); setInterval(() => {}, 1000)"
    ], { detached: true, stdio: ['ignore', 'inherit', 'inherit'] });
    holder.unref();
    process.on('SIGUSR1', () => process.exit(143));
    setInterval(() => {}, 1000);
  `);
  let holder;
  let closed = false;
  run.child.once("close", () => {
    closed = true;
  });
  try {
    const [data] = await once(run.child.stdout, "data");
    holder = Number(String(data));
    const exited = once(run.child, "exit");
    run.child.kill("SIGUSR1");
    await exited;
    assert.equal(closed, false, "grandchild must still hold stdout open");
    const stopped = run.stop();
    const rejection = assert.rejects(stopped, /exited 143/u);
    killFixtureGroup(holder);
    holder = undefined;
    await rejection;
    assert.equal((await run.outcome).kind, "failed");
    assertGroupGone(run.child);
  } finally {
    if (holder) killFixtureGroup(holder);
    await terminateProcessGroup(run.child);
  }
});

test("normal cleanup removes every signal listener it installed", () => {
  const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
  const before = signals.map((signal) => process.listenerCount(signal));
  const remove = installCleanupSignals(() => assert.fail("unexpected signal"));
  try {
    assert.deepEqual(
      signals.map((signal) => process.listenerCount(signal)),
      before.map((count) => count + 1),
    );
  } finally {
    remove();
  }
  assert.deepEqual(
    signals.map((signal) => process.listenerCount(signal)),
    before,
  );
});

for (const [signal, number] of [
  ["SIGINT", 2],
  ["SIGTERM", 15],
  ["SIGHUP", 1],
]) {
  test(`CLI ${signal} cleans its detached group before exiting`, async () => {
    const moduleUrl = new URL("./workbench-process.mjs", import.meta.url).href;
    const driver = start(`
    const { spawnBounded, installCleanupSignals } = await import(${JSON.stringify(moduleUrl)});
    const run = spawnBounded(process.execPath, ['--eval',
      "process.on('SIGTERM', () => {}); process.stdout.write('ready'); setInterval(() => {}, 1000)"
    ], { timeoutMs: 0, label: 'driver child' });
    run.completion.catch(error => { console.error(error); });
    installCleanupSignals(async () => {
      process.stdout.write('stopping');
      await run.stop();
    });
    run.child.stdout.once('data', () => process.stdout.write(String(run.child.pid)));
  `);
    let group;
    let groupGone = false;
    try {
      const [data] = await once(driver.child.stdout, "data");
      group = Number(String(data));
      const stopping = once(driver.child.stdout, "data");
      driver.child.kill(signal);
      const [marker] = await stopping;
      assert.equal(String(marker), "stopping");
      driver.child.kill(signal);
      const outcome = await driver.outcome;
      assert.equal(outcome.kind, "failed");
      assert.throws(() => process.kill(-group, 0), { code: "ESRCH" });
      groupGone = true;
      assert.equal(driver.child.exitCode, 128 + number);
    } finally {
      if (group && !groupGone) killFixtureGroup(group);
      await terminateProcessGroup(driver.child);
    }
  });
}
