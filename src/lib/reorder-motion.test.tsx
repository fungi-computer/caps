import { act, useRef, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { reorderKeyAttribute, useListMotion } from "./reorder-motion.js";

// SAFETY: React reads this flag to enable act() outside a test renderer.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const rowHeight = 40;

function List({
  order,
  motion,
  mounted = order,
}: {
  order: readonly string[];
  motion: string;
  mounted?: readonly string[];
}) {
  const container = useRef<HTMLUListElement>(null);
  useListMotion(container, order);
  // SAFETY: React accepts custom properties in inline style objects.
  const style = { "--stipe-motion-slow": motion } as CSSProperties;
  return (
    <ul ref={container} style={style}>
      {mounted.map((key) => (
        <li key={key} {...{ [reorderKeyAttribute]: key }}>
          {key}
        </li>
      ))}
    </ul>
  );
}

type AnimateCall = {
  row: string;
  from: Keyframe | undefined;
  delay: number | undefined;
};
let animationOffset = 0;
let calls: AnimateCall[] = [];
let finishes: (() => void)[] = [];

beforeEach(() => {
  animationOffset = 0;
  calls = [];
  finishes = [];
  // jsdom has no layout: place each row by its current index.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      if (this.tagName !== "LI")
        return new DOMRect(0, 0, 200, 400 + animationOffset);
      const index = Array.from(this.parentElement?.children ?? []).indexOf(
        this,
      );
      return new DOMRect(
        0,
        index * rowHeight + animationOffset,
        200,
        rowHeight,
      );
    },
  );
  Element.prototype.animate = function (this: Element, frames, options) {
    const key = this.getAttribute(reorderKeyAttribute);
    calls.push({
      // A leaving row is a keyless copy of its last look.
      row: key ?? `leaving ${this.textContent}`,
      from: Array.isArray(frames) ? frames[0] : undefined,
      delay: options instanceof Object ? options.delay : undefined,
    });
    const animation = new EventTarget();
    finishes.push(() => {
      animation.dispatchEvent(new Event("finish"));
    });
    // SAFETY: the hook only listens for the end of a leaving row.
    return animation as Animation;
  };
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function renderList(motion: string) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  return {
    host,
    render: (order: readonly string[], mounted = order) => {
      act(() => {
        root.render(<List order={order} mounted={mounted} motion={motion} />);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

test("glides each moved row from its previous position", () => {
  const list = renderList("280ms");
  list.render(["a", "b", "c"]);
  // The first layout is only a baseline.
  expect(calls).toEqual([]);

  list.render(["c", "a", "b"]);
  expect(calls.map(({ row, from }) => ({ row, from }))).toEqual([
    {
      row: "c",
      from: { transform: `translate(0px, ${String(2 * rowHeight)}px)` },
    },
    {
      row: "a",
      from: { transform: `translate(0px, ${String(-rowHeight)}px)` },
    },
    {
      row: "b",
      from: { transform: `translate(0px, ${String(-rowHeight)}px)` },
    },
  ]);

  calls = [];
  list.render(["c", "a", "b"]);
  expect(calls).toEqual([]);
  list.unmount();
});

test("arriving rows fade in over the theme's travel, one after another", () => {
  const list = renderList("280ms");
  list.render(["a"]);
  list.render(["a", "b", "c"]);
  expect(calls).toEqual([
    {
      row: "b",
      from: { opacity: 0, transform: "translateY(4px)" },
      delay: 0,
    },
    {
      row: "c",
      from: { opacity: 0, transform: "translateY(4px)" },
      delay: 24,
    },
  ]);
  list.unmount();
});

test("a leaving row fades where it stood, then its copy is removed", () => {
  const list = renderList("280ms");
  list.render(["a", "b", "c"]);
  list.render(["a", "c"]);
  expect(calls.map(({ row }) => row)).toEqual(["c", "leaving b"]);
  const ghost = list.host.querySelector("li[aria-hidden='true']");
  expect(ghost?.textContent).toBe("b");
  expect(ghost?.hasAttribute(reorderKeyAttribute)).toBe(false);
  for (const finish of finishes) finish();
  expect(list.host.querySelector("li[aria-hidden='true']")).toBeNull();
  list.unmount();
});

test("does not glide when the theme's slow token is 0ms", () => {
  const list = renderList("0ms");
  list.render(["a", "b"]);
  list.render(["b", "a"]);
  expect(calls).toEqual([]);
  list.unmount();
});

test("scrolling refreshes the mounted baseline before the next reorder", () => {
  const list = renderList("280ms");
  const order = ["a", "b", "c", "d"];
  list.render(order, ["a", "b"]);
  list.render(order, ["c", "d"]);
  expect(calls).toEqual([]);

  list.render(["a", "b", "d", "c"], ["d", "c"]);
  expect(calls.map(({ row, from }) => ({ row, from }))).toEqual([
    { row: "d", from: { transform: "translate(0px, 40px)" } },
    { row: "c", from: { transform: "translate(0px, -40px)" } },
  ]);
  expect(list.host.querySelector("[inert]")).toBeNull();
  list.unmount();
});

test("a reorder that changes the virtual window creates no arrivals or ghosts", () => {
  const list = renderList("280ms");
  list.render(["a", "b", "c", "d"], ["a", "b"]);
  list.render(["d", "a", "b", "c"], ["d", "a"]);
  expect(calls.map(({ row, from }) => ({ row, from }))).toEqual([
    { row: "a", from: { transform: "translate(0px, -40px)" } },
  ]);
  expect(list.host.querySelector("[inert]")).toBeNull();
  list.unmount();
});

test("an unchanged commit during motion keeps the target layout baseline", () => {
  const list = renderList("280ms");
  list.render(["a", "b"]);
  list.render(["b", "a"]);
  calls = [];
  animationOffset = 20;
  list.render(["b", "a"]);
  expect(calls).toEqual([]);
  animationOffset = 0;
  list.render(["a", "b"]);
  expect(calls.map(({ row, from }) => ({ row, from }))).toEqual([
    { row: "a", from: { transform: "translate(0px, 40px)" } },
    { row: "b", from: { transform: "translate(0px, -40px)" } },
  ]);
  list.unmount();
});
