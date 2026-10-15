import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppGrid, SectionGrid } from "./launcher-grid.js";

describe("launcher grids", () => {
  it("gives page sections a responsive Caps layout", () => {
    const markup = renderToStaticMarkup(
      <SectionGrid aria-label="Workspace sections">
        <section>Recent</section>
        <section>Apps</section>
      </SectionGrid>,
    );
    expect(markup).toContain('class="caps-section-grid"');
    expect(markup).toContain("Recent");
    expect(markup).toContain("Apps");
  });

  it("renders caller-owned apps as labeled icon buttons", () => {
    const markup = renderToStaticMarkup(
      <AppGrid
        aria-label="Team Apps"
        items={[
          {
            id: "grove",
            label: "Grove",
            icon: <svg aria-hidden="true" />,
            onSelect: () => undefined,
          },
        ]}
      />,
    );
    expect(markup).toContain('aria-label="Team Apps"');
    expect(markup).toContain('aria-label="Grove"');
    expect(markup).toContain('class="caps-app-grid-icon"');
    expect(markup).toContain('class="caps-app-grid-label">Grove</span>');
  });

  it("composes a desktop home with full-width sections and toy keys", () => {
    const markup = renderToStaticMarkup(
      <SectionGrid layout="desktop">
        <AppGrid
          aria-label="Team Apps"
          size="lg"
          items={[
            {
              id: "games",
              label: "Games",
              icon: <svg aria-hidden="true" />,
              onSelect: () => undefined,
            },
          ]}
        />
      </SectionGrid>,
    );
    expect(markup).toContain('data-layout="desktop"');
    expect(markup).toContain('data-size="lg"');
    expect(markup).toContain('aria-label="Games"');
  });
});
