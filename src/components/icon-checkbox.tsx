import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
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

/** Props accepted by CheckKey. The label names the native input. */
export type CheckKeyProps = {
  label: string;
  /** A Sigil or App icon before the label; decorative. */
  icon?: ReactNode;
  /** One quiet line under the label, read as the input's description. */
  hint?: ReactNode;
} & Omit<CheckboxProps, "children" | "indicator" | "appearance">;

/**
 * One choice in a short multi-select, drawn as a wide Caps key: Sigil, label
 * and an optional hint, a lit lamp and selected face when checked. The native
 * checkbox covers the whole key, so it keeps form submission, keyboard and
 * focus behaviour.
 */
export const CheckKey = forwardRef<HTMLInputElement, CheckKeyProps>(
  function CheckKey({ label, icon, hint, className, ...props }, ref) {
    const hintId = useId();
    const describedBy =
      [props["aria-describedby"], hint ? hintId : null]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <label className="caps-check-key">
        <Checkbox
          {...props}
          aria-label={label}
          aria-describedby={describedBy}
          className={cn("caps-check-key-input", className)}
          indicator={
            <span className="caps-check-key-face" aria-hidden="true">
              {icon ? (
                <span className="caps-check-key-icon">{icon}</span>
              ) : null}
              <span className="caps-check-key-copy">
                <span className="caps-check-key-label">{label}</span>
                {hint ? (
                  <span className="caps-check-key-hint" id={hintId}>
                    {hint}
                  </span>
                ) : null}
              </span>
              <span className="caps-check-key-lamp" />
            </span>
          }
          ref={ref}
        />
      </label>
    );
  },
);

/** Lays out a group of CheckKeys: a wrapping grid of equal keys. */
export function CheckKeys({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("caps-check-keys", className)} />;
}
