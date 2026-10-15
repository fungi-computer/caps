import {
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { Button } from "../components/button.js";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../components/card.js";
import { cn } from "../lib/cn.js";

/** Presentation for a published game; fetching and navigation stay with the host. */
export type GameShareCardProps = HTMLAttributes<HTMLDivElement> & {
  heading: ReactNode;
  eyebrow?: ReactNode;
  cover?: ReactNode;
  /** A host-owned link or button, presented as the primary play action. */
  action: ReactElement;
};

/** Compose a game's cover, share details and play action in the enclosing theme. */
export const GameShareCard = forwardRef<HTMLDivElement, GameShareCardProps>(
  function GameShareCard(
    { heading, eyebrow, cover, action, children, className, ...props },
    ref,
  ) {
    return (
      <Card {...props} className={cn("caps-game-share", className)} ref={ref}>
        {cover ? <div className="caps-game-share-cover">{cover}</div> : null}
        <CardHeader>
          {eyebrow}
          <h3 className="caps-game-share-heading">{heading}</h3>
        </CardHeader>
        <CardContent className="gap-sm">{children}</CardContent>
        <CardFooter>
          <Button asChild variant="primary" className="caps-game-share-action">
            {action}
          </Button>
        </CardFooter>
      </Card>
    );
  },
);
