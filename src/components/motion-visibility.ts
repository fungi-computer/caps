/** @internal Pause decorative motion outside the visible document/viewport. */
export function observeMotionVisibility(
  element: Element,
  onChange: (visible: boolean) => void,
) {
  const document = element.ownerDocument;
  let intersecting = true;
  const update = () => {
    onChange(intersecting && !document.hidden);
  };
  const browser: Partial<Pick<typeof globalThis, "IntersectionObserver">> =
    globalThis;
  const observer =
    "IntersectionObserver" in globalThis && browser.IntersectionObserver
      ? new browser.IntersectionObserver((entries) => {
          const entry = entries.find(
            (candidate) => candidate.target === element,
          );
          if (!entry) return;
          intersecting = entry.isIntersecting;
          update();
        })
      : undefined;
  observer?.observe(element);
  document.addEventListener("visibilitychange", update);
  update();
  return () => {
    observer?.disconnect();
    document.removeEventListener("visibilitychange", update);
  };
}
