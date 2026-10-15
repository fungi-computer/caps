import AjvModule from "ajv";

const Ajv = AjvModule.default ?? AjvModule;

const stringArray = {
  type: "array",
  items: { type: "string", minLength: 1 },
};

const sourceFile = {
  type: "object",
  additionalProperties: false,
  required: ["path", "type", "target"],
  properties: {
    path: { type: "string", minLength: 1 },
    type: { type: "string", pattern: "^registry:" },
    target: { type: "string", pattern: "^@[^/]+/.+" },
  },
};

const materializedFile = {
  ...sourceFile,
  required: [...sourceFile.required, "content"],
  properties: {
    ...sourceFile.properties,
    content: { type: "string" },
  },
};

const itemProperties = {
  name: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*$" },
  type: { type: "string", pattern: "^registry:" },
  title: { type: "string", minLength: 1 },
  description: { type: "string", minLength: 1 },
  dependencies: stringArray,
  registryDependencies: stringArray,
  css: {
    type: "object",
    minProperties: 1,
    additionalProperties: { type: "object" },
  },
};

const requiredItemProperties = [
  "name",
  "type",
  "title",
  "description",
  "dependencies",
  "registryDependencies",
  "files",
  "css",
];

const descriptorItem = {
  type: "object",
  additionalProperties: false,
  required: requiredItemProperties,
  properties: {
    ...itemProperties,
    files: { type: "array", minItems: 1, items: sourceFile },
  },
};

const materializedItem = {
  type: "object",
  additionalProperties: false,
  required: ["$schema", ...requiredItemProperties],
  properties: {
    $schema: { const: "https://ui.shadcn.com/schema/registry-item.json" },
    ...itemProperties,
    files: { type: "array", minItems: 1, items: materializedFile },
  },
};

const registry = {
  type: "object",
  additionalProperties: false,
  required: ["$schema", "items"],
  properties: {
    $schema: { const: "https://ui.shadcn.com/schema/registry.json" },
    include: {
      type: "array",
      uniqueItems: true,
      items: {
        type: "string",
        pattern: "^[a-z0-9][a-z0-9-]*\\.json$",
      },
    },
    name: { type: "string", minLength: 1 },
    homepage: { type: "string", minLength: 1 },
    items: { type: "array", items: descriptorItem },
  },
};

const components = {
  type: "object",
  additionalProperties: true,
  required: ["aliases"],
  properties: {
    registries: false,
    aliases: {
      type: "object",
      additionalProperties: false,
      required: ["components", "utils", "ui", "lib", "hooks"],
      properties: Object.fromEntries(
        ["components", "utils", "ui", "lib", "hooks"].map((name) => [
          name,
          { type: "string", minLength: 1 },
        ]),
      ),
    },
  },
};

const ajv = new Ajv({ allErrors: true, strict: true });
const validators = {
  components: ajv.compile(components),
  item: ajv.compile(materializedItem),
  registry: ajv.compile(registry),
};

export function parseJson(bytes, documentKind, label) {
  let value;
  try {
    value = JSON.parse(bytes);
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, { cause: error });
  }
  const validate = validators[documentKind];
  if (!validate(value))
    throw new Error(
      `${label} has an invalid shape: ${ajv.errorsText(validate.errors)}`,
    );
  return value;
}
