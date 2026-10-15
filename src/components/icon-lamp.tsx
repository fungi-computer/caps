import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";
import { IconChoiceMark } from "./icon-choice-mark.js";

/** Props accepted by IconLamp. */
export type IconLampProps = {
  /** The full name read with the state, such as "Read files". */
  label: string;
  icon: ReactNode;
  /** A short visible legend; it does not replace the accessible label. */
  caption?: string;
  /** Lit: the icon in colour with the ink lamp. Off: the grey silhouette. */
  on: boolean;
  /** How the state reads aloud, as [on, off]. */
  stateLabels?: readonly [string, string];
} & Omit<HTMLAttributes<HTMLElement>, "children">;

/**
 * A read-only icon state: an icon key's face with no input, for rights or
 * settings shown but not changed here. It reads as "Label: state".
 */
export const IconLamp = forwardRef<HTMLElement, IconLampProps>(
  function IconLamp(
    {
      label,
      icon,
      caption,
      on,
      stateLabels = ["on", "off"],
      className,
      ...props
    },
    ref,
  ) {
    return (
      <span
        {...props}
        className={cn("caps-icon-lamp", className)}
        data-on={on}
        ref={ref}
      >
        <IconChoiceMark icon={icon} caption={caption} />
        <span className="sr-only">
          {label}: {on ? stateLabels[0] : stateLabels[1]}
        </span>
      </span>
    );
  },
);

/** One lamp in an IconLamps row. */
export type IconLampItem = Omit<IconLampProps, "stateLabels"> & {
  id: string;
};

/** Props accepted by IconLamps. */
export type IconLampsProps = {
  items: readonly IconLampItem[];
  stateLabels?: readonly [string, string];
} & Omit<HTMLAttributes<HTMLUListElement>, "children">;

/** A named row of read-only icon lamps; name it with `aria-label(ledby)`. */
export const IconLamps = forwardRef<HTMLUListElement, IconLampsProps>(
  function IconLamps({ items, stateLabels, className, ...props }, ref) {
    return (
      <ul {...props} className={cn("caps-icon-lamps", className)} ref={ref}>
        {items.map(({ id, ...item }) => (
          <li key={id}>
            <IconLamp
              {...item}
              {...(stateLabels === undefined ? {} : { stateLabels })}
            />
          </li>
        ))}
      </ul>
    );
  },
);
