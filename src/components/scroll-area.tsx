import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { animate, type JSAnimation } from "animejs";
import { forwardRef, useEffect, useRef, type HTMLAttributes } from "react";
import { cn } from "../lib/cn.js";
import { readMotion, useReducedMotion } from "../lib/motion.js";
import { themedEase, themedSpring } from "../lib/motion-spring.js";
import { overscrollImpulse, scrollImpulse } from "./scroll-motion.js";
import { Screen, Surface, type SurfaceProps } from "./surface.js";

/** Native scrolling with a plastic thumb responding to changes in scroll speed.
 * The ref and native props address the viewport; className sizes the frame.
 */
export const ScrollArea = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    surface?: boolean;
    surfaceSize?: SurfaceProps["size"];
    surfaceDepth?: SurfaceProps["depth"];
    /** Use the shared theme-aware display material on the fixed viewport. */
    screen?: boolean;
  }
>(function ScrollArea(
  {
    children,
    className,
    surface = false,
    surfaceSize,
    surfaceDepth,
    screen = false,
    ...props
  },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  const thumbSurface = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const frame = root.current;
    const viewport = frame?.querySelector<HTMLDivElement>(
      ".caps-scroll-viewport",
    );
    if (!viewport || !frame) return;
    let motion: JSAnimation | null = null;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let position = viewport.scrollTop;
    let time = performance.now();
    let velocity = 0;
    const deform = (impulse: ReturnType<typeof scrollImpulse>) => {
      const thumb = thumbSurface.current;
      if (!impulse || reduced || !thumb) return;
      motion?.cancel();
      thumb.style.transformOrigin = impulse.origin;
      const feel = readMotion(thumb);
      const kick = themedEase(feel, { ease: "outQuad", duration: 45 });
      const settle = themedSpring(feel, { bounce: 0.18, duration: 180 });
      motion = animate(thumb, {
        scaleY: [
          { to: impulse.scaleY, ...kick },
          { to: 1, ...settle },
        ],
        scaleX: [
          { to: impulse.scaleX, ...kick },
          { to: 1, ...settle },
        ],
      });
    };
    const react = (nextVelocity: number, elapsed: number) => {
      const impulse = scrollImpulse(velocity, nextVelocity, elapsed);
      velocity = nextVelocity;
      deform(impulse);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
        return;
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? viewport.clientHeight
            : 1;
      const impulse = overscrollImpulse(
        viewport.scrollTop,
        viewport.scrollHeight - viewport.clientHeight,
        event.deltaY * unit,
      );
      if (!impulse) return;
      clearTimeout(idle);
      velocity = 0;
      deform(impulse);
    };
    const onScroll = () => {
      const now = performance.now();
      const gap = now - time;
      const elapsed = gap > 100 ? 16 : Math.max(16, gap);
      const delta = viewport.scrollTop - position;
      if (gap > 100) velocity = 0;
      react(delta / elapsed, elapsed);
      position = viewport.scrollTop;
      time = now;
      clearTimeout(idle);
      idle = setTimeout(() => {
        react(0, 32);
      }, 64);
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    frame.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      clearTimeout(idle);
      motion?.cancel();
      // A preference change re-runs this effect: never strand a squash.
      if (thumbSurface.current) thumbSurface.current.style.transform = "none";
      viewport.removeEventListener("scroll", onScroll);
      frame.removeEventListener("wheel", onWheel);
    };
  }, [screen, surface, reduced]);
  const viewport = (
    <BaseScrollArea.Viewport
      render={screen ? <Screen /> : <div />}
      {...props}
      ref={ref}
      className="caps-scroll-viewport"
    >
      <BaseScrollArea.Content style={{ minWidth: 0 }}>
        {children}
      </BaseScrollArea.Content>
    </BaseScrollArea.Viewport>
  );
  return (
    <BaseScrollArea.Root
      render={
        surface ? (
          <Surface
            size={surfaceSize ?? "md"}
            depth={surfaceDepth ?? "shallow"}
          />
        ) : (
          <div />
        )
      }
      ref={root}
      className={cn("caps-scroll-area", className)}
    >
      {screen ? (
        <div className="caps-display-gasket caps-scroll-display">
          {viewport}
        </div>
      ) : (
        viewport
      )}
      <Surface
        size="sm"
        depth="deep"
        placement="embedded"
        className="caps-scroll-track-surface"
      >
        <BaseScrollArea.Scrollbar className="caps-scroll-track">
          <BaseScrollArea.Thumb className="caps-scroll-thumb">
            <span className="caps-scroll-thumb-surface" ref={thumbSurface} />
          </BaseScrollArea.Thumb>
        </BaseScrollArea.Scrollbar>
      </Surface>
    </BaseScrollArea.Root>
  );
});
