import { globSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import console from "node:console";
import ts from "typescript";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";
import { resolveNestedSelector } from "@csstools/selector-resolve-nested";
import valueParser from "postcss-value-parser";
import { stipeThemeSchema } from "@fungi.computer/stipe/theme";

// Roles, emphasis, interaction, layout and depicted content are component
// choices. A new finish belongs in Stipe, not in this vocabulary.
const variants = new Set([
  "default",
  "primary",
  "secondary",
  "accent",
  "destructive",
  "ghost-destructive",
  "solid",
  "quiet",
  "outline",
  "ghost",
  "link",
  "surface",
  "interactive",
  "game",
  "fit",
  "bordered",
  "segmented",
  "plain",
  "panel",
  "speech",
  "hint",
  "initial",
  "specimen",
  "listing",
  "cartridge",
  "server",
  "dropcap",
  "grip",
  "notch",
  // Loader formations describe the moving beads, not their material.
  "line",
  "wander",
  "square",
  "donut",
  "bloom",
]);
const hex = /#[\da-f]{3}(?:[\da-f]{1}|[\da-f]{3}(?:[\da-f]{2})?)?\b/iu;
const paint =
  /^(?:color|background(?:-.+)?|border(?:-.+)?|outline(?:-.+)?|box-shadow|text-shadow|font(?:-.+)?|fill|stroke|opacity)$/u;

export function sourceTree(source, file) {
  return ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function propertyName(node) {
  return node && (ts.isIdentifier(node) || ts.isStringLiteralLike(node))
    ? node.text
    : undefined;
}

// TypeScript owns traversal and syntax. Each policy inspects only its own nodes.
function walkSource(tree, inspect) {
  const visit = (node) => {
    inspect(node);
    ts.forEachChild(node, visit);
  };
  visit(tree);
}

const textKinds = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
]);

function checkTheme(node, report) {
  if (!ts.isPropertyAssignment(node)) return;
  if (propertyName(node.name) !== "theme") return;
  if (!ts.isStringLiteralLike(node.initializer)) return;
  if (!stipeThemeSchema.safeParse(node.initializer.text).success)
    report(node, `unknown Stipe theme '${node.initializer.text}'`);
}

function variantLiterals(node, aliases, visited = new Set()) {
  if (ts.isUnionTypeNode(node))
    return node.types.flatMap((type) =>
      variantLiterals(type, aliases, visited),
    );
  if (ts.isLiteralTypeNode(node)) return [node.literal];
  if (!ts.isTypeReferenceNode(node)) return [];
  const name = node.typeName.getText();
  if (visited.has(name)) return [];
  const alias = aliases.get(name);
  return alias
    ? variantLiterals(alias, aliases, new Set([...visited, name]))
    : [];
}

function variantChoices(node, aliases) {
  if (propertyName(node.name) !== "variant") return [];
  if (ts.isPropertySignature(node) && node.type)
    return variantLiterals(node.type, aliases);
  if (!ts.isPropertyAssignment(node)) return [];
  if (!ts.isObjectLiteralExpression(node.initializer)) return [];
  return node.initializer.properties.map((choice) => choice.name);
}

/** Static source checks supplement the cartridge's runtime Stipe enum decoder. */
export function sourceViolations(tree, { cartridge = false } = {}) {
  const errors = [];
  const report = (node, message) =>
    errors.push(
      `${tree.fileName}:${tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1}: ${message}`,
    );
  walkSource(tree, (node) => checkTheme(node, report));
  if (cartridge) return errors;
  const aliases = new Map(
    tree.statements
      .filter(ts.isTypeAliasDeclaration)
      .map((node) => [node.name.text, node.type]),
  );
  walkSource(tree, (node) => {
    if (textKinds.has(node.kind) && hex.test(node.text))
      report(node, "component colors must use Stipe tokens, not hex literals");
    for (const choice of variantChoices(node, aliases)) {
      const name = propertyName(choice);
      if (name && !variants.has(name))
        report(
          choice,
          `variant '${name}' is not semantic; put finishes in Stipe`,
        );
    }
  });
  return errors;
}

/** Classes declared by a component (including its private drawing parts). */
export function componentOwners(trees) {
  const owners = new Map();
  // These are implementation parts, not independently styled controls.
  const parts = new Map([
    ["checkbox-bead.tsx", "checkbox.tsx"],
    ["rough-drawing.ts", "rough.tsx"],
    ["icon-checkbox.tsx", "icon-choice"],
    ["icon-radio.tsx", "icon-choice"],
    ["icon-choice-mark.tsx", "icon-choice"],
    ["icon-lamp.tsx", "icon-choice"],
  ]);
  for (const tree of trees) {
    const file = tree.fileName.split("/").at(-1);
    const owner = parts.get(file) ?? file;
    walkSource(tree, (node) => {
      if (!ts.isStringLiteralLike(node)) return;
      for (const name of node.text
        .split(/\s+/u)
        .filter((value) => /^caps-[a-z0-9-]+$/u.test(value))) {
        const entries = owners.get(name) ?? new Set();
        entries.add(owner);
        owners.set(name, entries);
      }
    });
  }
  return owners;
}

function selectorOwners(selector, lookup, initial = [new Set()]) {
  let paths = [initial];
  for (const node of selector.nodes)
    paths = selectorNodeOwners(paths, node, lookup);
  return paths;
}

function selectorNodeOwners(paths, node, lookup) {
  if (node.type === "combinator") return appendSelectorSegments(paths);
  if (node.type === "class") addSelectorClassOwners(paths, node, lookup);
  if (node.type === "pseudo") return selectorPseudoOwners(paths, node, lookup);
  return paths;
}

function selectorPseudoOwners(paths, node, lookup) {
  // Expand each alternative separately: a same-owner :is branch must not
  // hide a second branch that paints another control. :has/:not don't
  // select their argument as the paint target.
  if (![":is", ":where"].includes(node.value)) return paths;
  return expandSelectorAlternatives(paths, node, lookup);
}

function appendSelectorSegments(paths) {
  return paths.map((path) => [...path, new Set()]);
}

function addSelectorClassOwners(paths, node, lookup) {
  for (const path of paths)
    for (const owner of lookup(node.value)) path.at(-1).add(owner);
}

function expandSelectorAlternatives(paths, node, lookup) {
  return paths.flatMap((path) =>
    node.nodes.flatMap((child) =>
      selectorOwners(
        child,
        lookup,
        path.map((segment) => new Set(segment)),
      ),
    ),
  );
}

/** Parse selectors and declaration values; comments and URL fragments aren't colors. */
export function cssViolations(source, file, owners = new Map()) {
  const errors = [];
  const root = postcss.parse(source, { from: file });
  const names = [...owners.keys()].sort((a, b) => b.length - a.length);
  const lookup = (value) =>
    owners.get(
      names.find((name) => value === name || value.startsWith(`${name}-`)),
    ) ?? [];
  const report = (node, message) =>
    errors.push(`${file}:${node.source.start.line}: ${message}`);
  root.walkDecls((declaration) => {
    valueParser(declaration.value).walk((node) => {
      if (node.type === "function" && node.value === "url") return false;
      if (node.type === "word" && hex.test(node.value))
        report(
          declaration,
          "component CSS colors must use Stipe tokens, not hex literals",
        );
    });
  });
  root.walkRules((rule) => {
    let selectors = selectorParser().astSync(rule.selector);
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type === "rule")
        selectors = resolveNestedSelector(
          selectors,
          selectorParser().astSync(parent.selector),
        );
    }
    selectors.each((selector) => {
      selector.walkAttributes((attribute) => {
        if (attribute.attribute === "data-theme" && attribute.operator)
          report(
            rule,
            "component CSS must not select a theme name; consume its tokens",
          );
      });
      if (
        !rule.nodes.some(
          (node) =>
            node.type === "decl" &&
            node.prop !== "outline-offset" &&
            paint.test(node.prop),
        )
      )
        return;
      for (const segments of selectorOwners(selector, lookup)) {
        const target = segments.at(-1);
        const ancestors = new Set(
          segments.slice(0, -1).flatMap((segment) => [...segment]),
        );
        if (
          target.size &&
          ancestors.size &&
          ![...target].some((owner) => ancestors.has(owner))
        ) {
          report(
            rule,
            `cross-component paint in '${selector.toString().trim()}'; set inherited tokens on the host`,
          );
          break;
        }
      }
    });
  });
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const files = globSync("packages/{caps,vishnu-ui}/src/**/*.{ts,tsx,css}", {
    cwd: repo,
  }).filter((file) => !file.includes(".test."));
  const trees = files
    .filter((file) => !file.endsWith(".css"))
    .map((file) => sourceTree(readFileSync(join(repo, file), "utf8"), file));
  const owners = componentOwners(
    trees.filter((tree) => tree.fileName.startsWith("packages/caps/src/")),
  );
  const errors = trees.flatMap((tree) => sourceViolations(tree));
  for (const file of files.filter((file) => file.endsWith(".css")))
    errors.push(
      ...cssViolations(readFileSync(join(repo, file), "utf8"), file, owners),
    );
  // World-art literals are deliberately outside UI policy. Only theme names
  // in cartridge source are checked here; dynamic declarations use the SDK schema.
  for (const file of globSync("apps/vishnu/cartridges/**/*.ts", {
    cwd: repo,
  })) {
    if (file.includes(".test.")) continue;
    errors.push(
      ...sourceViolations(
        sourceTree(
          readFileSync(join(repo, file), "utf8"),
          relative(repo, join(repo, file)),
        ),
        { cartridge: true },
      ),
    );
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      "Caps/Vishnu UI theme guard and cartridge theme names passed (held engine CSS excluded).",
    );
}
