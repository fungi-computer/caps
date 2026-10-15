import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card.js";

/** Props accepted by SectionCard. */
export type SectionCardProps = HTMLAttributes<HTMLDivElement> & {
  /** The host-provided section heading. */
  heading: ReactNode;
  /** Optional host-provided supporting copy. */
  description?: ReactNode;
  /** Optional host-provided controls or status content. */
  actions?: ReactNode;
  /** The section body, supplied by the host through normal composition. */
  children?: ReactNode;
  /** Inside a SectionGrid, `full` spans every column; `auto` takes one. */
  span?: "auto" | "full";
  /** Heading level; the host keeps its document outline. Defaults to 3. */
  headingLevel?: 2 | 3;
};

/** A presentational card shell. It does not assign behavior to action content. */
export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  function SectionCard(
    {
      actions,
      children,
      className,
      description,
      heading,
      headingLevel = 3,
      span = "auto",
      ...rootProps
    },
    ref,
  ) {
    return (
      <Card
        {...rootProps}
        className={className}
        data-span={span === "full" ? "full" : undefined}
        ref={ref}
        variant="outline"
      >
        <CardHeader>
          <div className="caps-section-card-heading-row">
            <CardTitle level={headingLevel}>{heading}</CardTitle>
            {actions ? (
              <div className="caps-section-card-actions">{actions}</div>
            ) : null}
          </div>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        {children !== undefined ? <CardContent>{children}</CardContent> : null}
      </Card>
    );
  },
);
