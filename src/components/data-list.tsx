import {
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn.js";

/** Props accepted by DataList. */
export type DataListProps = HTMLAttributes<HTMLUListElement> & {
  density?: "regular" | "compact";
};

/** A list wrapper for caller-provided rows. */
export const DataList = forwardRef<HTMLUListElement, DataListProps>(
  function DataList({ className, density = "regular", ...props }, ref) {
    return (
      <ul
        {...props}
        className={cn("list", density === "compact" && "list-sm", className)}
        ref={ref}
      />
    );
  },
);

/** A list row for a caller-provided label and value. */
export const DataRow = forwardRef<
  HTMLLIElement,
  LiHTMLAttributes<HTMLLIElement>
>(function DataRow({ className, ...props }, ref) {
  return <li {...props} className={cn("list-row", className)} ref={ref} />;
});

/** Props accepted by DataListHeading. */
export type DataListHeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Heading level; the host keeps its document outline. */
  level?: 2 | 3;
  /** Optional trailing count or status, such as a Badge. */
  aside?: ReactNode;
};

/** A quiet small-caps section label that groups the rows below it. */
export const DataListHeading = forwardRef<
  HTMLHeadingElement,
  DataListHeadingProps
>(function DataListHeading(
  { aside, children, className, level = 2, ...props },
  ref,
) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <Heading
      {...props}
      className={cn("caps-data-list-heading", className)}
      ref={ref}
    >
      <span>{children}</span>
      {aside !== undefined ? (
        <span className="caps-data-list-heading-aside">{aside}</span>
      ) : null}
    </Heading>
  );
});
