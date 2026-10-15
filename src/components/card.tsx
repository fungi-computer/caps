import { forwardRef, type HTMLAttributes } from "react";

import { cn, cva } from "../lib/cn.js";

const cardVariants = cva("card caps-card", {
  variants: {
    variant: {
      surface: "caps-card-surface",
      outline: "caps-card-outline",
      interactive: "caps-card-interactive",
      game: "caps-card-game caps-card-interactive",
      fit: "caps-card-fit",
    },
    density: {
      regular: "",
      compact: "caps-card-compact",
    },
  },
  defaultVariants: { variant: "surface", density: "regular" },
});

/** Props accepted by Card. */
export type CardProps = {
  variant?: "surface" | "outline" | "interactive" | "game" | "fit";
  /** Emphasize a featured item without changing its interaction. */
  featured?: boolean;
  /** Present the absence of content within the same card shell. */
  state?: "empty";
  /** Reduce card section padding when several related details share a page. */
  density?: "regular" | "compact";
} & HTMLAttributes<HTMLDivElement>;

/** Props accepted by CenteredCard. */
export type CenteredCardProps = CardProps & {
  width?: "default" | "wide";
};

/** A presentational card shell. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, density, featured = false, state, variant, ...props },
  ref,
) {
  return (
    <div
      {...props}
      className={cn(
        cardVariants({ density, variant }),
        featured && "caps-card-featured",
        className,
      )}
      data-state={state}
      ref={ref}
    />
  );
});

/** Center one primary card in a welcoming, viewport-filling page stage. */
export const CenteredCard = forwardRef<HTMLDivElement, CenteredCardProps>(
  function CenteredCard(
    { className, density, variant, width = "default", ...props },
    ref,
  ) {
    return (
      <main className="caps-centered-card-stage">
        <Card
          {...props}
          className={cn(
            "caps-centered-card",
            width === "wide" && "caps-centered-card-wide",
            className,
          )}
          ref={ref}
          variant={variant ?? "surface"}
          {...(density ? { density } : {})}
        />
      </main>
    );
  },
);

/** A card header layout with optional centered alignment. */
export type CardHeaderProps = {
  alignment?: "start" | "center";
} & HTMLAttributes<HTMLDivElement>;

/** Render a Caps card header with the requested alignment. */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ alignment = "start", className, ...props }, ref) {
    return (
      <div
        {...props}
        className={cn(
          "caps-card-header",
          alignment === "center" && "caps-card-header-centered",
          className,
        )}
        ref={ref}
      />
    );
  },
);

/** Props accepted by CardTitle. */
export type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Heading level; the host keeps its document outline. Defaults to 3. */
  level?: 2 | 3;
};

/** A card title element. */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ className, level = 3, ...props }, ref) {
    const Heading = level === 2 ? "h2" : "h3";
    return (
      <Heading
        {...props}
        className={cn("caps-card-title", className)}
        ref={ref}
      />
    );
  },
);

/** A card supporting-description element. */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      {...props}
      className={cn("caps-card-description", className)}
      ref={ref}
    />
  );
});

/** A card body layout. */
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardContent({ className, ...props }, ref) {
  return (
    <div {...props} className={cn("caps-card-content", className)} ref={ref} />
  );
});

/** A card footer layout. */
export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div {...props} className={cn("caps-card-footer", className)} ref={ref} />
  );
});
