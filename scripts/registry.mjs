import {
  lstat,
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { format } from "prettier";
import postcss from "postcss";
import postcssJs from "postcss-js";
import tsModule from "typescript";

import { renderCoverage, readCoverage } from "./workbench-coverage.mjs";
import { probeFile } from "./fs-probe.mjs";
import { parseJson } from "./registry-schema.mjs";

const ts = tsModule.default ?? tsModule;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(root, "registry-source");
const outputRoot = resolve(root, "registry");
const registryRootPath = resolve(root, "registry.json");
const rootRegistryPath = resolve(sourceRoot, "registry.json");
const stipePackage = "@fungi.computer/stipe";
const stipeCssImport = `@import "${stipePackage}/styles.css"`;
const localRegistryPrefix = "@shiit/";
const capsStylePath = resolve(root, "src/styles.css");
const capsCssScopes = new Map([
  ["button", ["caps-button"]],
  ["input", ["caps-input", "caps-search-"]],
  ["card", ["caps-card"]],
  ["game-share-card", ["caps-game-share"]],
  ["store-card", ["caps-store-"]],
  ["badge", ["caps-badge"]],
  ["loader", ["caps-loader"]],
  ["toaster", ["caps-toaster"]],
  ["alert", ["caps-alert"]],
  ["upload-queue", ["caps-upload"]],
  ["permission-grid", ["caps-permission-grid"]],
  [
    "scroll-area",
    ["caps-scroll", "caps-surface", "caps-screen", "caps-display"],
  ],
  ["field", ["caps-field"]],
  ["code-input", ["caps-code-"]],
  ["presence", ["caps-collapse", "caps-swap"]],
  ["activity-line", ["caps-activity-line"]],
  ["tool-call-chip", ["caps-tool-call"]],
  ["generation-frame", ["caps-generation-"]],
  ["send-action", ["caps-send-"]],
  ["undo-action", ["caps-fuse", "caps-undo-", "caps-hold-"]],
  ["select", ["caps-select"]],
  [
    "combobox",
    ["caps-input", "caps-select", "caps-combobox", "caps-glide", "kbd"],
  ],
  ["dropdown-menu", ["caps-dropdown", "caps-glide"]],
  ["listbox", ["caps-glide"]],
  ["command-menu", ["caps-glide"]],
  ["window", ["caps-window"]],
  ["status", ["caps-status"]],
  ["checkbox", ["caps-checkbox"]],
  ["icon-checkbox", ["caps-icon-choice"]],
  ["icon-lamp", ["caps-icon-choice", "caps-icon-lamp"]],
  ["icon-radio", ["caps-icon-choice"]],
  ["radio-group", ["caps-radio"]],
  ["switch", ["caps-gooey-motion", "caps-switch"]],
  ["progress", ["caps-gooey-motion", "caps-gooey-progress"]],
  ["app-bar", ["caps-app-bar"]],
  ["pricing-card", ["caps-pricing-card"]],
  ["faq-chat", ["caps-faq-chat"]],
  ["spec-sheet", ["caps-spec-"]],
  [
    "technonomicon",
    [
      "caps-plate",
      "caps-stage-plate",
      "caps-cigarette-card",
      "caps-album",
      "caps-keycap",
      "caps-cartridge-label",
      "caps-specimen-label",
      "caps-margin-note",
      "caps-callout",
      "caps-growth-badge",
      "caps-issue",
      "caps-spread",
      "caps-note-teaser",
      "caps-inset",
      "caps-prose-dropcap",
      "caps-sketch",
      "caps-pencil-reveal",
      "caps-meta",
      "caps-entry-row",
      "caps-toc",
      "caps-backlinks",
      "caps-tool-call",
      "caps-collage",
      "caps-nav",
      "caps-shortcuts",
      "caps-skip-link",
    ],
  ],
]);
const capsCssKeyframes = new Map([["card", ["caps-card-wiggle"]]]);
const cardBackedBlocks = new Set([
  "section-card",
  "pricing-card",
  "game-share-card",
]);
const canonicalJson = (value, filepath) =>
  format(JSON.stringify(value), { filepath });

const inside = (parent, child) => {
  const rel = relative(parent, child);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`));
};

async function regularFile(path, label) {
  const result = await probeFile(() => lstat(path));
  if (
    result.kind === "absent" ||
    !result.value.isFile() ||
    result.value.isSymbolicLink()
  )
    throw new Error(`${label} must be a regular file: ${path}`);
  return path;
}

async function readJson(path, documentKind, label) {
  await regularFile(path, label);
  return parseJson(await readFile(path, "utf8"), documentKind, label);
}

async function loadRegistry(path, seen = new Set()) {
  const absolute = resolve(path);
  if (!inside(sourceRoot, absolute))
    throw new Error(`Registry include escapes registry-source: ${path}`);
  if (seen.has(absolute))
    throw new Error(`Registry include cycle: ${absolute}`);
  seen.add(absolute);
  const registry = await readJson(absolute, "registry", "Registry descriptor");
  const entries = registry.items.map((item) => ({
    item,
    registryPath: absolute,
  }));
  for (const include of registry.include ?? [])
    entries.push(
      ...(await loadRegistry(resolve(dirname(absolute), include), seen)),
    );
  seen.delete(absolute);
  return entries;
}

async function sourceEntries() {
  const entries = await loadRegistry(rootRegistryPath);
  if (entries.length !== 74)
    throw new Error(
      `Caps registry must contain exactly 74 items; found ${entries.length}`,
    );
  const names = new Set();
  for (const { item } of entries) {
    if (names.has(item.name))
      throw new Error(`Duplicate registry item: ${item.name}`);
    names.add(item.name);
  }
  return entries;
}

function sourceFilePath(registryPath, file) {
  const path = resolve(dirname(registryPath), file.path);
  if (!inside(root, path))
    throw new Error(`Registry source path escapes Caps: ${file.path}`);
  return path;
}

async function readSourcePath(stem) {
  const path = await findSourcePath(stem);
  return { content: await readFile(path, "utf8"), path };
}

async function findSourcePath(stem) {
  const sourceStem = stem.replace(/\.js$/, "");
  for (const candidate of [
    sourceStem,
    `${sourceStem}.ts`,
    `${sourceStem}.tsx`,
  ]) {
    const result = await probeFile(() => lstat(candidate));
    if (
      result.kind === "present" &&
      result.value.isFile() &&
      !result.value.isSymbolicLink()
    )
      return candidate;
  }
  throw new Error(`Registry source path is missing: ${stem}`);
}

async function readSourceImport(absPath, specifier) {
  let path;
  try {
    path = await findSourcePath(resolve(dirname(absPath), specifier));
  } catch (error) {
    throw new Error(
      `Registry source import is missing: ${specifier} from ${absPath}`,
      {
        cause: error,
      },
    );
  }
  if (!inside(root, path))
    throw new Error(
      `Registry relative source import escapes Caps: ${specifier} from ${absPath}`,
    );
  return { content: await readFile(path, "utf8"), path };
}

const packageName = (specifier) =>
  specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];

const targetPath = (target) => {
  const match = /^@([^/]+)\/(.+)$/.exec(target);
  if (!match) throw new Error(`Registry target must use an alias: ${target}`);
  const [, alias, suffix] = match;
  return alias === "ui"
    ? `components/ui/${suffix}`
    : alias === "lib"
      ? `lib/${suffix}`
      : alias === "components"
        ? `components/${suffix}`
        : target;
};

const withoutExtension = (path) =>
  path.replace(/\.(?:jsx?|tsx?)$/, "").replace(/\/index$/, "");

const importsFrom = (content) =>
  ts
    .preProcessFile(content, true, true)
    .importedFiles.map(({ fileName }) => fileName);

function resolveInstalledImport(importerTarget, specifier, installed) {
  const importer = targetPath(importerTarget);
  const candidate = specifier.startsWith("@/")
    ? specifier.slice(2)
    : resolve(dirname(`/${importer}`), specifier).slice(1);
  if (!installed.has(withoutExtension(candidate)))
    throw new Error(
      `Registry import ${specifier} from ${importerTarget} is not installed by this item or its registryDependencies`,
    );
}

function declaredDependencyNames(item, byName) {
  const names = new Set();
  const visit = (name) => {
    if (names.has(name)) return;
    const dependency = name.startsWith(localRegistryPrefix)
      ? name.slice(localRegistryPrefix.length)
      : null;
    if (!dependency || !byName.has(dependency))
      throw new Error(`Registry dependency must name a local item: ${name}`);
    names.add(name);
    for (const nested of byName.get(dependency).item.registryDependencies)
      visit(nested);
  };
  for (const name of item.registryDependencies) visit(name);
  return names;
}

async function dependencyClosure(entry, seen = new Set()) {
  const dependencies = new Set([stipePackage]);
  for (const file of entry.item.files) {
    const absPath = sourceFilePath(entry.registryPath, file);
    if (seen.has(absPath)) continue;
    seen.add(absPath);
    const content = await readFile(
      await regularFile(absPath, "Registry source"),
      "utf8",
    );
    for (const specifier of importsFrom(content)) {
      if (specifier.startsWith(".")) await readSourceImport(absPath, specifier);
      else if (specifier.startsWith("@/"))
        await readSourcePath(resolve(root, "src", specifier.slice(2)));
      else dependencies.add(packageName(specifier));
    }
  }
  return dependencies;
}

const adaptSourceImports = (content) =>
  content
    .replaceAll(
      'from "./overlay-root.js"',
      'from "@/components/ui/overlay-root"',
    )
    .replaceAll(
      'from "../components/overlay-root.js"',
      'from "@/components/ui/overlay-root"',
    )
    .replaceAll('from "./prose.js"', 'from "@/components/ui/prose"')
    .replaceAll("from './prose.js'", "from '@/components/ui/prose'")
    .replaceAll(
      'from "../lib/tanstack-highlight.js"',
      'from "@/lib/tanstack-highlight"',
    )
    .replaceAll("@shiit/stipe", stipePackage)
    .replaceAll('from "../components/card.js"', 'from "@/components/ui/card"')
    .replaceAll("from '../components/card.js'", "from '@/components/ui/card'")
    .replaceAll(
      'from "../components/icon-button.js"',
      'from "@/components/ui/icon-button"',
    )
    .replaceAll(
      'from "../components/progress.js"',
      'from "@/components/ui/progress"',
    )
    .replaceAll('from "../components/gooey.js"', 'from "@/components/ui/gooey"')
    .replaceAll(
      'from "../components/button.js"',
      'from "@/components/ui/button"',
    )
    .replaceAll('from "../components/input.js"', 'from "@/components/ui/input"')
    .replaceAll('from "../lib/cn.js"', 'from "@/lib/cn"')
    .replaceAll("from '../lib/cn.js'", "from '@/lib/cn'")
    .replaceAll('from "../lib/ime.js"', 'from "@/lib/ime"')
    .replaceAll('from "../lib/motion.js"', 'from "@/lib/motion"')
    .replaceAll('from "../lib/motion-spring.js"', 'from "@/lib/motion-spring"')
    .replaceAll('from "../lib/seed-hash.js"', 'from "@/lib/seed-hash"')
    .replaceAll('from "../lib/glide.js"', 'from "@/lib/glide"')
    .replaceAll(
      'from "../components/selectable.js"',
      'from "@/components/selectable"',
    )
    .replaceAll(
      "from '../components/selectable.js'",
      "from '@/components/selectable'",
    )
    .replaceAll(
      'from "../components/combobox.js"',
      'from "@/components/ui/combobox"',
    )
    .replaceAll(
      "from '../components/combobox.js'",
      "from '@/components/ui/combobox'",
    );

async function capsCssFor(name) {
  const scopes = capsCssScopes.get(name);
  if (scopes === undefined) return {};
  const source = await readFile(
    await regularFile(capsStylePath, "Caps authored stylesheet"),
    "utf8",
  );
  const cssRoot = postcss.parse(source, { from: capsStylePath });
  // Comments must not keep otherwise empty layers alive: repeated empty
  // layers objectify as arrays, which are not valid registry CSS objects.
  cssRoot.walkComments((comment) => comment.remove());
  cssRoot.walkAtRules((rule) => {
    if (rule.name === "import" || rule.name === "source") rule.remove();
  });
  // Keyframe steps are not selectors. Export only animations owned by the
  // item, then leave their steps intact during selector scoping.
  cssRoot.walkAtRules("keyframes", (rule) => {
    if (!capsCssKeyframes.get(name)?.includes(rule.params)) rule.remove();
  });
  cssRoot.walkRules((rule) => {
    if (rule.parent.name === "keyframes") return;
    const selectors = postcss.list
      .comma(rule.selector)
      .filter((selector) =>
        scopes.some((scope) => selector.includes(`.${scope}`)),
      );
    if (selectors.length === 0) rule.remove();
    else rule.selector = selectors.join(",");
  });
  const atRules = [];
  cssRoot.walkAtRules((rule) => {
    atRules.push(rule);
  });
  for (const rule of atRules.reverse()) {
    if (rule.nodes?.length === 0) rule.remove();
  }
  // Registry CSS represents each at-rule as one object. Group repeated
  // layers/media in the parsed tree before postcss-js turns them into arrays.
  function groupAtRules(container) {
    const groups = new Map();
    for (const node of container.nodes?.slice() ?? []) {
      if (node.type !== "atrule" || !node.nodes) continue;
      const key = `${node.name} ${node.params}`;
      const previous = groups.get(key);
      if (previous) {
        previous.append(...node.nodes);
        node.remove();
      } else groups.set(key, node);
    }
    for (const node of container.nodes ?? []) {
      if (node.nodes) groupAtRules(node);
    }
  }
  groupAtRules(cssRoot);
  const objectified = postcssJs.objectify(cssRoot);
  // postcss-js objectifies a bodiless at-rule such as
  // `@plugin "@tailwindcss/typography"` to `true`, but registry CSS entries are
  // objects; shadcn writes `{}` back as the same bodiless rule.
  for (const [key, value] of Object.entries(objectified))
    if (key.startsWith("@plugin") && value === true) objectified[key] = {};
  return objectified;
}

async function itemWithCapsCss(entry) {
  const css = await capsCssFor(entry.item.name);
  return Object.keys(css).length === 0
    ? entry.item
    : { ...entry.item, css: { ...entry.item.css, ...css } };
}

async function materializeItem(entry) {
  const item = await itemWithCapsCss(entry);
  const files = [];
  for (const file of item.files) {
    const content = await readFile(
      await regularFile(
        sourceFilePath(entry.registryPath, file),
        "Registry source",
      ),
      "utf8",
    );
    files.push({ ...file, content: adaptSourceImports(content) });
  }
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    ...item,
    files,
  };
}

async function jsonFiles(dir) {
  const result = await probeFile(() => lstat(dir));
  if (
    result.kind === "absent" ||
    !result.value.isDirectory() ||
    result.value.isSymbolicLink()
  )
    throw new Error(`Registry output must be a real directory: ${dir}`);
  return readdir(dir, { withFileTypes: true });
}

const rootPayload = async (entries) => ({
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "fungi-computer-caps",
  homepage: "https://fungi.computer",
  items: await Promise.all(entries.map((entry) => itemWithCapsCss(entry))),
});

async function writeOutputs(entries) {
  const payload = await rootPayload(entries);
  const coverage = await renderCoverage(payload);
  await mkdir(outputRoot, { recursive: true });
  const expected = new Set(entries.map(({ item }) => `${item.name}.json`));
  for (const file of await jsonFiles(outputRoot)) {
    if (file.isSymbolicLink())
      throw new Error(
        `Registry output symlink rejected: ${resolve(outputRoot, file.name)}`,
      );
    if (
      file.isFile() &&
      file.name.endsWith(".json") &&
      !expected.has(file.name)
    )
      await unlink(resolve(outputRoot, file.name));
  }
  await writeFile(
    registryRootPath,
    await canonicalJson(payload, registryRootPath),
  );
  await writeFile(resolve(root, "workbench/coverage.json"), coverage);
  for (const entry of entries)
    await writeFile(
      resolve(outputRoot, `${entry.item.name}.json`),
      await canonicalJson(
        await materializeItem(entry),
        resolve(outputRoot, `${entry.item.name}.json`),
      ),
    );
}

function assertComboboxClosure(byName) {
  const combobox = byName.get("combobox")?.item;
  const listbox = byName.get("listbox")?.item;
  if (!combobox?.registryDependencies.includes("@shiit/listbox"))
    throw new Error(
      "Combobox must declare the local @shiit/listbox registry dependency",
    );
  if (
    !listbox?.files.some(
      ({ path }) => path === "../src/components/selectable.ts",
    )
  )
    throw new Error(
      "Listbox must materialize the shared selectable.ts closure",
    );
}

async function check() {
  await readCoverage();
  const entries = await sourceEntries();
  const byName = new Map(entries.map((entry) => [entry.item.name, entry]));
  assertComboboxClosure(byName);
  const rootBytes = await readFile(
    await regularFile(registryRootPath, "Generated registry root"),
    "utf8",
  );
  const parsedRoot = parseJson(
    rootBytes,
    "registry",
    "Generated registry root",
  );
  if (parsedRoot.include || parsedRoot.name !== "fungi-computer-caps")
    throw new Error(
      "Generated registry root must be flattened and use the current name",
    );
  if (
    rootBytes !==
    (await canonicalJson(await rootPayload(entries), registryRootPath))
  )
    throw new Error("Generated registry root is stale; run registry:generate");
  const names = new Set(entries.map(({ item }) => item.name));
  for (const entry of entries) {
    if (!entry.item.css[stipeCssImport])
      throw new Error(
        `Registry item ${entry.item.name} is missing the standard Stipe CSS import`,
      );
    if (!entry.item.dependencies.includes(stipePackage))
      throw new Error(
        `Registry item ${entry.item.name} is missing the current Stipe dependency`,
      );
    const path = resolve(outputRoot, `${entry.item.name}.json`);
    const expected = await canonicalJson(await materializeItem(entry), path);
    const itemStat = await probeFile(() => lstat(path));
    let actual = "";
    if (itemStat.kind === "present") {
      if (!itemStat.value.isFile() || itemStat.value.isSymbolicLink())
        throw new Error(
          `Generated registry item must be a regular file: ${path}`,
        );
      const actualFile = await probeFile(() => readFile(path, "utf8"));
      if (actualFile.kind === "present") actual = actualFile.value;
    }
    if (actual !== expected)
      throw new Error(
        `Registry item ${entry.item.name} is stale; run registry:generate`,
      );
    const parsedItem = parseJson(
      actual,
      "item",
      `Generated registry item ${entry.item.name}`,
    );
    const installed = new Set();
    const install = async (candidate) => {
      for (const file of (await materializeItem(candidate)).files)
        installed.add(withoutExtension(targetPath(file.target)));
    };
    await install(entry);
    for (const dependency of declaredDependencyNames(entry.item, byName))
      await install(byName.get(dependency.slice(localRegistryPrefix.length)));
    for (const file of parsedItem.files)
      for (const specifier of importsFrom(file.content))
        if (specifier.startsWith(".") || specifier.startsWith("@/"))
          resolveInstalledImport(file.target, specifier, installed);
    if (
      actual.includes("@shiit/caps") ||
      actual.includes("@fungi.computer/caps")
    )
      throw new Error(
        `Registry item ${entry.item.name} imports Caps at runtime`,
      );
    if (cardBackedBlocks.has(entry.item.name)) {
      if (!entry.item.registryDependencies.includes("@shiit/card"))
        throw new Error(
          `Registry item ${entry.item.name} must declare @shiit/card`,
        );
      if (
        !parsedItem.files.some((file) =>
          file.content.includes('from "@/components/ui/card"'),
        )
      )
        throw new Error(
          `Registry item ${entry.item.name} must import canonical UI Card`,
        );
    }
    const declared = [...new Set(entry.item.dependencies)]
      .map(packageName)
      .sort();
    const discovered = [...(await dependencyClosure(entry))].sort();
    if (JSON.stringify(declared) !== JSON.stringify(discovered))
      throw new Error(
        `Registry item ${entry.item.name} dependency closure is stale: declared ${JSON.stringify(declared)} discovered ${JSON.stringify(discovered)}`,
      );
  }
  for (const file of await jsonFiles(outputRoot)) {
    if (file.isSymbolicLink())
      throw new Error(
        `Registry output symlink rejected: ${resolve(outputRoot, file.name)}`,
      );
    if (
      file.isFile() &&
      file.name.endsWith(".json") &&
      !names.has(file.name.slice(0, -5))
    )
      throw new Error(`Registry item ${file.name.slice(0, -5)} is stale`);
  }
}

if (process.argv[2] === "check") await check();
else await writeOutputs(await sourceEntries());
