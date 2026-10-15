import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";

/** A shelf or section title with shared case and tracking. */
export const SectionHeading = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(function SectionHeading({ className, ...props }, ref) {
  return (
    <h2
      {...props}
      ref={ref}
      className={cn("caps-section-heading", className)}
    />
  );
});

/** Supported Eyebrow tones. `live` marks something happening right now. */
export type EyebrowTone = "quiet" | "primary" | "secondary" | "live";

/** Props accepted by Eyebrow. */
export type EyebrowProps = HTMLAttributes<HTMLParagraphElement> & {
  tone?: EyebrowTone;
};

/** A small contextual label with shared case and tracking. */
export const Eyebrow = forwardRef<HTMLParagraphElement, EyebrowProps>(
  function Eyebrow({ className, tone = "quiet", ...props }, ref) {
    return (
      <p
        {...props}
        ref={ref}
        className={cn("caps-eyebrow", className)}
        data-tone={tone}
      />
    );
  },
);
