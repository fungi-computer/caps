import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** Supported Prose treatments. */
export type ProseVariant = "default" | "dropcap";
/** Props accepted by Prose. */
export type ProseProps = {
  variant?: ProseVariant;
} & HTMLAttributes<HTMLElement>;

/**
 * Tailwind Typography's `prose` rhythm and measure in the active theme's
 * colours and faces; the caller supplies the document content.
 */
export const Prose = forwardRef<HTMLElement, ProseProps>(function Prose(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <article
      {...props}
      className={cn(
        "prose prose-caps",
        variant === "dropcap" && "caps-prose-dropcap",
        className,
      )}
      ref={ref}
    />
  );
});
