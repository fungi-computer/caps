import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** A visible keyboard key from a shortcut or instruction. */
export type KeycapProps = {
  children: ReactNode;
} & HTMLAttributes<HTMLElement>;

/** The shared field-guide treatment for a keyboard key. */
export function Keycap({ children, className, ...props }: KeycapProps) {
  return (
    <kbd {...props} className={cn("caps-keycap", className)}>
      {children}
    </kbd>
  );
}

/** Props accepted by CartridgeLabel. */
export type CartridgeLabelProps = {
  title: string;
  subtitle?: string;
  mark?: ReactNode;
} & HTMLAttributes<HTMLElement>;

/** A ruled, token-backed printed label for a physical game cartridge. */
export function CartridgeLabel({
  className,
  mark,
  subtitle,
  title,
  ...props
}: CartridgeLabelProps) {
  return (
    <figure
      {...props}
      aria-label={`${title} cartridge label`}
      className={cn("caps-cartridge-label", className)}
    >
      <span aria-hidden="true" className="caps-cartridge-label-rule" />
      {mark ? (
        <span aria-hidden="true" className="caps-cartridge-label-mark">
          {mark}
        </span>
      ) : null}
      <span className="caps-cartridge-label-title">{title}</span>
      {subtitle ? (
        <span className="caps-cartridge-label-subtitle">{subtitle}</span>
      ) : null}
      <span aria-hidden="true" className="caps-cartridge-label-rule" />
    </figure>
  );
}

/** Props accepted by SpecimenLabel. */
export type SpecimenLabelProps = {
  plate: string;
  detail: string;
  kind: string;
  number: string;
  title: ReactNode;
  summary?: ReactNode;
  /**
   * Mark the plate number for a pencil circle and the detail for a pencil
   * underline. The ruled CSS marks remain until `enhance/sketch` draws them.
   */
  sketch?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, "title">;

/** A caption, catalogue line, title, and note for a specimen illustration. */
export function SpecimenLabel({
  className,
  detail,
  kind,
  number,
  plate,
  sketch = false,
  summary,
  title,
  ...props
}: SpecimenLabelProps) {
  return (
    <aside {...props} className={cn("caps-specimen-label", className)}>
      <p className="caps-specimen-label-caption">
        <span
          className="caps-specimen-label-plate"
          data-sketch={sketch ? "circle" : undefined}
        >
          {plate}
        </span>
        <span
          className="caps-specimen-label-detail"
          data-sketch={sketch ? "underline" : undefined}
        >
          {detail}
        </span>
      </p>
      <span className="caps-specimen-label-meta">
        {kind} · {number}
      </span>
      <div className="caps-specimen-label-title">{title}</div>
      {summary ? (
        <p className="caps-specimen-label-summary">{summary}</p>
      ) : null}
    </aside>
  );
}
