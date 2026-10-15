import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps,
} from "../components/card.js";
import { cn } from "../lib/cn.js";

/** Caller-provided pricing plan data. */
export type PricingPlan = {
  name: ReactNode;
  description?: ReactNode;
  price?: ReactNode;
  interval?: ReactNode;
};

/** Supported PricingCard layouts. */
export type PricingCardLayout = "stacked" | "banded";

/** Props accepted by PricingCard. */
export type PricingCardProps = HTMLAttributes<HTMLDivElement> & {
  plan: PricingPlan;
  /** Caller-owned feature rows. */
  features?: ReactNode;
  /** Caller-owned action control; this block never invokes or configures it. */
  action?: ReactNode;
  /** Caller-owned status content, such as a badge. */
  status?: ReactNode;
  /** Caller-owned illustration, such as an `img` with its own alt text. */
  art?: ReactNode;
  /**
   * `stacked` groups the title and price in the header. `banded` places the
   * name above the illustration and keeps the price on one line.
   */
  layout?: PricingCardLayout;
  /** Marks the one plan a page recommends with a heavier shadow. */
  featured?: boolean;
  /** Use tighter section spacing for dense plan comparisons. */
  density?: CardProps["density"];
};

/** Displays supplied plan data and slots; checkout and policy stay with the host. */
export const PricingCard = forwardRef<HTMLDivElement, PricingCardProps>(
  function PricingCard(
    {
      action,
      art,
      className,
      density,
      featured = false,
      features,
      plan,
      status,
      layout = "stacked",
      ...rootProps
    },
    ref,
  ) {
    const banded = layout === "banded";
    const title = (
      <div
        className={
          banded
            ? "caps-pricing-card-band"
            : "flex w-full items-start justify-between gap-lg"
        }
      >
        <CardTitle className="caps-pricing-card-name">{plan.name}</CardTitle>
        {status}
      </div>
    );
    return (
      <Card
        {...rootProps}
        className={cn(
          "caps-pricing-card",
          banded && "caps-pricing-card-banded",
          className,
        )}
        data-featured={featured ? "true" : undefined}
        ref={ref}
        variant="outline"
        {...(density ? { density } : {})}
      >
        {banded ? title : null}
        {art !== undefined ? (
          <figure className="caps-pricing-card-art">{art}</figure>
        ) : null}
        {banded ? (
          <CardHeader>
            <div className="caps-pricing-card-price">
              {plan.price !== undefined ? <strong>{plan.price}</strong> : null}
              {plan.interval !== undefined ? (
                <span>{plan.interval}</span>
              ) : null}
            </div>
            {plan.description ? (
              <CardDescription className="caps-pricing-card-description">
                {plan.description}
              </CardDescription>
            ) : null}
          </CardHeader>
        ) : (
          <CardHeader>
            {title}
            {plan.description ? (
              <CardDescription className="caps-pricing-card-description">
                {plan.description}
              </CardDescription>
            ) : null}
            {plan.price !== undefined ? (
              <div className="text-3xl font-semibold">{plan.price}</div>
            ) : null}
            {plan.interval !== undefined ? (
              <div className="text-sm text-base-content">{plan.interval}</div>
            ) : null}
          </CardHeader>
        )}
        {features !== undefined ? (
          <CardContent className="caps-pricing-card-features">
            {features}
          </CardContent>
        ) : null}
        {action !== undefined ? (
          <CardFooter className="caps-pricing-card-action">{action}</CardFooter>
        ) : null}
      </Card>
    );
  },
);
