import type { HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";

/** One presentational diff line; the caller owns parsing. */
export type DiffViewLine = Readonly<{
  kind: "add" | "context" | "file" | "hunk" | "remove";
  text: string;
}>;

/** Props accepted by DiffView. */
export type DiffViewProps = {
  lines: readonly DiffViewLine[];
  /** Lines the caller omitted, shown as a trailing note. */
  hiddenLines?: number;
} & Omit<HTMLAttributes<HTMLPreElement>, "children">;

const markers = {
  add: "+",
  context: " ",
  file: "",
  hunk: "@@",
  remove: "-",
} satisfies Record<DiffViewLine["kind"], string>;

/** A compact monospace diff with add/remove/hunk/file line tones. */
export function DiffView({
  lines,
  hiddenLines = 0,
  className,
  ...props
}: DiffViewProps) {
  return (
    <pre {...props} className={cn("caps-diff", className)}>
      {lines.map((line, index) => (
        <span
          className="caps-diff-line"
          data-kind={line.kind}
          key={`${String(index)}:${line.kind}`}
        >
          <span aria-hidden="true" className="caps-diff-marker">
            {markers[line.kind]}
          </span>
          {line.text}
          {"\n"}
        </span>
      ))}
      {hiddenLines > 0 ? (
        <span className="caps-diff-line" data-kind="more">
          … {String(hiddenLines)} more lines
        </span>
      ) : null}
    </pre>
  );
}
