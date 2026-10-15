import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Card, CardHeader, CenteredCard } from "./card.js";
describe("Card", () => {
  it("can keep its content height when placed in a stretching grid", () => {
    const markup = renderToStaticMarkup(
      <Card variant="fit" aria-label="Backups">
        Backup history
      </Card>,
    );
    expect(markup).toContain("caps-card-fit");
    expect(markup).toContain('aria-label="Backups"');
    expect(markup).toContain("Backup history");
  });
});

describe("CenteredCard", () => {
  it("centers one Caps card while preserving the selected surface variant", () => {
    const markup = renderToStaticMarkup(
      <CenteredCard variant="surface" width="wide" aria-label="Sign in">
        <CardHeader alignment="center">Welcome</CardHeader>
      </CenteredCard>,
    );
    expect(markup).toContain('class="caps-centered-card-stage"');
    expect(markup).toContain(
      "caps-card caps-card-surface caps-centered-card caps-centered-card-wide",
    );
    expect(markup).toContain('aria-label="Sign in"');
    expect(markup).toContain("caps-card-header-centered");
    expect(markup).toContain("Welcome");
  });
});

describe("Card density", () => {
  it("opts into compact spacing without changing the selected surface", () => {
    const markup = renderToStaticMarkup(
      <Card density="compact" variant="outline">
        Details
      </Card>,
    );
    expect(markup).toContain("caps-card caps-card-outline caps-card-compact");
  });
});
