import assert from "node:assert/strict";
import { test } from "node:test";
import { probeFile } from "./fs-probe.mjs";
import { signalChild } from "./workbench-process.mjs";

test("probeFile returns an absent outcome only for ENOENT", async () => {
  assert.deepEqual(await probeFile(() => Promise.resolve("file contents")), {
    kind: "present",
    value: "file contents",
  });
  assert.deepEqual(
    await probeFile(() =>
      Promise.reject(Object.assign(new Error(), { code: "ENOENT" })),
    ),
    { kind: "absent" },
  );

  for (const code of ["EACCES", "EIO"]) {
    const failure = Object.assign(new Error(code), { code });
    await assert.rejects(
      probeFile(() => Promise.reject(failure)),
      failure,
    );
  }
});

test("signalChild handles an exited child and propagates other signal errors", () => {
  assert.deepEqual(
    signalChild(
      {
        kill() {
          throw Object.assign(new Error("already exited"), { code: "ESRCH" });
        },
      },
      "SIGTERM",
    ),
    { kind: "already-exited" },
  );
  const denied = Object.assign(new Error("signal denied"), { code: "EPERM" });
  assert.throws(
    () =>
      signalChild(
        {
          kill() {
            throw denied;
          },
        },
        "SIGTERM",
      ),
    denied,
  );
});
