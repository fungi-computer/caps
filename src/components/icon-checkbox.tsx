import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/cn.js";
import { Checkbox, type CheckboxProps } from "./checkbox.js";
import { IconChoiceMark } from "./icon-choice-mark.js";

/** Props accepted by IconCheckbox. The full label names the native input. */
export type IconCheckboxProps = {
  label: string;
  icon: ReactNode;
  /** A short visible legend; it does not replace the accessible label. */
  caption?: string;
  /** Compact instruments show the icon and caption without a tile or lamp. */
  appearance?: "default" | "compact";
} & Omit<CheckboxProps, "children" | "indicator">;

/** An independent icon choice composed from the native Caps Checkbox. */
export const IconCheckbox = forwardRef<HTMLInputElement, IconCheckboxProps>(
  function IconCheckbox(
    { label, icon, caption, appearance, className, ...props },
    ref,
  ) {
    return (
      <label
        className="caps-icon-choice"
        data-appearance={appearance === "compact" ? appearance : undefined}
      >
        <Checkbox
          {...props}
          appearance={appearance ?? "default"}
          aria-label={label}
          className={cn("caps-icon-choice-input", className)}
          indicator={<IconChoiceMark icon={icon} caption={caption} />}
          ref={ref}
        />
      </label>
    );
  },
);
