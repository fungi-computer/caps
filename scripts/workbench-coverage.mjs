import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Ajv from "ajv";
import { format } from "prettier";
import { packageRoot } from "./workbench-process.mjs";

const coverageSchema = {
  $id: "https://fungi.computer/schemas/caps-workbench-coverage-v1.json",
  type: "object",
  additionalProperties: false,
  required: ["version", "items"],
  properties: {
    version: { const: 1 },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 500,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "storyId"],
        properties: {
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            pattern: "^[a-z0-9-]+$",
          },
          storyId: {
            type: "string",
            minLength: 1,
            maxLength: 200,
            pattern: "^[a-z0-9-]+--[a-z0-9-]+$",
          },
        },
      },
    },
  },
};

// The consolidated root includes every visual App as well as Caps.
const maxConsolidatedStories = 1000;
const metaSchema = {
  type: "object",
  required: ["stories"],
  properties: {
    stories: {
      type: "object",
      maxProperties: maxConsolidatedStories,
      additionalProperties: { type: "object" },
    },
  },
  additionalProperties: true,
};

const registryInventorySchema = {
  type: "object",
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        },
        additionalProperties: true,
      },
    },
  },
  additionalProperties: true,
};

export const targetStoryIds = Object.freeze({
  keyboard: "checks--keyboard-focus",
  controlled: "checks--controlled-interaction",
  uncontrolled: "checks--uncontrolled-interaction",
  accessible: "checks--accessible-state",
  cleanup: "checks--cleanup-remount",
  responsive: "checks--responsive-density",
  themes: "foundations--themes",
  dashboard: "layouts--dashboard-composition",
  parakeet: "layouts--parakeet-composition",
});

const ajv = new Ajv({ allErrors: true, strict: true });
const validateCoverageDocument = ajv.compile(coverageSchema);
const validateMetaDocument = ajv.compile(metaSchema);
const validateRegistryInventory = ajv.compile(registryInventorySchema);

function fail(message, cause) {
  throw new Error(`Caps workbench contract: ${message}`, { cause });
}

function parseBoundedJson(text, label, maxBytes = 4 * 1024 * 1024) {
  if (Buffer.byteLength(text) > maxBytes)
    fail(`${label} exceeds ${maxBytes} bytes`);
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(
      `${label} is not JSON: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

function decodeCoverage(text, label) {
  const document = parseBoundedJson(text, label);
  if (!validateCoverageDocument(document)) {
    fail(
      `coverage.json schema mismatch: ${ajv.errorsText(validateCoverageDocument.errors)}`,
    );
  }
  const names = document.items.map((item) => item.name);
  const storyIds = document.items.map((item) => item.storyId);
  if (new Set(names).size !== names.length)
    fail("coverage names contain duplicates");
  if (new Set(storyIds).size !== storyIds.length)
    fail("coverage story IDs contain duplicates");

  return document;
}

function assertInventory(document, registry) {
  const names = document.items.map((item) => item.name);
  if (!validateRegistryInventory(registry))
    fail(
      `registry.json schema mismatch: ${ajv.errorsText(validateRegistryInventory.errors)}`,
    );
  if (registry.items.length !== document.items.length)
    fail("registry.json and coverage.json must contain the same inventory");
  const registryNames = registry.items.map((item) => item?.name);
  if (new Set(registryNames).size !== registryNames.length)
    fail("registry item names contain duplicates");
  const missing = registryNames.filter((name) => !names.includes(name));
  const extra = names.filter((name) => !registryNames.includes(name));
  if (missing.length || extra.length) {
    fail(
      `coverage names differ from registry (missing: ${missing.join(",") || "none"}; extra: ${extra.join(",") || "none"})`,
    );
  }
}

/** Generate the coverage output from authored story mappings, checking every item. */
export async function renderCoverage(registry) {
  const source = decodeCoverage(
    await readFile(
      join(packageRoot, "registry-source/workbench-coverage.json"),
      "utf8",
    ),
    "registry-source/workbench-coverage.json",
  );
  assertInventory(source, registry);
  return format(JSON.stringify(source), {
    filepath: join(packageRoot, "workbench/coverage.json"),
  });
}

export async function readCoverage() {
  const text = await readFile(
    join(packageRoot, "workbench/coverage.json"),
    "utf8",
  );
  const document = decodeCoverage(text, "coverage.json");
  const registry = parseBoundedJson(
    await readFile(join(packageRoot, "registry.json"), "utf8"),
    "registry.json",
  );
  assertInventory(document, registry);
  if (text !== (await renderCoverage(registry)))
    fail("coverage.json is stale; run registry:generate");
  return document;
}

export function assertMetaCoverage(meta, coverage) {
  if (!validateMetaDocument(meta))
    fail(
      `Ladle meta.json schema mismatch: ${ajv.errorsText(validateMetaDocument.errors)}`,
    );
  const stories = meta.stories;
  const missing = coverage.items
    .map((item) => item.storyId)
    .filter((storyId) => !(storyId in stories));
  if (missing.length)
    fail(
      `coverage story IDs absent from Ladle meta.json: ${missing.join(", ")}`,
    );
  const targetMissing = Object.values(targetStoryIds).filter(
    (storyId) => !(storyId in stories),
  );
  if (targetMissing.length)
    fail(
      `stable workbench target stories absent from Ladle meta.json: ${targetMissing.join(", ")}`,
    );
  return stories;
}
