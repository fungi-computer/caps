import { Toaster as Sonner, type ToasterProps } from "sonner";
import { X } from "lucide-react";
import { cn } from "../lib/cn.js";
import { Loader } from "./loader.js";
import { Status } from "./status.js";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { registeredAppHeaders, subscribeAppHeaders } from "./app-header.js";
import { useOverlayRoot } from "./overlay-root.js";

import { toast } from "sonner";

export { toast };

/**
 * Show a notice a hosted App asked for, on one named Toaster, with the
 * notice's tone choosing the Caps status dot.
 */
export function showNotice(
  notice: Readonly<{
    message: string;
    tone?: "error" | "info" | "success" | "warning";
  }>,
  toasterId: string,
): void {
  const options = { toasterId, closeButton: true };
  if (notice.tone === undefined) toast(notice.message, options);
  else toast[notice.tone](notice.message, options);
}

/**
 * Toasts start below the App's header row, never over it: the header's real
 * bottom edge (`--caps-app-header-height`, measured from the header registered with
 * `useAppHeaderRef`, or 32px when none touches the top) plus a gap, pushed
 * down by the phone's safe area.
 */
const edges = {
  top: "calc(var(--caps-app-header-height) + var(--spacing-sm) + env(safe-area-inset-top, 0px))",
  bottom: 16,
};

/** Sonner's own phone breakpoint: below it a toast spans the screen. */
const narrowQuery = "(max-width: 600px)";

const globalWindow: Partial<Pick<Window, "matchMedia">> = globalThis;
const observerHost: Partial<Pick<typeof globalThis, "ResizeObserver">> =
  globalThis;

function subscribeNarrow(notify: () => void): () => void {
  const query = globalWindow.matchMedia?.(narrowQuery);
  query?.addEventListener("change", notify);
  return () => {
    query?.removeEventListener("change", notify);
  };
}

/** Server renders assume a wide screen; the first client paint corrects it. */
function useNarrowScreen(): boolean {
  return useSyncExternalStore(
    subscribeNarrow,
    () => globalWindow.matchMedia?.(narrowQuery).matches ?? false,
    () => false,
  );
}

/**
 * How far below the viewport top a header may start and still count as the
 * App's top header. An App often pads its own root (Trellis's editor pads its
 * bar by about 4px), so touching the top exactly would miss it; 8px is under
 * the toast gap, so a header further down is a different row.
 */
const headerTopReach = 8;

/**
 * The bottom edge of the registered App headers that touch the top of the
 * viewport (the lowest of them), or null when none does, when the
 * `--caps-app-header-height` default applies. Headers elsewhere on the page do
 * not count. It follows the headers' size, the window size and scrolling,
 * once per frame, and changes state only when the value changes.
 */
function useHeaderClearance(): number | null {
  const [clearance, setClearance] = useState<number | null>(null);
  useEffect(() => {
    // Every browser has ResizeObserver; a non-browser renderer may not, and
    // then the header is still measured on mount, resize and scroll.
    const resize = observerHost.ResizeObserver
      ? new observerHost.ResizeObserver(() => {
          schedule();
        })
      : undefined;
    let observed = new Set<HTMLElement>();
    let frame = 0;
    function schedule() {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    }
    function measure() {
      const headers = registeredAppHeaders();
      for (const header of observed)
        if (!headers.has(header)) resize?.unobserve(header);
      for (const header of headers)
        if (!observed.has(header)) resize?.observe(header);
      observed = new Set(headers);
      let bottom: number | null = null;
      for (const header of headers) {
        const box = header.getBoundingClientRect();
        if (box.top <= headerTopReach && box.bottom > 0)
          bottom = Math.max(bottom ?? 0, Math.ceil(box.bottom));
      }
      setClearance(bottom);
    }
    const unsubscribe = subscribeAppHeaders(schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, {
      capture: true,
      passive: true,
    });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      unsubscribe();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, { capture: true });
    };
  }, []);
  return clearance;
}

/**
 * Sonner owns gestures, stacking, focus and lifetime; Caps owns the surface.
 * Colors come from the Stipe tokens in the cascade, so a `data-theme` switch
 * restyles open toasts; Sonner's own light and dark palettes are overridden.
 */
export function Toaster({ className, ...props }: ToasterProps) {
  const root = useOverlayRoot("toast");
  const narrow = useNarrowScreen();
  const clearance = useHeaderClearance();
  if (!root) return null;
  const style: CSSProperties = { ...props.style };
  if (clearance !== null)
    Object.assign(style, {
      "--caps-app-header-height": `${String(clearance)}px`,
    });
  return createPortal(
    <Sonner
      // The composer and a decision card sit at the bottom of a phone, so a
      // toast there hides what the person must answer. On a phone it spans the
      // top edge, below the safe area, and swipes away upward.
      position={narrow ? "top-center" : "top-right"}
      swipeDirections={narrow ? ["top"] : ["right", "top"]}
      mobileOffset={{ ...edges, left: 16, right: 16 }}
      offset={{ ...edges, left: 16, right: 16 }}
      gap={8}
      icons={{
        close: <X aria-hidden="true" size={12} />,
        success: <Status glyph="dot" tone="success" />,
        error: <Status glyph="dot" tone="error" />,
        warning: <Status glyph="dot" tone="warning" />,
        info: <Status glyph="dot" tone="info" />,
        loading: (
          <Loader decorative size="sm" tone="current" variant="wander" />
        ),
      }}
      className={cn("caps-toaster", className)}
      {...props}
      style={style}
    />,
    root,
  );
}
