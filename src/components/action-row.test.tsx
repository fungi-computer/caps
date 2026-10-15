import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionRow } from "./action-row.js";

describe("ActionRow", () => {
  it("renders the default label and description as a ghost action", () => {
    const markup = renderToStaticMarkup(
      <ActionRow label="Open session" description="Garden agent" />,
    );
    expect(markup).toContain("Open session");
    expect(markup).toContain("Garden agent");
    expect(markup).toContain("btn-ghost");
    expect(markup).toContain("btn-lg");
  });

  it("renders compact actions with a leading mark and trailing state", () => {
    const markup = renderToStaticMarkup(
      <ActionRow
        density="compact"
        icon={<svg aria-hidden="true" />}
        label="Inkcap"
        trailing={<span>Ready</span>}
        variant="outline"
      />,
    );
    expect(markup).toContain("Inkcap");
    expect(markup).toContain("Ready");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("btn-outline");
    expect(markup).toContain("btn-md");
    expect(markup).toContain("min-h-10");
    expect(markup).toContain("caps-action-row-trailing");
    expect(markup).toContain("caps-action-row-copy");
    expect(markup).toContain("caps-action-row");
  });

  it("gives a character-sized mark more room than an icon", () => {
    const mark = <span data-mark="head" />;
    const roomy = renderToStaticMarkup(
      <ActionRow
        density="compact"
        icon={mark}
        iconSize="lg"
        label="Gardener"
      />,
    );
    const plain = renderToStaticMarkup(
      <ActionRow density="compact" icon={mark} label="Gardener" />,
    );
    expect(roomy).toContain("size-8");
    expect(plain).toContain("size-7");
    expect(plain).not.toContain("size-8");
  });
});
