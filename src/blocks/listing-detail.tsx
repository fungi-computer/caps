import { useEffect, useId, useRef, type ReactNode } from "react";
import { Display } from "../components/surface.js";

/** Product-neutral listing detail: callers own availability, navigation and facts. */
export type ListingDetailProps = Readonly<{
  identity: string;
  title: string;
  tagline: string;
  icon?: ReactNode;
  seller?: ReactNode;
  action?: ReactNode;
  back?: ReactNode;
  note?: ReactNode;
  screenshots?: readonly { src: string; alt: string }[];
  description?: readonly string[];
  facts?: readonly { label: string; value: ReactNode }[];
}>;

/** A focused detail heading, screenshot strip, readable body and fact sheet. */
export function ListingDetail({
  identity,
  title,
  tagline,
  icon,
  seller,
  action,
  back,
  note,
  screenshots = [],
  description = [],
  facts = [],
}: ListingDetailProps) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [identity]);
  return (
    <article className="caps-listing-detail" aria-labelledby={`${id}-name`}>
      {back ? <div>{back}</div> : null}
      <header className="caps-listing-detail-header">
        {icon}
        <div className="caps-listing-detail-title">
          <h1 id={`${id}-name`} ref={heading} tabIndex={-1}>
            {title}
          </h1>
          <p className="caps-listing-detail-tagline">{tagline}</p>
          <div className="caps-listing-detail-meta">{seller}</div>
        </div>
        <div className="caps-listing-detail-action">{action}</div>
      </header>
      {note ? (
        <p className="caps-listing-detail-note" role="status">
          {note}
        </p>
      ) : null}
      {screenshots.length ? (
        <section aria-label="Screenshots" className="caps-listing-shots">
          {screenshots.map((shot) => (
            <Display
              className="caps-listing-shot"
              density="compact"
              size="sm"
              key={shot.src}
            >
              <img src={shot.src} alt={shot.alt} />
            </Display>
          ))}
        </section>
      ) : null}
      <div className="caps-listing-detail-body">
        {description.length ? (
          <section
            className="caps-listing-detail-about"
            aria-labelledby={`${id}-about`}
          >
            <h2 id={`${id}-about`}>About {title}</h2>
            {description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </section>
        ) : null}
        {facts.length ? (
          <dl className="caps-listing-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  );
}
