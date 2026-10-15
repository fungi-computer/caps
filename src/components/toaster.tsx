import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "../lib/cn.js";
import { createPortal } from "react-dom";
import { useOverlayRoot } from "./overlay-root.js";

export { toast } from "sonner";

/** Sonner owns gestures, stacking, focus and lifetime; Caps owns the surface. */
export function Toaster({ className, ...props }: ToasterProps) {
  const root = useOverlayRoot("toast");
  if (!root) return null;
  return createPortal(
    <Sonner
      position="top-right"
      swipeDirections={["right", "top"]}
      offset={16}
      gap={8}
      className={cn("caps-toaster", className)}
      {...props}
    />,
    root,
  );
}
