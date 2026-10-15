import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn.js";

/** SectionGrid props. */
export type SectionGridProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * `split` is a page's two-column section grid. `desktop` composes a home
   * screen: it fills and scrolls its region, centers a bounded measure, and
   * lets `span="full"` sections run across both columns.
   */
  layout?: "split" | "desktop";
};

/** A two-column page section grid that stacks at the compact breakpoint. */
export const SectionGrid = forwardRef<HTMLDivElement, SectionGridProps>(
  function SectionGrid({ className, layout = "split", ...props }, ref) {
    return (
      <div
        {...props}
        className={cn("caps-section-grid", className)}
        data-layout={layout === "desktop" ? "desktop" : undefined}
        ref={ref}
      />
    );
  },
);

/** A caller-owned App launch option. */
export type AppGridItem = Readonly<{
  id: string;
  label: string;
  icon: ReactNode;
  /** Caller-owned state line below the App name. */
  status?: ReactNode;
  disabled?: boolean;
  /** A dimmed App identity whose action may still open settings or recovery. */
  muted?: boolean;
  /** Invoke the caller-owned App launch behavior. */
  onSelect: () => void;
}>;

/** AppGrid props. */
export type AppGridProps = Omit<
  HTMLAttributes<HTMLUListElement>,
  "children"
> & {
  items: readonly AppGridItem[];
  /**
   * `default` is a quiet launcher. `lg` gives each mark a larger key
   * and a more spacious label. The theme supplies its material.
   */
  size?: "default" | "lg";
};

/** A responsive launcher grid with large marks and concise labels. */
export const AppGrid = forwardRef<HTMLUListElement, AppGridProps>(
  function AppGrid({ className, items, size = "default", ...props }, ref) {
    return (
      <ul
        {...props}
        className={cn("caps-app-grid", className)}
        data-size={size === "lg" ? "lg" : undefined}
        ref={ref}
      >
        {items.map((item) => (
          <li key={item.id}>
            <button
              aria-label={item.label}
              className={cn("caps-app-grid-item", item.muted && "opacity-55")}
              disabled={item.disabled}
              onClick={item.onSelect}
              type="button"
            >
              <span aria-hidden="true" className="caps-app-grid-icon">
                {item.icon}
              </span>
              <span className="caps-app-grid-label">{item.label}</span>
            </button>
            {item.status ? (
              <div className="flex justify-center">{item.status}</div>
            ) : null}
          </li>
        ))}
      </ul>
    );
  },
);
