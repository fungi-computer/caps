// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { NavigationRail } from "./navigation-rail.js";

afterEach(cleanup);

describe("NavigationRail", () => {
  it("keeps caller links in a labeled nav and marks the shared scroll surface", () => {
    const { container } = render(
      <NavigationRail aria-label="Team" className="host-rail">
        <a href="/team">Workspace</a>
        <a aria-current="page" href="/team/members">
          Members
        </a>
        <a href="/team/settings">Settings</a>
      </NavigationRail>,
    );
    const nav = requireValue(container.querySelector("nav"), "navigation rail");
    expect(nav.className).toContain("caps-navigation-rail");
    expect(nav.className).toContain("host-rail");
    expect(nav.getAttribute("aria-label")).toBe("Team");
    expect(
      nav.querySelector(".caps-navigation-rail-viewport a[aria-current=page]")
        ?.textContent,
    ).toBe("Members");
  });

  it("can fit a long rail on wide layouts", () => {
    const { container } = render(
      <NavigationRail aria-label="Team" fitAtWide>
        <a href="/team">Workspace</a>
      </NavigationRail>,
    );
    expect(container.querySelector("nav")?.className).toContain(
      "caps-navigation-rail-fit-wide",
    );
  });
});
