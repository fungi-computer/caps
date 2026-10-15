// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "../components/button.js";
import { cleanup, render } from "../test-utils/index.js";
import {
  SpecDiagram,
  SpecFacts,
  SpecFaq,
  SpecFrame,
  SpecPrintFilter,
  SpecRuler,
  SpecSteps,
} from "./spec-sheet.js";

afterEach(cleanup);

describe("spec sheet", () => {
  it("keeps the ruler decorative", () => {
    const { container } = render(<SpecRuler label="01 · Plans" />);
    const ruler = container.querySelector(".caps-spec-ruler");
    expect(ruler?.getAttribute("aria-hidden")).toBe("true");
    expect(ruler?.textContent).toBe("01 · Plans");
  });

  it("seats caller media in a figure with an optional caption", () => {
    const { container } = render(
      <SpecFrame caption="Fig. 01" surface="inverse">
        <img alt="A bench" src="/bench.png" />
      </SpecFrame>,
    );
    const figure = container.querySelector("figure.caps-spec-frame");
    expect(figure?.getAttribute("data-surface")).toBe("inverse");
    expect(figure?.querySelector("img")?.getAttribute("alt")).toBe("A bench");
    expect(figure?.querySelector("figcaption")?.textContent).toBe("Fig. 01");

    cleanup();
    const bare = render(
      <SpecFrame>
        <img alt="" src="/x.png" />
      </SpecFrame>,
    );
    expect(bare.container.querySelector("figcaption")).toBeNull();
  });

  it("lists facts as terms and values", () => {
    const { container } = render(
      <SpecFacts
        facts={[
          { id: "years", label: "shipping web software", value: "10 yrs" },
          { id: "commits", label: "commits in 2025", value: "1,384" },
        ]}
      />,
    );
    const terms = [...container.querySelectorAll("dt")].map(
      (term) => term.textContent,
    );
    const values = [...container.querySelectorAll("dd")].map(
      (value) => value.textContent,
    );
    expect(terms).toEqual(["shipping web software", "commits in 2025"]);
    expect(values).toEqual(["10 yrs", "1,384"]);
  });

  it("numbers steps in order with real headings", () => {
    const { container } = render(
      <SpecSteps
        steps={[
          { body: "Pay first.", id: "pay", title: "Subscribe" },
          { body: "Send it.", id: "send", title: "Request" },
        ]}
      />,
    );
    expect(
      [...container.querySelectorAll(".caps-spec-step-number")].map(
        (n) => n.textContent,
      ),
    ).toEqual(["01", "02"]);
    expect(
      [...container.querySelectorAll("h3")].map((h) => h.textContent),
    ).toEqual(["Subscribe", "Request"]);
  });

  it("renders every answer as a native disclosure", () => {
    const { container } = render(
      <SpecFaq
        defaultOpen={["b"]}
        items={[
          { answer: <p>First answer.</p>, id: "a", question: "First?" },
          { answer: <p>Second answer.</p>, id: "b", question: "Second?" },
        ]}
      />,
    );
    const items = [...container.querySelectorAll("details")];
    expect(items).toHaveLength(2);
    expect(items[0]?.open).toBe(false);
    expect(items[1]?.open).toBe(true);
    expect(items[0]?.querySelector("summary")?.textContent).toContain("First?");
    expect(items[0]?.textContent).toContain("First answer.");
  });

  it("tags diagram parts and names them in a legend", () => {
    const { container } = render(
      <SpecDiagram
        art={<img alt="A bench" src="/bench.png" />}
        markers={[
          {
            id: "a",
            label: "Requests",
            note: "Queued",
            tag: "A",
            x: 20,
            y: 40,
          },
          { id: "b", label: "Build", tag: "B", x: 140, y: -5 },
        ]}
      />,
    );
    const tags = [
      ...container.querySelectorAll<HTMLElement>(".caps-spec-diagram-tag"),
    ];
    expect(tags.map((tag) => tag.getAttribute("aria-hidden"))).toEqual([
      "true",
      "true",
    ]);
    expect(tags[1]?.style.left).toBe("100%");
    expect(tags[1]?.style.top).toBe("0%");
    const legend = container.querySelector("figcaption");
    expect(legend?.textContent).toContain("Requests");
    expect(legend?.textContent).toContain("Queued");
    expect(container.querySelectorAll(".caps-spec-diagram-note")).toHaveLength(
      1,
    );
  });

  it("gives Button chamfered ends without changing its variant", () => {
    const { container } = render(
      <Button data-theme="chamfer" variant="outline">
        See the plans
      </Button>,
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("data-theme")).toBe("chamfer");
    expect(button?.className).toContain("btn-outline");

    cleanup();
    const plain = render(<Button>Save</Button>);
    expect(
      plain.container.querySelector("button")?.getAttribute("data-theme"),
    ).toBeNull();
  });

  it("renders one hidden two-ink print filter the theme can point at", () => {
    const { container } = render(<SpecPrintFilter offset={{ x: 3, y: 2 }} />);
    const svg = container.querySelector("svg.caps-print-filter");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.querySelector("filter")?.id).toBe("caps-print");
    const shift = svg?.querySelector("feOffset");
    expect(shift?.getAttribute("dx")).toBe("3");
    expect(shift?.getAttribute("dy")).toBe("2");
    expect(svg?.querySelector(".caps-print-filter-ink")).toBeTruthy();
    expect(svg?.querySelector(".caps-print-filter-offset")).toBeTruthy();
  });
});
