import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryRoot = resolve(packageRoot, "../..");
const dependencyRepositoryRoot = resolve(
  realpathSync(resolve(packageRoot, "node_modules")),
  "../../..",
);

export default {
  server: {
    hmr: false,
    fs: {
      allow: [repositoryRoot, dependencyRepositoryRoot],
    },
  },
};
