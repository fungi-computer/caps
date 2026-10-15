import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PriceTag } from "./price-tag.js";
import { StoreCard } from "./store-card.js";

describe("store molecules", () => {
  it("shows catalogue copy and a free price through Caps components", () => {
    const markup = renderToStaticMarkup(
      <StoreCard
        title="Mosslight"
        tagline="A quiet world"
        price={{ kind: "free" }}
      />,
    );
    expect(markup).toContain("Mosslight");
    expect(markup).toContain("A quiet world");
    expect(markup).toContain("Free");
    expect(
      renderToStaticMarkup(
        <PriceTag price={{ kind: "one-time", label: "$3" }} />,
      ),
    ).toContain("$3");
  });
});

it("keeps acquisition independent of opening the listing", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let selected = 0;
  let acquired = 0;
  act(() => {
    root.render(
      <StoreCard
        title="Orchard"
        tagline="A tiny garden"
        onSelect={() => {
          selected += 1;
        }}
        action={
          <button
            onClick={() => {
              acquired += 1;
            }}
          >
            Install
          </button>
        }
      />,
    );
  });
  const buttons = host.querySelectorAll("button");
  expect(buttons).toHaveLength(2);
  expect(buttons[0]?.contains(buttons[1] ?? null)).toBe(false);
  act(() => buttons[1]?.click());
  expect(acquired).toBe(1);
  expect(selected).toBe(0);
  act(() => buttons[0]?.click());
  expect(selected).toBe(1);
  act(() => {
    root.unmount();
  });
  host.remove();
});

it("uses a native link for a cartridge and renders its cover and seller slots", () => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    <StoreCard
      title="Clearing"
      tagline="A little world"
      variant="cartridge"
      href="/play"
      cover={<img src="/cover.png" alt="A mossy clearing" />}
      seller={<a href="/source">Source</a>}
    />,
  );
  expect(host.querySelector(".caps-store-open")?.getAttribute("href")).toBe(
    "/play",
  );
  expect(host.querySelector("a a")).toBeNull();
  expect(host.querySelector("img")?.alt).toBe("A mossy clearing");
  expect(host.querySelector("footer a")?.getAttribute("href")).toBe("/source");
});
