import type { ReactNode } from "react";
import { Button, type ButtonProps } from "./button.js";
import { cn } from "../lib/cn.js";

/** A full-width, structured action for a data list. */
export type ActionRowProps = Omit<ButtonProps, "children"> & {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  density?: "regular" | "compact";
  /** `lg` gives a character-sized mark (a sprite head) more room than an icon. */
  iconSize?: "default" | "lg";
  /** `card` molds the row into its own raised plastic card. */
  appearance?: "plain" | "card";
};

/** Render a clear label, supporting detail, and optional trailing status. */
export function ActionRow({
  description,
  icon,
  label,
  density = "regular",
  appearance = "plain",
  iconSize = "default",
  size,
  trailing,
  ...buttonProps
}: ActionRowProps) {
  return (
    <Button
      {...buttonProps}
      className={cn(
        "caps-action-row",
        appearance === "card" && "caps-action-row-card",
        density === "compact"
          ? "h-auto min-h-10 w-full justify-start gap-xs px-xs py-2xs text-left"
          : "h-auto min-h-14 w-full justify-start gap-sm px-sm py-xs text-left",
        buttonProps.className,
      )}
      size={size ?? (density === "compact" ? "default" : "lg")}
      variant={buttonProps.variant ?? "ghost"}
    >
      {icon ? (
        <span
          className={
            density === "compact"
              ? `grid ${iconSize === "lg" ? "size-8" : "size-7"} shrink-0 place-items-center [&_:is(svg,.caps-monogram)]:size-5`
              : `grid ${iconSize === "lg" ? "size-12" : "size-10"} shrink-0 place-items-center [&_:is(svg,.caps-monogram)]:size-7`
          }
        >
          {icon}
        </span>
      ) : null}
      <span className="caps-action-row-copy">
        <span className="caps-action-row-label max-w-full truncate">
          {label}
        </span>
        {description ? (
          <span className="caps-action-row-description max-w-full truncate">
            {description}
          </span>
        ) : null}
      </span>
      {trailing ? (
        <span className="caps-action-row-trailing">{trailing}</span>
      ) : null}
    </Button>
  );
}
