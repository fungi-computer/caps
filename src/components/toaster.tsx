import { Toaster as Sonner, type ToasterProps } from "sonner";
import { X } from "lucide-react";
import { cn } from "../lib/cn.js";
import { Loader } from "./loader.js";
import { Status } from "./status.js";
import { createPortal } from "react-dom";
import { useOverlayRoot } from "./overlay-root.js";

export { toast } from "sonner";

/**
 * Sonner owns gestures, stacking, focus and lifetime; Caps owns the surface.
 * Colors come from the Stipe tokens in the cascade, so a `data-theme` switch
 * restyles open toasts; Sonner's own light and dark palettes are overridden.
 */
export function Toaster({ className, ...props }: ToasterProps) {
  const root = useOverlayRoot("toast");
  if (!root) return null;
  return createPortal(
    <Sonner
      position="top-right"
      swipeDirections={["right", "top"]}
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
