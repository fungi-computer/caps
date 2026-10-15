import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const publicModules = [
  "form",
  "blocks/async-state",
  "blocks/command-menu",
  "blocks/composer",
  "blocks/empty-state",
  "blocks/faq-chat",
  "blocks/spec-sheet",
  "blocks/mosaic",
  "blocks/pricing-card",
  "blocks/resource-select",
  "blocks/result-state",
  "blocks/section-card",
  "blocks/upload-queue",
  "blocks/permission-grid",
  "components/alert",
  "components/badge",
  "components/button",
  "components/card",
  "components/checkbox",
  "components/combobox",
  "components/count-badge",
  "components/data-list",
  "components/dialog",
  "components/dropdown-menu",
  "components/field",
  "components/icon-button",
  "components/input",
  "components/input-group",
  "components/label",
  "components/listbox",
  "components/progress",
  "components/prose",
  "components/quota-meter",
  "components/radio-group",
  "components/select",
  "components/separator",
  "components/slider",
  "components/skeleton",
  "components/loader",
  "components/stat",
  "components/status",
  "components/switch",
  "components/tabs",
  "components/textarea",
  "components/tooltip",
  "components/visually-hidden",
  "lib/cn",
];

const modules = await Promise.all(
  publicModules.map((subpath) => import(`@fungi.computer/caps/${subpath}`)),
);

if (modules.some((module) => Object.keys(module).length === 0)) {
  throw new Error("A Caps public module exposed no runtime value");
}

const styles = await readFile(
  new URL(import.meta.resolve("@fungi.computer/caps/styles.css")),
  "utf8",
);

if (styles.trim().length === 0) {
  throw new Error("The Caps public style subpath did not resolve to built CSS");
}

const { fieldError, effectValidator } =
  await import("@fungi.computer/caps/form");
const { Schema } = await import("effect");
const result = await effectValidator(Schema.NumberFromString)[
  "~standard"
].validate("42");
if (
  result.value !== 42 ||
  fieldError({ errors: [{ message: "Required" }] }) !== "Required"
) {
  throw new Error("The packed form adapter lost decoding or error text");
}
