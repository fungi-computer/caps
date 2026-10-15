import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TradingCard } from "./trading-card.js";

describe("TradingCard", () => {
  it("prints a named 63:88 card whose move body keeps caller-owned form controls", () => {
    const markup = renderToStaticMarkup(
      <TradingCard
        name="Shiitake"
        stage="Spore"
        stat="60 SP"
        typeLine="Mushroom agent"
        art={<span>art</span>}
        move={{
          cost: <span>cost</span>,
          name: "Join the Waitlist",
          children: (
            <form>
              <label htmlFor="email">Your email</label>
              <input id="email" type="email" />
            </form>
          ),
        }}
        flavor="It naps on its own computer."
        facts={[{ label: "Weakness", value: "Clankers ×2" }]}
        setNumber="001/001"
        rarity="★"
        finish="holo"
      />,
    );
    expect(markup).toContain('class="caps-trading-card"');
    expect(markup).toContain('data-finish="holo"');
    expect(markup).toMatch(
      /aria-labelledby="([^"]+)".*<h2 class="caps-trading-card-name" id="\1">Shiitake<\/h2>/s,
    );
    expect(markup).toContain(
      '<span aria-hidden="true" class="caps-trading-card-cost">',
    );
    expect(markup).toContain('<label for="email">Your email</label>');
    expect(markup).toContain("<dt>Weakness</dt><dd>Clankers ×2</dd>");
    expect(markup).toContain("001/001");
  });

  it("omits empty regions", () => {
    const markup = renderToStaticMarkup(
      <TradingCard name="Plain" art={null} move={{ name: "Wave" }} />,
    );
    expect(markup).toContain('data-finish="standard"');
    expect(markup).not.toContain("caps-trading-card-footer");
    expect(markup).not.toContain("caps-trading-card-flavor");
    expect(markup).not.toContain("caps-trading-card-cost");
  });
});
