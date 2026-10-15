import { globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import console from "node:console";
import ts from "typescript";
import postcss from "postcss";
import valueParser from "postcss-value-parser";

/** Check the maintained TS/CSS syntax trees; authored helper inputs are allowed. */
export function motionViolations(source, file) {
  const errors = [];
  if (file.endsWith(".css")) {
    postcss.parse(source, { from: file }).walkDecls((declaration) => {
      valueParser(declaration.value).walk((node) => {
        if (node.type !== "word") return;
        const unit = valueParser.unit(node.value);
        if (
          unit &&
          (unit.unit === "ms" || unit.unit === "s") &&
          Number(unit.number) !== 0
        )
          errors.push(
            `${file}:${declaration.source?.start?.line ?? 1}: use a Stipe motion token instead of ${node.value}`,
          );
      });
    });
    return errors;
  }
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const helpers = new Set(["themedSpring", "themedEase"]);
  const namespaces = new Set();
  const animations = new Set(["animate"]);
  const report = (node, message) => {
    const { line } = tree.getLineAndCharacterOfPosition(node.getStart(tree));
    errors.push(`${file}:${line + 1}: ${message}`);
  };
  for (const statement of tree.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const specifier of bindings.elements) {
        const imported = (specifier.propertyName ?? specifier.name).text;
        if (
          statement.moduleSpecifier.text.endsWith("motion-spring.js") &&
          helpers.has(imported)
        )
          helpers.add(specifier.name.text);
        if (
          statement.moduleSpecifier.text === "animejs" &&
          imported === "animate"
        )
          animations.add(specifier.name.text);
        if (
          statement.moduleSpecifier.text === "animejs" &&
          imported === "spring"
        )
          report(
            specifier,
            "use themedSpring; only lib/motion-spring.ts owns Anime springs",
          );
      }
    }
    if (
      statement.moduleSpecifier.text === "animejs" &&
      bindings &&
      ts.isNamespaceImport(bindings)
    )
      namespaces.add(bindings.name.text);
  }
  const visit = (node) => {
    if (isNamespaceSpring(node, namespaces))
      report(node, "use themedSpring instead of an Anime spring");
    if (ts.isPropertyAssignment(node) && isRawTiming(node)) {
      const object = node.parent;
      if (
        !isAuthoredTiming(object, helpers) &&
        insideAnimation(object, animations)
      )
        report(
          node,
          `route ${node.name.getText(tree)} through motion tokens or a themed timing helper`,
        );
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return errors;
}

function isNamespaceSpring(node, namespaces) {
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression)
  )
    return false;
  const { expression, name } = node.expression;
  return (
    ts.isIdentifier(expression) &&
    namespaces.has(expression.text) &&
    name.text === "spring"
  );
}

function isRawTiming(node) {
  const name =
    ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)
      ? node.name.text
      : "";
  if (!["duration", "delay", "bounce"].includes(name)) return false;
  const value = ts.isPrefixUnaryExpression(node.initializer)
    ? node.initializer.operand
    : node.initializer;
  return ts.isNumericLiteral(value) && Number(value.text) !== 0;
}

function isAuthoredTiming(object, helpers) {
  const call = object.parent;
  return (
    ts.isCallExpression(call) &&
    ts.isIdentifier(call.expression) &&
    helpers.has(call.expression.text) &&
    call.arguments.includes(object)
  );
}

function insideAnimation(object, animations) {
  for (let parent = object.parent; parent; parent = parent.parent) {
    if (ts.isFunctionLike(parent)) return false;
    if (!ts.isCallExpression(parent)) continue;
    const call = parent.expression;
    if (ts.isIdentifier(call) && animations.has(call.text)) return true;
    if (ts.isPropertyAccessExpression(call) && call.name.text === "animate")
      return true;
  }
  return false;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const owners = new Set(["src/lib/motion.ts", "src/lib/motion-spring.ts"]);
  const errors = [];
  for (const file of globSync("src/**/*.{ts,tsx,css}", { cwd: root })) {
    if (file.includes(".test.") || owners.has(file)) continue;
    errors.push(
      ...motionViolations(readFileSync(join(root, file), "utf8"), file),
    );
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else console.log("Caps motion token guard passed.");
}
