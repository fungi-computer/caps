import {
  forwardRef,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

/** A caller-resolved visual tile. */
export type MosaicItem = {
  alt?: string;
  height?: number;
  id: string;
  disabled?: boolean;
  state?: "loading" | "ready" | "error";
  url?: string;
  width?: number;
};

/** Props accepted by Mosaic. */
export type MosaicProps = HTMLAttributes<HTMLDivElement> & {
  empty?: ReactNode;
  items: readonly MosaicItem[];
  /** Caller-owned accessible copy for the list. */
  label?: ReactNode;
  /** When absent, tiles are deliberately non-interactive. */
  onOpen?: (item: MosaicItem) => void;
};

/** Renders supplied tiles only; callers resolve data, policy, and navigation. */
export const Mosaic = forwardRef<HTMLDivElement, MosaicProps>(function Mosaic(
  { className, empty, items, label, onOpen, ...rootProps },
  ref,
) {
  const labelId = useId();
  if (items.length === 0) return <>{empty ?? null}</>;
  return (
    <div
      {...rootProps}
      ref={ref}
      aria-labelledby={label ? labelId : undefined}
      className={[
        "grid grid-cols-2 gap-xs md:grid-cols-3 xl:grid-cols-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="list"
    >
      {label ? (
        <span className="sr-only" id={labelId}>
          {label}
        </span>
      ) : null}
      {items.map((item) => (
        <div key={item.id} role="listitem">
          {onOpen ? (
            <button
              aria-busy={item.state === "loading" || undefined}
              aria-label={item.alt ?? item.id}
              className="relative aspect-square w-full overflow-hidden rounded-box border border-base-300 bg-base-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 caps-focus-color"
              data-mosaic-item={item.id}
              disabled={item.disabled}
              onClick={() => {
                onOpen(item);
              }}
              type="button"
            >
              <Tile item={item} />
            </button>
          ) : (
            <div
              aria-busy={item.state === "loading" || undefined}
              className="relative aspect-square overflow-hidden rounded-box border border-base-300 bg-base-200"
              data-mosaic-item={item.id}
            >
              <Tile item={item} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

function Tile({ item }: { item: MosaicItem }): ReactElement {
  return (
    <>
      {item.url ? (
        <img
          alt={item.alt ?? ""}
          className="h-full w-full object-cover"
          height={item.height}
          src={item.url}
          width={item.width}
        />
      ) : null}
      {item.state === "loading" ? (
        <span
          aria-hidden="true"
          className="loading loading-spinner loading-sm absolute inset-0 m-auto"
        />
      ) : null}
    </>
  );
}
