import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

/** Semantic destinations; the host owns their paint order and positioning. */
export type OverlayLayer = "popover" | "dialog" | "toast" | "tooltip";
/** Host portal roots; null keeps an overlay waiting until its layer mounts. */
export type OverlayContainers = Readonly<
  Record<OverlayLayer, HTMLElement | null>
>;

const DismissContext = createContext<
  ((listener: () => void) => () => void) | undefined
>(undefined);

const Context = createContext<OverlayContainers | null>(null);

/** Supply shell portal roots without teaching Caps about the shell's layout. */
export function OverlayRoot({
  containers,
  children,
  subscribeDismiss,
}: {
  containers: OverlayContainers;
  children?: ReactNode;
  /** Subscribe to the host losing focus to a child surface or another window. */
  subscribeDismiss?: (listener: () => void) => () => void;
}) {
  return (
    <Context.Provider value={containers}>
      <DismissContext.Provider value={subscribeDismiss}>
        {children}
      </DismissContext.Provider>
    </Context.Provider>
  );
}

/**
 * Give overlays opened inside a host layer, such as a dialog, a popover root
 * of their own inside that layer, so a menu or picker paints over the surface
 * that opened it. The other layers stay the host's; standalone overlays use
 * the document body and need no scope.
 */
export function OverlayPopoverScope({
  container,
  children,
}: {
  container: HTMLElement | null;
  children?: ReactNode;
}) {
  const containers = useContext(Context);
  const scoped = useMemo(
    () => (containers === null ? null : { ...containers, popover: container }),
    [containers, container],
  );
  if (scoped === null) return children;
  return <Context.Provider value={scoped}>{children}</Context.Provider>;
}

/** Wait for a provided root; standalone overlays use the current document body. */
export function useOverlayRoot(layer: OverlayLayer): HTMLElement | null {
  const containers = useContext(Context);
  if (containers !== null) return containers[layer];
  return Object.hasOwn(globalThis, "document") ? document.body : null;
}

/** Retire a transient overlay when its owning host requests light dismissal. */
export function useOverlayDismiss(dismiss: () => void): void {
  const subscribe = useContext(DismissContext);
  const callback = useRef(dismiss);
  callback.current = dismiss;
  useEffect(
    () =>
      subscribe?.(() => {
        callback.current();
      }),
    [subscribe],
  );
}
