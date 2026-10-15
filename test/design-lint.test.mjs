import assert from "node:assert/strict";
import { fileURLToPath, URL } from "node:url";
import { test } from "node:test";
import { ESLint } from "eslint";
import stylelint from "stylelint";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const eslint = new ESLint({ cwd: root });
const filePath = fileURLToPath(
  new URL("../workbench/overview.stories.tsx", import.meta.url),
);
const cssConfig = fileURLToPath(
  new URL("../stylelint.config.mjs", import.meta.url),
);

async function designMessages(source) {
  const [result] = await eslint.lintText(source, { filePath });
  assert.equal(result.fatalErrorCount, 0);
  return result.messages.filter(
    ({ ruleId }) =>
      ruleId?.startsWith("shadcn/") || ruleId === "no-restricted-syntax",
  );
}

test("spacing uses named tokens, including responsive and negative utilities", async () => {
  for (const classes of [
    "m-sm p-sm gap-md",
    "md:mx-2xl -mt-xs p-0",
    "gap-2xs",
    "w-12 h-8",
  ]) {
    assert.deepEqual(
      await designMessages(
        `export const Probe = () => <div className="${classes}" />;`,
      ),
      [],
      classes,
    );
  }
  for (const classes of [
    "p-4",
    "md:px-2",
    "-mt-1.5",
    "gap-0.5",
    "p-[12px]",
    "space-y-3",
    "p-4!",
    "md:!p-4",
  ]) {
    const messages = await designMessages(
      `export const Probe = () => <div className="${classes}" />;`,
    );
    assert(
      messages.some(({ ruleId }) => ruleId === "no-restricted-syntax"),
      classes,
    );
  }
  assert(
    (
      await designMessages(
        "export const Probe = () => <div className={`p-4`} />;",
      )
    ).some(({ ruleId }) => ruleId === "no-restricted-syntax"),
  );
});

test("stories cannot repaint controls or hide their class names", async () => {
  assert(
    (
      await designMessages(
        'export const Probe = () => <div className="bg-red-500" />;',
      )
    ).some(({ ruleId }) => ruleId === "shadcn/no-raw-colors"),
  );
  assert(
    (
      await designMessages(
        'export const Probe = () => <div className="rounded-[12px]" />;',
      )
    ).some(({ ruleId }) => ruleId === "shadcn/no-arbitrary-values"),
  );
  const button =
    'import { Button } from "@fungi.computer/caps/components/button";';
  assert.deepEqual(
    await designMessages(
      `${button} export const Probe = () => <Button className="mt-sm" />;`,
    ),
    [],
  );
  for (const classes of ["bg-red-500", "p-sm", "rounded-[12px]"]) {
    assert(
      (
        await designMessages(
          `${button} export const Probe = () => <Button className="${classes}" />;`,
        )
      ).some(({ ruleId }) => ruleId === "shadcn/no-restyle"),
      classes,
    );
  }
  assert(
    (
      await designMessages(
        `${button} export const Probe = ({ classes }: { classes: string }) => <Button className={classes} />;`,
      )
    ).some(({ ruleId }) => ruleId === "shadcn/require-static-classes"),
  );
  assert(
    (
      await designMessages(
        'export const Probe = () => <div style={{ color: "red" }} />;',
      )
    ).some(({ ruleId }) => ruleId === "shadcn/no-inline-styles"),
  );
});

test("CSS cannot bypass theme spacing and radii", async () => {
  for (const declaration of [
    "padding: var(--spacing-sm)",
    "margin: 0 auto",
    "gap: var(--spacing-2xs)",
    "border-radius: var(--radius-field)",
    "box-shadow: inset 0 1px 0 white",
  ]) {
    const result = await stylelint.lint({
      code: `.probe { ${declaration}; }`,
      configFile: cssConfig,
    });
    assert.equal(result.errored, false, declaration);
  }
  for (const declaration of [
    "padding: 12px",
    "gap: .5rem",
    "margin: 2%",
    "border-radius: 6px",
    "--radius-field: .75rem",
    "color: #ff0000",
  ]) {
    const result = await stylelint.lint({
      code: `.probe { ${declaration}; }`,
      configFile: cssConfig,
    });
    assert.equal(result.errored, true, declaration);
  }
});

test("a screen restyles its controls through tokens, never by ancestry", async () => {
  const { readFile } = await import("node:fs/promises");
  const css = await readFile(
    fileURLToPath(new URL("../src/styles.css", import.meta.url)),
    "utf8",
  );
  // Match Screen itself, not ScreenCell styling its own parts.
  // No rule may reach from the screen into another Caps component.
  const reach = [
    ...css.matchAll(/\.caps-screen(?![\w-])[^{,]*?[\s>+~]+\.caps-[\w-]+/gu),
  ]
    .map(([selector]) => selector)
    .filter((selector) => !selector.startsWith(".caps-screen {"));
  assert.deepEqual(reach, []);
  // The context itself is the token set that controls read.
  const context = /\n {2}\.caps-screen \{([^}]*)\}/u.exec(css)?.[1] ?? "";
  for (const token of [
    "--caps-control-depth",
    "--caps-control-ink",
    "--caps-control-dim",
    "--caps-control-line",
    "--caps-control-label-font",
    "--caps-control-range-mask",
  ]) {
    assert.match(context, new RegExp(`${token}:`, "u"), token);
  }
});
