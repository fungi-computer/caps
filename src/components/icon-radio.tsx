import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/cn.js";
import { RadioGroupItem, type RadioGroupItemProps } from "./radio-group.js";
import { IconChoiceMark } from "./icon-choice-mark.js";

/** Props accepted by IconRadio. Use it inside the existing RadioGroup. */
export type IconRadioProps = {
  label: string;
  icon: ReactNode;
  /** A short visible legend; it does not replace the accessible label. */
  caption?: string;
  /**
   * `color` keeps an off key's art in full colour, for choices whose colour
   * is the information (a character, a palette). Icons dim by default.
   */
  art?: "dim" | "color";
} & Omit<RadioGroupItemProps, "children" | "indicator">;

/** One icon choice in a native, mutually exclusive Caps RadioGroup. */
export const IconRadio = forwardRef<HTMLInputElement, IconRadioProps>(
  function IconRadio(
    { label, icon, caption, art = "dim", className, ...props },
    ref,
  ) {
    return (
      <label
        className="caps-icon-choice"
        data-art={art === "color" ? art : undefined}
      >
        <RadioGroupItem
          {...props}
          aria-label={label}
          className={cn("caps-icon-choice-input", className)}
          indicator={<IconChoiceMark icon={icon} caption={caption} />}
          ref={ref}
        />
      </label>
    );
  },
);

/** Props accepted by SwatchRadio. Use it inside the existing RadioGroup. */
export type SwatchRadioProps = {
  /** The colour's name: the accessible label and the hover title. */
  label: string;
  /** Any CSS colour, drawn as the key's dot. */
  color: string;
} & Omit<RadioGroupItemProps, "children" | "indicator">;

/**
 * One colour choice: a small icon key whose dot keeps its colour while off,
 * so every choice reads before it is picked. The lamp marks the choice.
 */
export const SwatchRadio = forwardRef<HTMLInputElement, SwatchRadioProps>(
  function SwatchRadio({ label, color, className, ...props }, ref) {
    return (
      <label
        className="caps-icon-choice"
        data-art="color"
        data-swatch=""
        title={label}
      >
        <RadioGroupItem
          {...props}
          aria-label={label}
          className={cn("caps-icon-choice-input", className)}
          indicator={
            <IconChoiceMark
              icon={
                <span
                  className="caps-swatch-dot"
                  style={{ backgroundColor: color }}
                />
              }
            />
          }
          ref={ref}
        />
      </label>
    );
  },
);
