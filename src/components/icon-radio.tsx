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
} & Omit<RadioGroupItemProps, "children" | "indicator">;

/** One icon choice in a native, mutually exclusive Caps RadioGroup. */
export const IconRadio = forwardRef<HTMLInputElement, IconRadioProps>(
  function IconRadio({ label, icon, caption, className, ...props }, ref) {
    return (
      <label className="caps-icon-choice">
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
