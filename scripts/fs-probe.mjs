export function isErrno(error, code) {
  return error instanceof Error && "code" in error && error.code === code;
}

/** Treat only a missing path as absence; permission and I/O failures propagate. */
export async function probeFile(operation) {
  try {
    return { kind: "present", value: await operation() };
  } catch (cause) {
    if (isErrno(cause, "ENOENT")) return { kind: "absent" };
    throw cause;
  }
}
