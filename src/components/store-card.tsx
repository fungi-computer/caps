import type { HTMLAttributes, ReactNode } from "react";
import { Badge } from "./badge.js";
import { Card } from "./card.js";
import { PriceTag, type PriceTagProps } from "./price-tag.js";
import { cn } from "../lib/cn.js";

/** A shelf entry with independent opening and acquisition controls. */
export type StoreCardProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> &
  Readonly<{
    title: string;
    tagline: string;
    variant?: "listing" | "cartridge" | "server";
    /** Split wide feature cards into cover and copy columns. */
    layout?: "stack" | "split";
    cover?: ReactNode;
    icon?: ReactNode;
    seller?: ReactNode;
    price?: PriceTagProps["price"];
    badges?: readonly string[];
    action?: ReactNode;
    href?: string;
    /** Open the listing independently of its footer action. */
    onSelect?: () => void;
  }>;

/** Caps owns the cover, copy, metadata and independent interaction states. */
export function StoreCard({
  title,
  tagline,
  variant = "listing",
  layout = "stack",
  cover,
  icon,
  seller,
  price,
  badges = [],
  action,
  href,
  onSelect,
  className,
  ...props
}: StoreCardProps) {
  const content = (
    <>
      {cover ? <span className="caps-store-cover">{cover}</span> : null}
      <span className="caps-store-heading">
        {icon ? <span className="caps-store-icon">{icon}</span> : null}
        <span className="caps-store-copy">
          <strong className="caps-store-title">{title}</strong>
          <span className="caps-store-tagline">{tagline}</span>
        </span>
      </span>
    </>
  );
  return (
    <Card
      {...props}
      role="article"
      aria-label={title}
      variant="interactive"
      className={cn("caps-store-card", className)}
      data-variant={variant}
      data-layout={layout}
    >
      <div className="caps-store-body">
        {href ? (
          <a className="caps-store-open" href={href}>
            {content}
          </a>
        ) : onSelect ? (
          <button className="caps-store-open" type="button" onClick={onSelect}>
            {content}
          </button>
        ) : (
          <div className="caps-store-open">{content}</div>
        )}
        <footer className="caps-store-footer">
          <div className="caps-store-meta">
            {seller}
            {badges.map((badge) => (
              <Badge key={badge} tone="secondary" variant="quiet" size="sm">
                {badge.replaceAll("-", " ")}
              </Badge>
            ))}
            {price ? <PriceTag price={price} /> : null}
          </div>
          {action ? <div className="caps-store-action">{action}</div> : null}
        </footer>
      </div>
    </Card>
  );
}
