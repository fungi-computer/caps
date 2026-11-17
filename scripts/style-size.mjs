import { execFileSync } from "node:child_process";
import console from "node:console";
import { globSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const policy = z.object({ maxLines: z.number().int().positive() }).strict();
const decodePolicy = (source) => policy.parse(JSON.parse(source));

/** An established ceiling can only decrease, including in a committed change. */
export function limitViolations(current, history) {
  const ceiling = history.reduce(
    (lowest, limit) => Math.min(lowest, limit),
    current,
  );
  return current > ceiling
    ? [`CSS line ceiling increased from ${ceiling} to ${current}`]
    : [];
}

/** Count physical source lines, with the same trailing-newline convention as wc. */
export function sizeViolations(files, maxLines) {
  return Object.entries(files).flatMap(([file, source]) => {
    const lines = source
      ? source.split("\n").length - Number(source.endsWith("\n"))
      : 0;
    return lines > maxLines
      ? [`${file}: ${lines} lines exceeds ${maxLines}`]
      : [];
  });
}

export function checkStyleSizes() {
  const { maxLines } = decodePolicy(
    readFileSync(join(packageRoot, "style-size.json"), "utf8"),
  );
  const files = Object.fromEntries(
    globSync("src/**/*.css", { cwd: packageRoot }).map((file) => [
      file,
      readFileSync(join(packageRoot, file), "utf8"),
    ]),
  );
  if (Object.keys(files).length === 0) throw new Error("No Caps CSS found");
  const errors = sizeViolations(files, maxLines);
  const repository = resolve(packageRoot, "../..");
  const path = relative(repository, join(packageRoot, "style-size.json"));
  // The smallest ancestral ceiling survives reductions, deletion/reintroduction
  // and multiple commits on a branch. No history means initial introduction.
  const revisions = execFileSync(
    "git",
    ["log", "--full-history", "--format=%H", "HEAD", "--", path],
    { cwd: repository, encoding: "utf8" },
  ).trim();
  const history = [];
  for (const ref of revisions ? revisions.split("\n") : []) {
    const tracked = execFileSync(
      "git",
      ["ls-tree", "--name-only", ref, "--", path],
      { cwd: repository, encoding: "utf8" },
    );
    if (!tracked.trim()) continue;
    const previous = decodePolicy(
      execFileSync("git", ["show", `${ref}:${path}`], {
        cwd: repository,
        encoding: "utf8",
      }),
    );
    history.push(previous.maxLines);
  }
  errors.push(...limitViolations(maxLines, history));
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = checkStyleSizes();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else console.log("Caps CSS size limit passed (shrink-only).");
}
