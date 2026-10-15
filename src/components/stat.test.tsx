// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { cleanup, render } from "../test-utils/index.js";
import { Stat } from "./stat.js";

afterEach(cleanup);

describe("Stat", () => {
  it("uses regular density by default", () => {
    const { container } = render(<Stat label="Seats" value="1" />);
    expect(container.querySelector("dl")?.className).toBe("stats");
  });

  it("marks compact statistics for reduced padding", () => {
    const { container } = render(
      <Stat density="compact" label="Seats" value="1" />,
    );
    expect(container.querySelector("dl")?.className).toContain(
      "caps-stat-compact",
    );
  });
});
