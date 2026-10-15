import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { InlineCode } from "./inline-code.js";

describe("InlineCode", () => {
  it("keeps caller semantics and classes on a quiet code value", () => {
    const markup = renderToStaticMarkup(
      <InlineCode aria-label="Member ID" className="host-code">
        member_123
      </InlineCode>,
    );
    expect(markup).toContain('class="caps-inline-code host-code"');
    expect(markup).toContain('aria-label="Member ID"');
    expect(markup).toContain("member_123");
  });
});
