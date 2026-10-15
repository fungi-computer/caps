import { act, type ReactNode } from "react";

import { createRoot, type Root } from "react-dom/client";

// React 18's act() requires this environment flag (otherwise it warns
// "The current testing environment is not configured to support act(...)").
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  value: true,
  writable: true,
});

/**
 * Minimal component-test renderer for \@fungi.computer/caps (jsdom).
 *
 * Deliberately does NOT use \@testing-library/react: the repo's pnpm layout
 * ships a second, physically separate hoisted React under
 * `<repo>/node_modules/react`, and tooling resolved from the repo root pulls
 * that copy in while components under `src/` resolve the store copy — the
 * mixing yields "Cannot read properties of null (reading 'useState')".
 * Rendering through the package's own react-dom keeps one React instance
 * end to end.
 */

const roots = new Set<Root>();
const containers: HTMLElement[] = [];

export type ComponentRender = {
  container: HTMLElement;
  /** First element matching `selector`. */
  queryBySelector(selector: string): HTMLElement | null;
  /** First element whose trimmed text equals `text` (shallow preferred). */
  queryByText(text: string): HTMLElement | null;
};

/** Return a required test value or fail with a useful local message. */
export function requireValue<T>(
  value: T | null | undefined,
  description: string,
): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${description}`);
  }
  return value;
}

export function cleanup(): void {
  for (const root of roots) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers) {
    container.remove();
  }
  roots.clear();
  containers.length = 0;
}

/** Simulate user input into a controlled input/textarea (native setter). */
export function fireInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (!descriptor?.set) {
    throw new Error("No value setter — not an input element");
  }
  descriptor.set.call(el, value);
  el.dispatchEvent(
    new window.Event("input", { bubbles: true, cancelable: true }),
  );
  el.dispatchEvent(
    new window.Event("change", { bubbles: true, cancelable: true }),
  );
}

/** Dispatch a keyboard event (bubbles, cancelable) and return it. */
export function fireKey(
  target: Document | Element | Window,
  init: { type?: "keydown" | "keyup" } & KeyboardEventInit,
): KeyboardEvent {
  const event = new window.KeyboardEvent(init.type ?? "keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

export function render(ui: ReactNode): ComponentRender {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.add(root);
  containers.push(container);
  act(() => {
    // The package-local React and React DOM types keep the renderer on Caps'
    // declared React 18 seam.
    root.render(ui);
  });

  return {
    container,
    queryBySelector(selector: string) {
      return container.querySelector<HTMLElement>(selector);
    },
    queryByText(text: string) {
      const walker = container.querySelectorAll<HTMLElement>("*");
      for (const el of walker) {
        if (el.childElementCount > 0) continue;
        if (el.textContent.trim() === text) return el;
      }
      return null;
    },
  };
}
