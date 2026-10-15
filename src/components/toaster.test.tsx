// @vitest-environment node
import { readFileSync } from "node:fs";
import { parse } from "postcss";
import { expect, it } from "vitest";

it("ranks body-portaled notices above dialogs with the Stipe toast layer", () => {
  const stylesheet = parse(
    readFileSync(new URL("../styles.css", import.meta.url), "utf8"),
  );
  let rank: string | undefined;
  stylesheet.walkRules(".caps-toaster[data-sonner-toaster]", (rule) => {
    rule.walkDecls("z-index", (declaration) => {
      rank = declaration.value;
    });
  });
  expect(rank).toBe("var(--stipe-layer-toast)");
});
