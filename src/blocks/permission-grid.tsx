import type { JSX, ReactNode } from "react";

/**
 * LAW — a permission grid is a spec sheet, not a form: one row per
 * capability, read left to right as index, mark, name, state and scope. The
 * mark is decorative; the row's name is its accessible fact. State is always
 * spelled out in words, never carried by color alone. Any control a row
 * carries is caller-owned and names itself.
 */

/** Whether the capability is available in this scope. */
export type PermissionState = "allowed" | "denied";

/** One capability row. */
export type PermissionGridRow = Readonly<{
  id: string;
  /** Decorative mark, for example a sigil; hidden from assistive technology. */
  mark: ReactNode;
  /** The capability's name; the row's accessible fact. */
  label: string;
  /** Short family label shown beside the index, for example `COMPUTERS`. */
  group?: string;
  state: PermissionState;
  /** Visible state word, for example `On` or `Off`. */
  stateLabel: string;
  /** Where the state comes from, for example `Owner grant` or `Default`. */
  scope: string;
  /** Optional caller-owned control, for example a switch naming this row. */
  control?: ReactNode;
}>;

/** Props accepted by PermissionGrid. */
export type PermissionGridProps = Readonly<{
  /** Visible caption naming whose permissions these are. */
  caption: ReactNode;
  /** Optional plain-language note under the caption. */
  summary?: ReactNode;
  rows: readonly PermissionGridRow[];
  /** Column headings; product copy stays with the caller. */
  headings?: Readonly<{
    capability: string;
    state: string;
    scope: string;
    control?: string;
  }>;
  className?: string;
}>;

const DEFAULT_HEADINGS = {
  capability: "Capability",
  state: "State",
  scope: "Scope",
} as const;

function index(position: number): string {
  return String(position + 1).padStart(2, "0");
}

/** Product-neutral, dense capability sheet: one row per capability. */
export function PermissionGrid({
  caption,
  summary,
  rows,
  headings = DEFAULT_HEADINGS,
  className,
}: PermissionGridProps): JSX.Element {
  const hasControls = rows.some((row) => row.control !== undefined);
  return (
    <figure className={`caps-permission-grid ${className ?? ""}`}>
      <figcaption className="caps-permission-grid-caption">
        <span className="caps-permission-grid-title">{caption}</span>
        {summary === undefined ? null : (
          <span className="caps-permission-grid-summary">{summary}</span>
        )}
      </figcaption>
      <table>
        <thead>
          <tr>
            <th scope="col" className="caps-permission-grid-index">
              #
            </th>
            <th scope="col">{headings.capability}</th>
            <th scope="col">{headings.state}</th>
            <th scope="col">{headings.scope}</th>
            {hasControls ? (
              <th scope="col">
                {headings.control ?? <span className="sr-only">Change</span>}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, position) => (
            <tr key={row.id} data-state={row.state}>
              <td className="caps-permission-grid-index">
                <span>{index(position)}</span>
                {row.group === undefined ? null : (
                  <span className="caps-permission-grid-group">
                    {row.group}
                  </span>
                )}
              </td>
              <th scope="row">
                <span className="caps-permission-grid-capability">
                  <span
                    className="caps-permission-grid-mark"
                    aria-hidden="true"
                  >
                    {row.mark}
                  </span>
                  <span>{row.label}</span>
                </span>
              </th>
              <td>
                <span
                  className="caps-permission-grid-state"
                  data-state={row.state}
                >
                  {row.stateLabel}
                </span>
              </td>
              <td className="caps-permission-grid-scope">{row.scope}</td>
              {hasControls ? <td>{row.control ?? null}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
