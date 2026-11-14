import { Toaster as Sonner, type ToasterProps } from "sonner";
import { X } from "lucide-react";
import { cn } from "../lib/cn.js";
import { Loader } from "./loader.js";
import { Status } from "./status.js";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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

/** Sonner's own phone breakpoint: below it a toast spans the screen. */
const narrowQuery = "(max-width: 600px)";

const globalWindow: Partial<Pick<Window, "matchMedia">> = globalThis;

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
 * Sonner owns gestures, stacking, focus and lifetime; Caps owns the surface.
 * Colors come from the Stipe tokens in the cascade, so a `data-theme` switch
 * restyles open toasts; Sonner's own light and dark palettes are overridden.
 */
export function Toaster({ className, ...props }: ToasterProps) {
  const root = useOverlayRoot("toast");
  const narrow = useNarrowScreen();
  if (!root) return null;
  return createPortal(
    <Sonner
      // On a phone a top toast covers the header and tabs, so it rises from
      // the bottom edge, above the safe area, and swipes away downward.
      position={narrow ? "bottom-center" : "top-right"}
      swipeDirections={narrow ? ["bottom"] : ["right", "top"]}
      mobileOffset={{
        top: 16,
        bottom: "max(16px, env(safe-area-inset-bottom))",
        left: 16,
        right: 16,
      }}
      offset={16}
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
    />,
    root,
  );
}
