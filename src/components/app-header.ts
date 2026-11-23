import { useCallback, useRef } from "react";

/**
 * The headers Apps have registered. A Toaster opens below the ones pinned to
 * the top of the viewport; it reads this store and never scans the page.
 */
const headers = new Set<HTMLElement>();
const listeners = new Set<() => void>();

/** The registered header elements, in no particular order. */
export function registeredAppHeaders(): ReadonlySet<HTMLElement> {
  return headers;
}

/** Call back whenever a header is registered or released. */
export function subscribeAppHeaders(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * A ref for the App's own top header row. While the element is mounted and
 * touches the top of the viewport, toasts open below it; it keeps clear of a
 * header that wraps, grows on touch or scrolls away. The element also carries
 * `data-caps-app-header`, so a proof can find it.
 */
export function useAppHeaderRef(): (element: HTMLElement | null) => void {
  const current = useRef<HTMLElement | null>(null);
  return useCallback((element: HTMLElement | null) => {
    const previous = current.current;
    if (previous === element) return;
    if (previous) {
      headers.delete(previous);
      previous.removeAttribute("data-caps-app-header");
    }
    current.current = element;
    if (element) {
      headers.add(element);
      element.setAttribute("data-caps-app-header", "");
    }
    for (const listener of listeners) listener();
  }, []);
}
