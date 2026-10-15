import { execFileSync } from "node:child_process";
import console from "node:console";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import process from "node:process";
import postcss from "postcss";
import postcssJs from "postcss-js";

import { parseJson } from "./registry-schema.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = await mkdtemp(join(tmpdir(), "caps-registry-stranger-"));
const stipeCssImport = '@import "@fungi.computer/stipe/styles.css"';
const pluginReactEntry = fileURLToPath(
  import.meta.resolve("@vitejs/plugin-react"),
);
const viteRoot = resolve(dirname(pluginReactEntry), "../../..");
const viteCli = resolve(viteRoot, "vite/bin/vite.js");
const viteConfigApi = pathToFileURL(
  resolve(viteRoot, "vite/dist/node/index.js"),
).href;
const inside = (parent, child) => {
  const path = relative(parent, child);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`));
};

try {
  const generated = (await readdir(resolve(packageRoot, "registry")))
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length))
    .sort();
  // A consumer installs into its own Shadcn aliases, independent of Caps' source tree.
  const aliases = {
    components: "@/components",
    utils: "@/lib/cn",
    ui: "@/components/ui",
    lib: "@/lib",
    hooks: "@/hooks",
  };
  const generatedRoot = parseJson(
    await readFile(resolve(packageRoot, "registry.json"), "utf8"),
    "registry",
    "Generated Caps registry root",
  );
  if (generatedRoot.include || generatedRoot.name !== "fungi-computer-caps")
    throw new Error(
      "Generated Caps registry root must be flattened and current",
    );
  const installedCss = [];
  const targetPath = (target) => {
    const match = /^(?:@([^/]+))\/(.+)$/.exec(target);
    if (!match)
      throw new Error(`Stranger target must use a registry alias: ${target}`);
    const [, alias, suffix] = match;
    const configured = aliases[alias];
    if (!configured)
      throw new Error(`Stranger target uses unknown alias: ${alias}`);
    const prefix = configured.startsWith("@/")
      ? configured.slice(2)
      : configured;
    const destination = resolve(fixture, prefix, suffix);
    if (!inside(fixture, destination))
      throw new Error(`Stranger target escapes its local fixture: ${target}`);
    return destination;
  };

  if (generated.length !== generatedRoot.items.length)
    throw new Error(
      `Local materialization requires ${generatedRoot.items.length} payloads; found ${generated.length}`,
    );
  for (const item of generatedRoot.items) {
    if (!generated.includes(item.name))
      throw new Error(`Generated root item is missing a payload: ${item.name}`);
  }

  for (const name of generated) {
    const item = parseJson(
      await readFile(resolve(packageRoot, "registry", `${name}.json`), "utf8"),
      "item",
      `Generated Caps registry item ${name}`,
    );
    if (!item.css?.[stipeCssImport])
      throw new Error(`${name} is missing the standard Stipe CSS import`);
    const css = postcssJs.parse(item.css);
    css.walkAtRules("import", (rule) => {
      if (rule.params === '"@fungi.computer/stipe/styles.css"') rule.remove();
    });
    installedCss.push(css);
    for (const file of item.files) {
      if (!file.target) throw new Error(`${name} has an untargeted file`);
      const destination = targetPath(file.target);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, file.content);
    }
  }

  const installedStyles = [
    `${stipeCssImport};`,
    ...installedCss.map((style) => style.toString()),
  ].join("\n");
  await writeFile(resolve(fixture, "styles.css"), installedStyles);
  if (!installedStyles.includes(stipeCssImport))
    throw new Error(
      "stranger styles do not include the standard Stipe CSS import",
    );
  await symlink(
    resolve(packageRoot, "node_modules"),
    resolve(fixture, "node_modules"),
  );
  await writeFile(
    resolve(fixture, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          baseUrl: ".",
          jsx: "react-jsx",
          module: "ESNext",
          moduleResolution: "bundler",
          noEmit: true,
          paths: { "@/*": ["./*"] },
          strict: true,
          target: "ES2022",
        },
        include: ["entry.tsx", "components/**/*.tsx", "lib/**/*.ts"],
      },
      null,
      2,
    ),
  );
  await writeFile(
    resolve(fixture, "entry.tsx"),
    `import "./compiled.css";
import { AppBar } from "@/components/blocks/app-bar";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "@/components/blocks/command-menu";
import { Composer } from "@/components/blocks/composer";
import { Mosaic } from "@/components/blocks/mosaic";
import { ResourceSelect } from "@/components/blocks/resource-select";
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { IconCheckbox } from "@/components/ui/icon-checkbox";
import { IconRadio } from "@/components/ui/icon-radio";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Status } from "@/components/ui/status";
import { EmptyState } from "@/components/blocks/empty-state";
import { DataList, DataRow } from "@/components/ui/data-list";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Listbox } from "@/components/ui/listbox";
import { QuotaMeter } from "@/components/ui/quota-meter";
import { Stat } from "@/components/ui/stat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

export function StrangerProof() {
  const [value, setValue] = useState<string | null>(null);
  return <main>
    <AppBar windows={[]} launchers={[]} launcher={{ label: "Launch" }} />
    <Button>Save</Button>
    <Checkbox aria-label="Accepted" />
    <IconCheckbox label="Read files" icon={<svg />} caption="READ" name="read" />
    <Switch aria-label="Enabled" />
    <RadioGroup defaultValue="one"><RadioGroupItem value="one" aria-label="One" /><IconRadio value="two" label="Two" icon={<svg />} /></RadioGroup>
    <Progress value={35} max={100} />
    <Status glyph="pill" label="Working" />
    <EmptyState title="Nothing here" description="Try a suggestion." renderVisual={({ thinking }) => <span>{thinking ? "Thinking" : "Ready"}</span>} />
    <Composer input={<input className="join-item" />} action={<button className="join-item" type="button">Send</button>} />
    <Mosaic label="Files" items={[{ id: "one", alt: "One" }]} />
    <CommandMenu items={[{ id: "one", label: "One" }]} onSelect={() => undefined} />
    <ResourceSelect options={[{ id: "one", label: "One" }]} onSelect={() => undefined} />
    <IconButton aria-label="Close" icon="×" />
    <Stat label="Balance" value="$42" description="Available" />
    <QuotaMeter label="Storage" value={35} max={100} tone="warning" />
    <DataList><DataRow>Recent transaction</DataRow></DataList>
    <Combobox value={value} onValueChange={setValue} items={[{ id: "one", label: "One" }]} getKey={(item) => item.id} getLabel={(item) => item.label} />
    <Listbox items={[{ id: "one", label: "One" }]} getKey={(item) => item.id} getLabel={(item) => item.label} />
    <Tabs defaultValue="one"><TabsList><TabsTrigger value="one">One</TabsTrigger></TabsList><TabsContent value="one">One</TabsContent></Tabs>
    <DropdownMenu><DropdownMenuTrigger>Actions</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => undefined}>Save</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    <Tooltip><TooltipTrigger asChild><button type="button">Help</button></TooltipTrigger><TooltipContent>Help</TooltipContent></Tooltip>
  </main>;
}
`,
  );
  await writeFile(
    resolve(fixture, "vite.config.mjs"),
    `import { defineConfig } from ${JSON.stringify(viteConfigApi)};
import react from ${JSON.stringify(import.meta.resolve("@vitejs/plugin-react"))};
export default defineConfig({ plugins: [react()], resolve: { alias: { "@": ${JSON.stringify(fixture)} } }, build: { outDir: ${JSON.stringify(resolve(fixture, "dist"))}, emptyOutDir: true, rollupOptions: { input: ${JSON.stringify(resolve(fixture, "entry.tsx"))} } } });
`,
  );
  execFileSync(
    resolve(packageRoot, "node_modules/.bin/tsc"),
    ["--noEmit", "-p", resolve(fixture, "tsconfig.json")],
    { stdio: "inherit" },
  );
  execFileSync(
    resolve(packageRoot, "node_modules/.bin/tailwindcss"),
    [
      "-i",
      resolve(fixture, "styles.css"),
      "-o",
      resolve(fixture, "compiled.css"),
    ],
    { cwd: fixture, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [viteCli, "build", "--config", resolve(fixture, "vite.config.mjs")],
    { stdio: "inherit" },
  );
  const assets = resolve(fixture, "dist/assets");
  const emittedStyles = (
    await Promise.all(
      (await readdir(assets))
        .filter((name) => name.endsWith(".css"))
        .map((name) => readFile(resolve(assets, name), "utf8")),
    )
  ).join("\n");
  const emittedCss = postcss.parse(emittedStyles);
  for (const selector of [
    ".caps-status",
    ".caps-checkbox",
    ".caps-switch",
    ".caps-radio",
    ".caps-gooey-progress",
  ]) {
    let found = false;
    emittedCss.walkRules((rule) => {
      if (rule.selector.includes(selector)) found = true;
    });
    if (!found) throw new Error(`stranger build is missing ${selector} CSS`);
  }
  let reducedMotion = false;
  emittedCss.walkAtRules("media", (rule) => {
    if (
      rule.params.includes("prefers-reduced-motion") &&
      rule.toString().includes("caps-gooey-motion")
    )
      reducedMotion = true;
  });
  if (!reducedMotion)
    throw new Error("stranger build is missing Caps reduced-motion CSS");
  console.info("local registry materialization and build proof passed");
} finally {
  await rm(fixture, { force: true, recursive: true });
}
