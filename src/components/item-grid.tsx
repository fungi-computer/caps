import {
  forwardRef,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";
import { PixelNumber } from "./pixel-number.js";

/** One item placed on the grid. Coordinates are cells from the top left. */
export type ItemGridItem = {
  id: string;
  /** Accessible name, e.g. "Axe" or "Bread". */
  label: string;
  x: number;
  y: number;
  /** Footprint width in cells after rotation. Defaults to 1. */
  w?: number;
  /** Footprint height in cells after rotation. Defaults to 1. */
  h?: number;
  /** Decorative art: a sprite, an image or an SVG. */
  icon?: ReactNode;
  /** Stack count, drawn in pixel numerals when above 1. */
  quantity?: number;
  selected?: boolean;
};

/** A drop preview: where the held item would land, and whether it may. */
export type ItemGridGhost = {
  x: number;
  y: number;
  w: number;
  h: number;
  legal: boolean;
  /** Why an illegal drop is refused, in the host's words. */
  reason?: string;
};

/** A grid cell, with the item covering it if any. */
export type ItemGridCell = { x: number; y: number; item: ItemGridItem | null };

/** Cell sizes: pockets, a backpack and a big chest view. */
export type ItemGridCellSize = "sm" | "md" | "lg";

/** Props accepted by ItemGrid. */
export type ItemGridProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Accessible name of the container, e.g. "Backpack". */
  label: string;
  columns: number;
  rows: number;
  items: readonly ItemGridItem[];
  ghost?: ItemGridGhost | null;
  cellSize?: ItemGridCellSize;
  /** Controlled keyboard cursor. Omit to let the grid keep its own. */
  activeCell?: { x: number; y: number };
  /** The keyboard cursor moved to another cell. */
  onActiveCellChange?: (cell: ItemGridCell) => void;
  /** Click, Enter or Space on a cell. The host decides pick up, drop or use. */
  onCellActivate?: (cell: ItemGridCell) => void;
  /** Pointer over a cell, or `null` on leaving the grid; for drag ghosts. */
  onCellHover?: (cell: ItemGridCell | null) => void;
};

const MAX_CELLS = 32;

function footprint(item: ItemGridItem) {
  return { w: item.w ?? 1, h: item.h ?? 1 };
}

/** Throw on geometry the grid cannot draw; the host's data is wrong. */
function checkGrid(
  columns: number,
  rows: number,
  items: readonly ItemGridItem[],
) {
  for (const [name, value] of [
    ["columns", columns],
    ["rows", rows],
  ] as const)
    if (!Number.isInteger(value) || value < 1 || value > MAX_CELLS)
      throw new RangeError(
        `ItemGrid ${name} must be an integer from 1 to ${String(MAX_CELLS)}`,
      );
  const occupant = new Map<string, ItemGridItem>();
  for (const item of items) {
    const { w, h } = footprint(item);
    if (
      ![item.x, item.y, w, h].every(Number.isInteger) ||
      item.x < 0 ||
      item.y < 0 ||
      w < 1 ||
      h < 1 ||
      item.x + w > columns ||
      item.y + h > rows
    )
      throw new RangeError(
        `ItemGrid item ${item.id} does not fit a ${String(columns)}×${String(rows)} grid`,
      );
    for (let y = item.y; y < item.y + h; y++)
      for (let x = item.x; x < item.x + w; x++)
        occupant.set(`${String(x)},${String(y)}`, item);
  }
  return occupant;
}

/** The cell a navigation key moves to, clamped to the grid. */
function keyMove(
  key: string,
  { x, y }: { x: number; y: number },
  columns: number,
  rows: number,
): readonly [number, number] | null {
  switch (key) {
    case "ArrowLeft":
      return [Math.max(0, x - 1), y];
    case "ArrowRight":
      return [Math.min(columns - 1, x + 1), y];
    case "ArrowUp":
      return [x, Math.max(0, y - 1)];
    case "ArrowDown":
      return [x, Math.min(rows - 1, y + 1)];
    case "Home":
      return [0, y];
    case "End":
      return [columns - 1, y];
    default:
      return null;
  }
}

/** Grid dimensions as custom properties; the stylesheet owns the track size. */
type GridTracks = CSSProperties &
  Record<"--caps-item-grid-columns" | "--caps-item-grid-rows", number>;

function area(x: number, y: number, w: number, h: number): CSSProperties {
  return {
    gridColumn: `${String(x + 1)} / span ${String(w)}`,
    gridRow: `${String(y + 1)} / span ${String(h)}`,
  };
}

function tracks(
  style: CSSProperties | undefined,
  columns: number,
  rows: number,
): GridTracks {
  return {
    ...style,
    "--caps-item-grid-columns": columns,
    "--caps-item-grid-rows": rows,
  };
}

function cellName(cell: ItemGridCell, ghost: ItemGridGhost | null) {
  const where = `column ${String(cell.x + 1)}, row ${String(cell.y + 1)}`;
  const inGhost =
    ghost &&
    cell.x >= ghost.x &&
    cell.x < ghost.x + ghost.w &&
    cell.y >= ghost.y &&
    cell.y < ghost.y + ghost.h;
  const drop = inGhost
    ? ghost.legal
      ? ", drop here"
      : `, cannot drop${ghost.reason ? `: ${ghost.reason}` : ""}`
    : "";
  if (!cell.item) return `Empty, ${where}${drop}`;
  const count =
    cell.item.quantity !== undefined && cell.item.quantity > 1
      ? ` ×${String(cell.item.quantity)}`
      : "";
  return `${cell.item.label}${count}, ${where}${drop}`;
}

/**
 * A Diablo-style item grid. Cells carry the keyboard and pointer interface;
 * items and the drop ghost are drawn above them from the host's facts. The
 * grid never moves, merges or validates items: it shows what the host says.
 */
export const ItemGrid = forwardRef<HTMLDivElement, ItemGridProps>(
  function ItemGrid(
    {
      label,
      columns,
      rows,
      items,
      ghost = null,
      cellSize = "md",
      activeCell,
      onActiveCellChange,
      onCellActivate,
      onCellHover,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const occupant = checkGrid(columns, rows, items);
    const [ownCell, setOwnCell] = useState({ x: 0, y: 0 });
    const current = activeCell ?? ownCell;
    const reasonId = useId();
    const cellAt = (x: number, y: number): ItemGridCell => ({
      x,
      y,
      item: occupant.get(`${String(x)},${String(y)}`) ?? null,
    });
    const focusCell = (grid: HTMLElement, x: number, y: number) => {
      const next = cellAt(x, y);
      if (activeCell === undefined) setOwnCell({ x, y });
      onActiveCellChange?.(next);
      grid
        .querySelector<HTMLElement>(`[data-cell="${String(x)},${String(y)}"]`)
        ?.focus({ preventScroll: true });
    };
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      const move = keyMove(event.key, current, columns, rows);
      if (move) {
        event.preventDefault();
        focusCell(event.currentTarget, move[0], move[1]);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onCellActivate?.(cellAt(current.x, current.y));
      }
    };
    const refused = ghost && !ghost.legal && ghost.reason ? ghost.reason : null;
    return (
      <div
        {...props}
        ref={ref}
        className={cn("caps-item-grid", className)}
        data-cell-size={cellSize}
        style={tracks(style, columns, rows)}
      >
        <div className="caps-item-grid-board">
          <div
            role="grid"
            aria-label={label}
            aria-rowcount={rows}
            aria-colcount={columns}
            aria-describedby={refused ? reasonId : undefined}
            className="caps-item-grid-cells"
            onKeyDown={onKeyDown}
            onPointerLeave={() => onCellHover?.(null)}
          >
            {Array.from({ length: rows }, (_, y) => (
              <div role="row" key={y} className="caps-item-grid-row">
                {Array.from({ length: columns }, (_, x) => {
                  const cell = cellAt(x, y);
                  const active = current.x === x && current.y === y;
                  return (
                    <div
                      role="gridcell"
                      key={x}
                      tabIndex={active ? 0 : -1}
                      aria-label={cellName(cell, ghost)}
                      aria-selected={cell.item?.selected ?? false}
                      data-cell={`${String(x)},${String(y)}`}
                      data-occupied={cell.item !== null}
                      className="caps-item-grid-cell"
                      onClick={(event) => {
                        focusCell(
                          event.currentTarget.closest<HTMLElement>(
                            "[role=grid]",
                          ) ?? event.currentTarget,
                          x,
                          y,
                        );
                        onCellActivate?.(cell);
                      }}
                      onPointerEnter={() => onCellHover?.(cell)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="caps-item-grid-items" aria-hidden="true">
            {items.map((item) => {
              const { w, h } = footprint(item);
              return (
                <div
                  key={item.id}
                  className="caps-item"
                  data-selected={item.selected ?? false}
                  style={area(item.x, item.y, w, h)}
                >
                  <span className="caps-item-icon">{item.icon}</span>
                  {item.quantity !== undefined && item.quantity > 1 ? (
                    <PixelNumber
                      className="caps-item-count"
                      value={item.quantity}
                      size="sm"
                    />
                  ) : null}
                </div>
              );
            })}
            {ghost ? (
              <div
                className="caps-item-ghost"
                data-legal={ghost.legal}
                style={area(ghost.x, ghost.y, ghost.w, ghost.h)}
              />
            ) : null}
          </div>
        </div>
        {refused ? (
          <p id={reasonId} className="caps-item-grid-reason" role="status">
            {refused}
          </p>
        ) : null}
      </div>
    );
  },
);

/** How a slot answers the item being held over it. */
export type ItemSlotState = "idle" | "legal" | "illegal";

/** Props accepted by ItemSlot. */
export type ItemSlotProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  /** Slot name, e.g. "Head" or "Main hand". */
  label: string;
  /** The equipped item, if any. */
  item?: { label: string; icon?: ReactNode } | null;
  /** Faint outline art shown while the slot is empty. */
  placeholder?: ReactNode;
  state?: ItemSlotState;
};

/** One equipment slot for a paper doll: a pocket, its item and its name. */
export const ItemSlot = forwardRef<HTMLButtonElement, ItemSlotProps>(
  function ItemSlot(
    {
      label,
      item = null,
      placeholder,
      state = "idle",
      className,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={cn("caps-item-slot", className)}
        data-state={state}
        data-filled={item !== null}
        aria-label={
          props["aria-label"] ?? `${label}: ${item?.label ?? "empty"}`
        }
      >
        <span className="caps-item-slot-pocket" aria-hidden="true">
          {item ? (
            <span className="caps-item-icon">{item.icon}</span>
          ) : (
            <span className="caps-item-slot-placeholder">{placeholder}</span>
          )}
        </span>
        <span className="caps-item-slot-label" aria-hidden="true">
          {label}
        </span>
      </button>
    );
  },
);
