import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn.js";

/** Native surface attributes with independent rim, depth and placement choices. */
export type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  /** Rim scale, independent of the content's dimensions. */
  size?: "sm" | "md" | "lg";
  depth?: "shallow" | "deep";
  /** Embedded surfaces borrow their parent's casing; omit the exterior surround. */
  placement?: "standalone" | "embedded";
};

/** A themeable frame around a surface. No padding or interaction ownership. */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface(
    {
      className,
      size = "md",
      depth = "shallow",
      placement = "standalone",
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        data-surface-size={size}
        data-surface-depth={depth}
        data-surface-placement={placement}
        className={cn("caps-surface", className)}
      />
    );
  },
);

/** Display face using theme surfaces while preserving the inherited text font. */
export const Screen = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function Screen({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={cn("caps-screen", className)} />;
});

/** A recessed display with a separate gasket and screen face. */
export type DisplayProps = SurfaceProps & {
  /** Fill a flex region rather than sizing to its content. */
  fit?: "content" | "fill";
  /** Reduce the gasket footprint for compact displays. */
  density?: "normal" | "compact";
};

/** Theme-owned recessed screen with a gasket and optional compact fill geometry. */
export const Display = forwardRef<HTMLDivElement, DisplayProps>(
  function Display(
    {
      children,
      className,
      depth = "deep",
      fit = "content",
      density = "normal",
      ...props
    },
    ref,
  ) {
    const fill = fit === "fill";
    return (
      <Surface
        {...props}
        className={cn(className, fill && "flex min-h-0 flex-1")}
        depth={depth}
        ref={ref}
      >
        <div
          className={cn(
            "caps-display-gasket",
            fill && "flex min-h-0 min-w-0 flex-1",
          )}
          data-display-density={density}
        >
          <Screen
            className={cn(
              fill && "flex min-h-0 min-w-0 flex-1 overflow-hidden",
            )}
          >
            {children}
          </Screen>
        </div>
      </Surface>
    );
  },
);

/** Props accepted by ScreenHeader. */
export type ScreenHeaderProps = {
  /** A decorative Sigil or App icon before the title. */
  icon?: ReactNode;
  title: ReactNode;
  /** A Status or short readout opposite the title. */
  status?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "title" | "children">;

/** A screen's title bar, printed on the glass above a hairline. */
export const ScreenHeader = forwardRef<HTMLElement, ScreenHeaderProps>(
  function ScreenHeader({ className, icon, status, title, ...props }, ref) {
    return (
      <header
        {...props}
        className={cn("caps-screen-header", className)}
        ref={ref}
      >
        {icon ? (
          <span className="caps-screen-header-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="caps-screen-header-title">{title}</span>
        {status ? (
          <span className="caps-screen-header-status">{status}</span>
        ) : null}
      </header>
    );
  },
);

/**
 * An instrument's cells: a grid of hairline-ruled cells that reflows to one
 * column when narrow. Put ScreenCells straight inside a Screen or Display.
 */
export const ScreenCells = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    /** Compact instruments retain full-width rows instead of a cell grid. */
    appearance?: "default" | "compact";
  }
>(function ScreenCells({ appearance, className, ...props }, ref) {
  return (
    <div
      {...props}
      className={cn("caps-screen-cells", className)}
      data-appearance={appearance === "compact" ? appearance : undefined}
      ref={ref}
    />
  );
});

/** Props accepted by ScreenCell. */
export type ScreenCellProps = {
  /** Compact rows put their subject icon and legend before the controls. */
  appearance?: "default" | "compact";
  /** A leading subject icon. */
  icon?: ReactNode;
  /** The cell's tiny mono legend, such as "Processes". */
  legend?: ReactNode;
  /** A short value readout in the cell's corner, such as "2/4 ON". */
  readout?: ReactNode;
  /** Span the full row instead of one column. */
  wide?: boolean;
} & HTMLAttributes<HTMLDivElement>;

/** One instrument cell: a legend, an optional corner readout and its content. */
export const ScreenCell = forwardRef<HTMLDivElement, ScreenCellProps>(
  function ScreenCell(
    {
      children,
      className,
      legend,
      readout,
      icon,
      appearance,
      wide = false,
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        className={cn("caps-screen-cell", className)}
        data-wide={wide || undefined}
        data-appearance={appearance === "compact" ? appearance : undefined}
        ref={ref}
      >
        {icon ? <span className="caps-screen-cell-icon">{icon}</span> : null}
        {legend ? (
          <span className="caps-screen-cell-legend">{legend}</span>
        ) : null}
        {readout ? (
          <span className="caps-screen-cell-readout">{readout}</span>
        ) : null}
        {appearance === "compact" ? (
          <div className="caps-screen-cell-controls">{children}</div>
        ) : (
          children
        )}
      </div>
    );
  },
);
