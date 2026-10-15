import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "../lib/cn.js";

/** Print finish: `holo` adds a foil sheen on hover that stills for reduced motion. */
export type TradingCardFinish = "standard" | "holo";

/** One footer fact, printed like a trading card's weakness or retreat line. */
export type TradingCardFact = Readonly<{ label: string; value: ReactNode }>;

/** The card's one move: a cost of symbols, a name, and caller-owned text or controls. */
export type TradingCardMove = Readonly<{
  /** Decorative cost symbols, such as Sigils. Hidden from assistive technology. */
  cost?: ReactNode;
  name: string;
  /** An optional figure printed at the end of the move line. */
  value?: ReactNode;
  children?: ReactNode;
}>;

/** Props accepted by TradingCard. */
export type TradingCardProps = Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children"
> & {
  name: string;
  /** A small stage label printed before the name, such as "Spore". */
  stage?: string;
  /** The stat printed at the right of the name bar, such as "60 SP". */
  stat?: ReactNode;
  /** The type line under the art window. */
  typeLine?: string;
  art: ReactNode;
  move: TradingCardMove;
  flavor?: ReactNode;
  facts?: readonly TradingCardFact[];
  /** Collector number, such as "001/001". */
  setNumber?: string;
  /** A small rarity mark printed by the set number. */
  rarity?: ReactNode;
  finish?: TradingCardFinish;
};

/**
 * A 63:88 trading card: a bright rim, a name bar with a stage and stat, an art
 * window, one move row that can hold a real form, a flavor line and a footer of
 * facts with a set number and rarity mark. The move body is caller-owned, so a
 * form inside it keeps its own labels, focus and errors.
 */
export const TradingCard = forwardRef<HTMLElement, TradingCardProps>(
  function TradingCard(
    {
      art,
      className,
      facts = [],
      finish = "standard",
      flavor,
      move,
      name,
      rarity,
      setNumber,
      stage,
      stat,
      typeLine,
      ...props
    },
    ref,
  ) {
    const nameId = useId();
    return (
      <article
        {...props}
        aria-labelledby={props["aria-labelledby"] ?? nameId}
        className={cn("caps-trading-card", className)}
        data-finish={finish}
        ref={ref}
      >
        <div className="caps-trading-card-face">
          <header className="caps-trading-card-name-bar">
            {stage ? (
              <span className="caps-trading-card-stage">{stage}</span>
            ) : null}
            <h2 className="caps-trading-card-name" id={nameId}>
              {name}
            </h2>
            {stat ? (
              <span className="caps-trading-card-stat">{stat}</span>
            ) : null}
          </header>
          <div className="caps-trading-card-window">{art}</div>
          {typeLine ? (
            <p className="caps-trading-card-type">{typeLine}</p>
          ) : null}
          <section className="caps-trading-card-move">
            <div className="caps-trading-card-move-line">
              {move.cost ? (
                <span aria-hidden="true" className="caps-trading-card-cost">
                  {move.cost}
                </span>
              ) : null}
              <h3 className="caps-trading-card-move-name">{move.name}</h3>
              {move.value ? (
                <span className="caps-trading-card-move-value">
                  {move.value}
                </span>
              ) : null}
            </div>
            {move.children ? (
              <div className="caps-trading-card-move-body">{move.children}</div>
            ) : null}
          </section>
          {flavor ? <p className="caps-trading-card-flavor">{flavor}</p> : null}
          {facts.length > 0 || setNumber || rarity ? (
            <footer className="caps-trading-card-footer">
              {facts.length > 0 ? (
                <dl className="caps-trading-card-facts">
                  {facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {setNumber || rarity ? (
                <p className="caps-trading-card-collector">
                  {setNumber ? <span>{setNumber}</span> : null}
                  {rarity ? (
                    <span className="caps-trading-card-rarity">{rarity}</span>
                  ) : null}
                </p>
              ) : null}
            </footer>
          ) : null}
        </div>
      </article>
    );
  },
);
