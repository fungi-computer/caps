// @vitest-environment jsdom
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, render, requireValue } from "../test-utils/index.js";
import { PricingCard } from "./pricing-card.js";
import { SectionCard } from "./section-card.js";

afterEach(cleanup);

describe("account blocks", () => {
  it("composes SectionCard content and preserves native props and ref", () => {
    const ref = createRef<HTMLDivElement>();
    const actions = <button type="button">Save</button>;
    const view = render(
      <SectionCard
        actions={actions}
        className="host-card"
        data-owner="settings"
        description="Supporting copy"
        heading="Account"
        ref={ref}
      >
        <input aria-label="Email" />
      </SectionCard>,
    );

    const card = requireValue(
      view.container.querySelector<HTMLDivElement>(".host-card"),
      "SectionCard root",
    );
    expect(ref.current).toBe(card);
    expect(card.dataset.owner).toBe("settings");
    expect(card.className).toContain("host-card");
    expect(view.queryByText("Account")?.tagName).toBe("H3");
    expect(view.queryByText("Supporting copy")?.tagName).toBe("P");
    expect(
      view.container.querySelector('input[aria-label="Email"]'),
    ).not.toBeNull();
    expect(view.container.querySelector("button")?.textContent).toBe("Save");
    expect(
      view.container.querySelector(".caps-section-card-heading-row button")
        ?.textContent,
    ).toBe("Save");
  });

  it("lets the host set SectionCard's heading level for its outline", () => {
    const view = render(
      <SectionCard heading="Profile" headingLevel={2}>
        <p>Body</p>
      </SectionCard>,
    );
    expect(view.queryByText("Profile")?.tagName).toBe("H2");
    expect(
      view.queryByText("Profile")?.classList.contains("caps-card-title"),
    ).toBe(true);
  });

  it("renders PricingCard slots as supplied without inventing action behavior", () => {
    const onClick = vi.fn();
    const view = render(
      <PricingCard
        action={
          <button onClick={onClick} type="button">
            Choose
          </button>
        }
        features={
          <ul aria-label="Features">
            <li>One seat</li>
          </ul>
        }
        plan={{
          description: "For small teams",
          interval: "/ month",
          name: "Starter",
          price: "$10",
        }}
        status={<span role="status">Available</span>}
      />,
    );

    expect(view.queryByText("Starter")?.tagName).toBe("H3");
    expect(view.queryByText("$10")).not.toBeNull();
    expect(view.queryByText("/ month")).not.toBeNull();
    expect(view.container.querySelector('[role="status"]')?.textContent).toBe(
      "Available",
    );
    expect(view.container.querySelector("ul")?.getAttribute("aria-label")).toBe(
      "Features",
    );
    const action = requireValue(
      view.container.querySelector<HTMLButtonElement>("button"),
      "PricingCard action",
    );
    expect(action.type).toBe("button");
    expect(onClick).not.toHaveBeenCalled();
  });
  it("renders the spec variant with art, a band title and a featured mark", () => {
    const view = render(
      <PricingCard
        action={<a href="/pay">Subscribe</a>}
        art={<img alt="A workshop" src="data:," />}
        featured
        features={
          <ul>
            <li>One request</li>
          </ul>
        }
        plan={{
          description: "Steady",
          interval: "/month",
          name: "Standard",
          price: "$6,500",
        }}
        status={<span>Most room</span>}
        layout="banded"
      />,
    );
    const card = requireValue(view.queryBySelector(".caps-card"), "card");
    expect(card.className).toContain("caps-pricing-card-banded");
    expect(card.dataset.featured).toBe("true");
    expect(
      view.queryBySelector(".caps-pricing-card-band h3")?.textContent,
    ).toBe("Standard");
    expect(view.queryBySelector("figure img")?.getAttribute("alt")).toBe(
      "A workshop",
    );
    expect(view.queryBySelector(".caps-pricing-card-price")?.textContent).toBe(
      "$6,500/month",
    );
    expect(view.queryBySelector("a")?.getAttribute("href")).toBe("/pay");
  });
});
