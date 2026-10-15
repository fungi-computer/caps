import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";

/**
 * Molded key colors. `inverse` is the contrasting key; `destructive` stays neutral until
 * hovered or focused; the rest follow the theme.
 */
export type KeycapTone =
  "neutral" | "primary" | "accent" | "inverse" | "destructive";
/** Keycap sizes: a legend chip, a dock key and a big face key. */
export type KeycapSize = "sm" | "md" | "lg";

/** Props accepted by Keycap. */
export type KeycapProps = HTMLAttributes<HTMLElement> & {
  tone?: KeycapTone;
  size?: KeycapSize;
  /** Show the key held down. Presentation only; the host owns input. */
  pressed?: boolean;
};

/**
 * One molded key legend, rendered as native `<kbd>`: the key a player presses.
 * The key sits on its own travel so pressed and resting keys take the same room.
 */
export const Keycap = forwardRef<HTMLElement, KeycapProps>(function Keycap(
  { tone = "neutral", size = "md", pressed = false, className, ...props },
  ref,
) {
  return (
    <kbd
      {...props}
      ref={ref}
      className={cn("caps-keycap", className)}
      data-tone={tone}
      data-size={size}
      data-pressed={pressed}
    />
  );
});

/** Props accepted by KeycapButton. */
export type KeycapButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  /**
   * Visible name of the action, e.g. "Build". `null` makes an icon-only key,
   * which then needs an `aria-label`.
   */
  label: ReactNode;
  /** The keyboard key that runs the same action, shown as a small keycap. */
  shortcut?: string;
  /** Decorative icon before the label. */
  icon?: ReactNode;
  /** Extra readout after the label, such as a PixelNumber count. */
  readout?: ReactNode;
  tone?: KeycapTone;
  /**
   * Toggle state for mode keys. `undefined` is a momentary key; a boolean adds
   * `aria-pressed` and lights the key's indicator.
   */
  pressed?: boolean;
  /**
   * Disclosure state for keys that open a palette or window. A boolean adds
   * `aria-expanded` and lights the lamp; use it instead of `pressed` for
   * menus.
   */
  expanded?: boolean;
};

/**
 * A chunky action key for game docks and toy panels. The host owns the action
 * and the keyboard binding; `shortcut` only labels it.
 */
export const KeycapButton = forwardRef<HTMLButtonElement, KeycapButtonProps>(
  function KeycapButton(
    {
      label,
      shortcut,
      icon,
      readout,
      tone = "neutral",
      pressed,
      expanded,
      className,
      type = "button",
      ...props
    },
    ref,
  ) {
    const lamp = pressed ?? expanded;
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={cn("caps-keycap-button", className)}
        data-tone={tone}
        aria-pressed={pressed}
        aria-expanded={expanded}
        aria-keyshortcuts={props["aria-keyshortcuts"] ?? shortcut}
      >
        {lamp === undefined ? null : (
          <span
            className="caps-keycap-led"
            data-lit={lamp}
            aria-hidden="true"
          />
        )}
        {icon ? (
          <span className="caps-keycap-button-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {label === null ? null : (
          <span className="caps-keycap-button-label">{label}</span>
        )}
        {readout}
        {shortcut ? (
          <Keycap size="sm" tone="neutral" aria-hidden="true">
            {shortcut}
          </Keycap>
        ) : null}
      </button>
    );
  },
);
