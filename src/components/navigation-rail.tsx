import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";

import { cn } from "../lib/cn.js";

type OverflowEdges = { start: boolean; end: boolean };

/** Props accepted by NavigationRail. */
export type NavigationRailProps = HTMLAttributes<HTMLElement> & {
  /** Let a long rail fit across wide layouts while retaining mobile scrolling. */
  fitAtWide?: boolean;
};

/** A horizontal navigation list that signals when links continue off-screen. */
export const NavigationRail = forwardRef<HTMLElement, NavigationRailProps>(
  function NavigationRail(
    { children, className, fitAtWide, ...props },
    forwardedRef,
  ) {
    const viewport = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState<OverflowEdges>({
      start: false,
      end: false,
    });

    useEffect(() => {
      const scroller = viewport.current;
      const links = content.current;
      if (!scroller || !links) return;

      const update = () => {
        const maximum = scroller.scrollWidth - scroller.clientWidth;
        const next = {
          start: scroller.scrollLeft > 1,
          end: maximum - scroller.scrollLeft > 1,
        };
        setEdges((current) =>
          current.start === next.start && current.end === next.end
            ? current
            : next,
        );
      };
      update();
      scroller.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);

      const active = links.querySelector<HTMLElement>('[aria-current="page"]');
      if (active) {
        // Centre the active link, then land on a link boundary so no link is
        // cut mid-word at the leading edge.
        const target =
          active.offsetLeft - (scroller.clientWidth - active.clientWidth) / 2;
        const starts = Array.from(links.children, (link) =>
          link instanceof HTMLElement ? link.offsetLeft : 0,
        );
        const maximum = scroller.scrollWidth - scroller.clientWidth;
        const boundary = starts.find((start) => start >= target);
        if (boundary !== undefined && boundary <= maximum) {
          scroller.scrollLeft = boundary;
        } else {
          // Past the last boundary the rail cannot scroll on; show the link
          // that would be cut whole instead.
          const cut = starts.filter((start) => start < maximum).at(-1);
          scroller.scrollLeft = cut ?? maximum;
        }
        update();
      }

      return () => {
        scroller.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    }, [children]);

    return (
      <nav
        {...props}
        className={cn(
          "caps-navigation-rail",
          fitAtWide && "caps-navigation-rail-fit-wide",
          className,
        )}
        data-overflow-end={edges.end ? "true" : undefined}
        data-overflow-start={edges.start ? "true" : undefined}
        ref={forwardedRef}
      >
        <div className="caps-navigation-rail-viewport" ref={viewport}>
          <div className="caps-navigation-rail-content" ref={content}>
            {children}
          </div>
        </div>
      </nav>
    );
  },
);
