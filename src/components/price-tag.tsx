import { Badge } from "./badge.js";

/** The caller-provided price shown on a store entry. */
export type PriceTagProps = Readonly<{
  price: { kind: "free" } | { kind: "one-time"; label: string };
}>;

/** A compact, theme-backed price label for store entries. */
export function PriceTag({ price }: PriceTagProps) {
  return (
    <Badge tone="success" variant="quiet">
      {price.kind === "free" ? (
        "Free"
      ) : (
        <span className="caps-numeric">{price.label}</span>
      )}
    </Badge>
  );
}
