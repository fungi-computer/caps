import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReleaseTag } from "./release-tag.js";

describe("ReleaseTag", () => {
  it("prints a stacked title, an accent strip and a ruled version list", () => {
    const markup = renderToStaticMarkup(
      <ReleaseTag
        aria-label="Fungi beta release"
        entries={[
          { name: "Grove", version: "0.3" },
          { name: "Shed", version: "0.2" },
        ]}
        label="Update"
        title={["Fungi", "Beta"]}
      />,
    );
    expect(markup).toContain(
      '<aside aria-label="Fungi beta release" class="caps-release-tag">',
    );
    expect(markup).toContain(
      '<span aria-hidden="true" class="caps-release-tag-rings">',
    );
    expect(markup).toContain("<span>Fungi</span><span>Beta</span>");
    expect(markup).toContain('<p class="caps-release-tag-label">Update</p>');
    expect(markup).toContain("<dt>Grove</dt><dd>0.3</dd>");
    expect(markup).toContain("<dt>Shed</dt><dd>0.2</dd>");
  });
});
