import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { cleanup } from "../test-utils/index.js";
import { Button } from "./button.js";

/**
 * jsdom has no layout, so a stand-in lays a button out: 8px per character,
 * 20px per icon, plus whatever room its parent hands it. Screen rects carry the
 * ancestor scale; `offsetWidth` stays in layout pixels like the real thing.
 */
const layout = { hidden: false, scale: 1, room: 0 };
let glides: { from: string; to: string }[] = [];
let cancels = 0;
let running: { onfinish: (() => void) | null }[] = [];
const roots: { unmount: () => void }[] = [];

function cssWidth(button: HTMLElement) {
  if (layout.hidden) return 0;
  return (
    8 * button.textContent.length +
    20 * button.querySelectorAll("svg").length +
    layout.room
  );
}

beforeEach(() => {
  layout.hidden = false;
  layout.scale = 1;
  layout.room = 0;
  glides = [];
  running = [];
  cancels = 0;
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return cssWidth(this);
    },
  );
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const width = this instanceof HTMLElement ? cssWidth(this) : 0;
      return new DOMRect(0, 0, width * layout.scale, 30 * layout.scale);
    },
  );
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value(this: Element, frames: Keyframe[]) {
      const [first, last] = frames;
      glides.push({ from: String(first?.width), to: String(last?.width) });
      const animation = {
        cancel() {
          cancels += 1;
        },
        onfinish: null,
        oncancel: null,
      };
      running.push(animation);
      return animation;
    },
  });
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  cleanup();
  document.body.innerHTML = "";
  Reflect.deleteProperty(Element.prototype, "animate");
  vi.restoreAllMocks();
});

function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  return {
    host,
    show: (ui: ReactNode) => {
      act(() => {
        root.render(ui);
      });
    },
  };
}

it("does not tween when a re-render brings the same text in new children", () => {
  const view = mount();
  view.show(<Button>{["Add ", "beat"]}</Button>);
  // The parent hands the button more room; the words are unchanged.
  layout.room = 40;
  view.show(<Button>{["Add ", "beat"]}</Button>);
  view.show(
    <Button>
      <span>Add beat</span>
    </Button>,
  );
  expect(glides).toEqual([]);
  expect(cancels).toBe(0);
});

it("does not tween from zero when a button is shown after being hidden", () => {
  layout.hidden = true;
  const view = mount();
  view.show(
    <div style={{ display: "none" }}>
      <Button>{["Add ", "beat"]}</Button>
    </div>,
  );
  layout.hidden = false;
  view.show(
    <div>
      <Button>{["Add ", "beat"]}</Button>
    </div>,
  );
  view.show(
    <div>
      <Button>{["Add ", "beat"]}</Button>
    </div>,
  );
  expect(glides).toEqual([]);
});

it("glides between layout widths under a scaled ancestor", () => {
  layout.scale = 1.15;
  const view = mount();
  view.show(<Button>Save</Button>);
  view.show(<Button>Saving now</Button>);
  expect(glides).toEqual([{ from: "32px", to: "80px" }]);
});

it("still glides when the label text changes", () => {
  const view = mount();
  view.show(<Button>Save</Button>);
  view.show(<Button>Saving…</Button>);
  expect(glides).toEqual([{ from: "32px", to: "56px" }]);
});

it("still glides when loading begins and ends", () => {
  const view = mount();
  view.show(<Button>Save</Button>);
  view.show(<Button loading>Save</Button>);
  expect(glides).toEqual([{ from: "32px", to: "52px" }]);
  // The first glide lands before the next change.
  act(() => {
    running[0]?.onfinish?.();
  });
  view.show(<Button>Save</Button>);
  expect(glides).toEqual([
    { from: "32px", to: "52px" },
    { from: "52px", to: "32px" },
  ]);
});

it("still glides into the result beat", () => {
  const view = mount();
  view.show(<Button resultLabel="Saved">Save</Button>);
  glides = [];
  view.show(
    <Button result="done" resultLabel="Saved">
      Save
    </Button>,
  );
  expect(glides.length).toBeGreaterThan(0);
});
