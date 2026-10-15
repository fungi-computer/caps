import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** One shipped thing and its version, printed under the tag. */
export type ReleaseTagEntry = Readonly<{ name: string; version: string }>;

/** Props accepted by ReleaseTag. */
export type ReleaseTagProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  /** One or two short lines printed large on the tag, such as ["Fungi", "Beta"]. */
  title: readonly string[];
  /** A small accent strip under the title, such as "Update". */
  label?: ReactNode;
  entries: readonly ReleaseTagEntry[];
};

/**
 * A release badge: a torn-off calendar page with binder rings, a stacked
 * title, one accent strip and a ruled list of names and versions below.
 * Presentation only; the caller supplies every word.
 */
export function ReleaseTag({
  className,
  entries,
  label,
  title,
  ...props
}: ReleaseTagProps) {
  return (
    <aside {...props} className={cn("caps-release-tag", className)}>
      <div className="caps-release-tag-page">
        <span aria-hidden="true" className="caps-release-tag-rings">
          <span />
          <span />
        </span>
        <p className="caps-release-tag-title">
          {title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        {label ? <p className="caps-release-tag-label">{label}</p> : null}
      </div>
      <dl className="caps-release-tag-entries">
        {entries.map((entry) => (
          <div key={entry.name}>
            <dt>{entry.name}</dt>
            <dd>{entry.version}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
