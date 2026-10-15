import { ChevronsUpDown } from "lucide-react";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { Button } from "../components/button.js";
import { Combobox } from "../components/combobox.js";
import { Separator } from "../components/separator.js";
import { cn } from "../lib/cn.js";

/** Props accepted by AppStatusBar. */
export type AppStatusBarProps = HTMLAttributes<HTMLElement> & {
  /**
   * What this window is attached to: a StatusBarPicker, or a plain
   * AppStatusItem when it cannot be changed. Every App keeps it first.
   */
  attachment?: ReactNode;
  /** Readouts held at the far end, such as save state. */
  end?: ReactNode;
};

/**
 * One App window's status bar: its attachment first, then the App's own
 * readouts, with an optional far-end readout. One bar per window.
 */
export function AppStatusBar({
  attachment,
  end,
  children,
  className,
  ...props
}: AppStatusBarProps) {
  return (
    <footer {...props} className={cn("caps-app-status-bar", className)}>
      {attachment}
      {attachment !== undefined && children !== undefined ? (
        // The host's attachment ends here; the App's own items follow.
        <Separator
          orientation="vertical"
          className="caps-app-status-bar-rule"
        />
      ) : null}
      {children}
      {end === undefined ? null : (
        <span className="caps-app-status-item caps-app-status-bar-end">
          {end}
        </span>
      )}
    </footer>
  );
}

/** One quiet status readout. */
export function AppStatusItem({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn("caps-app-status-item", className)} />;
}

/** One choice a status bar picker offers. */
export type StatusBarPickerOption = Readonly<{ id: string; label: string }>;

/** Props accepted by StatusBarPicker. */
export type StatusBarPickerProps = {
  /** What is picked, e.g. "Computer"; the trigger is named "<noun>: <label>". */
  noun: string;
  /** The plural used for searching, e.g. "Computers". */
  pluralNoun: string;
  /** The picked thing's mark, shown before its label. */
  icon: ReactNode;
  options: readonly StatusBarPickerOption[];
  /** The selected option id; `null` when nothing is attached. */
  value: string | null;
  /** Called with a different option's id. */
  onSelect: (id: string) => void;
  /** Shown when the list is empty, e.g. why nothing can be chosen. */
  emptyMessage?: ReactNode;
  /** The trigger's accessible name; defaults to "<noun>: <label>". */
  accessibleLabel?: string;
  disabled?: boolean;
  /** Host-owned popup visibility; omitted for the ordinary trigger-owned picker. */
  open?: boolean;
  /** Reports popup dismissal or trigger activation to the host. */
  onOpenChange?: (open: boolean) => void;
};

/**
 * The status bar's attachment picker: a quiet label that opens a searchable
 * list above the bar. Selection is a request; the caller owns the change.
 */
export function StatusBarPicker({
  noun,
  pluralNoun,
  icon,
  options,
  value,
  onSelect,
  emptyMessage,
  accessibleLabel,
  disabled = false,
  open,
  onOpenChange,
}: StatusBarPickerProps) {
  const label =
    options.find((option) => option.id === value)?.label ??
    (value === null ? `No ${noun}` : noun);
  return (
    <Combobox
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
      aria-label={noun}
      contentClassName="caps-status-bar-picker-list"
      emptyMessage={
        options.length === 0
          ? (emptyMessage ?? `No ${pluralNoun}`)
          : `No matching ${pluralNoun}`
      }
      getKey={(option) => option.id}
      getLabel={(option) => option.label}
      inputProps={{ "aria-label": `Search ${pluralNoun}` }}
      items={options}
      placeholder={`Search ${pluralNoun}…`}
      renderItem={(option) => (
        <span className="caps-status-bar-picker-option">
          {icon}
          {option.label}
        </span>
      )}
      trigger={
        <Button
          variant="ghost"
          size="xs"
          className="caps-status-bar-picker"
          aria-label={accessibleLabel ?? `${noun}: ${label}`}
          title={`${noun}: ${label}`}
          disabled={disabled}
        >
          {icon}
          <span className="caps-status-bar-picker-label">{label}</span>
          <ChevronsUpDown aria-hidden="true" />
        </Button>
      }
      value={value}
      onValueChange={(next) => {
        if (next !== null && next !== value) onSelect(next);
      }}
    />
  );
}

/** Props accepted by StatusBarChip. */
export type StatusBarChipProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  /** Visible name of the item, e.g. "Ports". */
  label: ReactNode;
  /** Decorative mark before the label; on a phone the chip shows it alone. */
  icon?: ReactNode;
  /** A readout after the label, such as a CountBadge. */
  readout?: ReactNode;
  /**
   * Toggle state. `undefined` is an ordinary action; a boolean adds
   * `aria-pressed` and fills the chip while on.
   */
  pressed?: boolean;
  /**
   * Disclosure state for a chip that opens a menu or panel. A boolean adds
   * `aria-expanded` and fills the chip while open.
   */
  expanded?: boolean;
};

/**
 * One App-declared status bar control (an action, a toggle or a menu
 * trigger): a flat chip with the same quiet face as StatusBarPicker. It
 * forwards its ref and props, so a menu can render it as its trigger.
 */
export const StatusBarChip = forwardRef<HTMLButtonElement, StatusBarChipProps>(
  function StatusBarChip(
    { label, icon, readout, pressed, expanded, className, ...props },
    ref,
  ) {
    return (
      <Button
        {...props}
        ref={ref}
        variant="ghost"
        size="xs"
        className={cn("caps-status-bar-chip", className)}
        aria-pressed={pressed ?? props["aria-pressed"]}
        aria-expanded={expanded ?? props["aria-expanded"]}
      >
        {icon === undefined ? null : (
          <span className="caps-status-bar-chip-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="caps-status-bar-chip-label">{label}</span>
        {readout}
      </Button>
    );
  },
);
