import { ArrowDownToLine } from "lucide-react";
import { memo, useEffect, useId, useRef, type RefObject } from "react";
import { useMotion } from "../lib/motion.js";
import { observeMotionVisibility } from "./motion-visibility.js";
import {
  createDropState,
  distanceToBottom,
  stepDrop,
  type ScrollDirection,
} from "./scroll-to-bottom-blob-state.js";

/** Props accepted by the persistent jump-to-bottom water drop. */
export type ScrollToBottomBlobProps = {
  /** Forward is ordinary DOM order; reverse supports column-reverse scrollers. */
  direction?: ScrollDirection;
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** Ask the host to scroll to its latest content. */
  onJump: () => void;
  /** Appended messages since the reader left the end. */
  unread?: number;
  /** Focus destination after keyboard activation; defaults to the scroller. */
  focusAfterJump?: RefObject<HTMLElement | null>;
};

/** A continuously tugged water drop, with its own visibility and focus lifecycle. */
export const ScrollToBottomBlob = memo(function ScrollToBottomBlob({
  direction = "forward",
  scrollerRef,
  onJump,
  unread = 0,
  focusAfterJump,
}: ScrollToBottomBlobProps) {
  const frame = useRef<HTMLDivElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const bead = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const icon = useRef<SVGSVGElement>(null);
  const state = useRef(createDropState());
  const wake = useRef<() => void>(() => undefined);
  const jump = useRef(false);
  const count = useRef(unread);
  const motion = useMotion(frame);
  const id = `caps-drop-${useId().replaceAll(":", "")}`;

  useEffect(() => {
    count.current = unread;
    wake.current();
  }, [unread]);
  useEffect(() => {
    const scroller = scrollerRef.current;
    const root = visual.current;
    const body = ball.current;
    const fixed = anchor.current;
    const incoming = bead.current;
    const control = button.current;
    const arrow = icon.current;
    const container = frame.current;
    if (
      !scroller ||
      !root ||
      !body ||
      !fixed ||
      !incoming ||
      !control ||
      !arrow ||
      !container
    )
      return;
    let raf = 0;
    let previousTime = 0;
    let lastTop = scroller.scrollTop;
    let visible = true;
    const draw = () => {
      const s = state.current;
      root.dataset.motionState = s.phase;
      root.style.display = s.phase === "hidden" ? "none" : "";
      control.tabIndex = s.phase === "hidden" || s.phase === "merging" ? -1 : 0;
      control.disabled = s.phase === "merging";
      control.setAttribute(
        "aria-label",
        `Jump to bottom${s.unread ? `, ${String(s.unread)} new message${s.unread === 1 ? "" : "s"}` : ""}`,
      );
      root.style.opacity = motion.reduced ? String(s.opacity) : "";
      fixed.style.display =
        motion.reduced || s.phase === "resting" || s.phase === "hidden"
          ? "none"
          : "";
      incoming.style.display = motion.reduced || s.bead === 0 ? "none" : "";
      if (motion.reduced) {
        body.style.transform = "";
        body.style.transformOrigin = "";
        body.style.width = s.unread
          ? `${String(control.clientWidth * s.volume)}px`
          : "";
        body.style.height = s.unread
          ? `${String(control.clientWidth * s.volume)}px`
          : "";
        arrow.style.transform = "";
        arrow.style.opacity = "";
        fixed.style.transform = "";
        incoming.style.transform = "";
        return;
      }
      body.style.width = "";
      body.style.height = "";
      if (s.phase === "resting" && s.unread === 0) {
        body.style.transform = "";
        body.style.transformOrigin = "";
        arrow.style.transform = "";
        arrow.style.opacity = "";
        fixed.style.transform = "";
        incoming.style.transform = "";
        return;
      }
      const tug = Math.min(
        1,
        (Math.abs(s.y) / 9) * 0.7 + (Math.abs(s.vy) / 120) * 0.3,
      );
      const stretch = 1 + motion.stretch * tug;
      const volume = Math.max(0.001, s.volume);
      const well = Math.max(0, 1 - volume);
      body.style.transformOrigin = s.y >= 0 ? "50% 0%" : "50% 100%";
      body.style.transform = `translateY(${String(s.y)}px) scale(${String((volume / Math.sqrt(stretch)) * (1 - 0.12 * well))}, ${String(volume * stretch * (1 + 0.1 * well))})`;
      fixed.style.transform = `scale(${String(Math.min(1, Math.abs(s.y) / 3) * volume * 0.55)})`;
      incoming.style.transform = `translateY(${String(-34 * s.bead * s.bead)}px) scale(${String(0.62 * Math.min(1, s.bead * 3))})`;
      arrow.style.transform = `translateY(${String(s.y * 0.8)}px)`;
      arrow.style.opacity = String(s.opacity);
    };
    const tick = (now: number) => {
      raf = 0;
      const elapsed = previousTime ? now - previousTime : 16;
      previousTime = now;
      const top = scroller.scrollTop;
      state.current = stepDrop(
        state.current,
        {
          distance: distanceToBottom(scroller, direction),
          delta: top - lastTop,
          unread: count.current,
          jump: jump.current,
        },
        elapsed,
        motion,
      );
      lastTop = top;
      jump.current = false;
      draw();
      const s = state.current;
      if (
        s.phase !== "hidden" &&
        (!s.shown || s.phase !== "resting" || s.opacity < 1)
      )
        schedule();
    };
    function schedule() {
      if (!visible || raf) return;
      raf = requestAnimationFrame(tick);
    }
    const onScroll = () => {
      if (!raf) previousTime = 0;
      schedule();
    };
    wake.current = onScroll;
    const stopObserving = observeMotionVisibility(container, (next) => {
      visible = next;
      if (!next) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        previousTime = 0;
        lastTop = scroller.scrollTop;
        schedule();
      }
    });
    const browser: Partial<Pick<typeof globalThis, "ResizeObserver">> =
      globalThis;
    const resize = browser.ResizeObserver
      ? new browser.ResizeObserver(onScroll)
      : undefined;
    resize?.observe(scroller);
    if (scroller.firstElementChild) resize?.observe(scroller.firstElementChild);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    schedule();
    return () => {
      wake.current = () => undefined;
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      resize?.disconnect();
      stopObserving();
    };
  }, [direction, scrollerRef, motion]);

  const activate = () => {
    if (state.current.phase === "hidden" || state.current.phase === "merging")
      return;
    jump.current = true;
    count.current = 0;
    wake.current();
    if (document.activeElement === button.current) {
      const target = focusAfterJump?.current ?? scrollerRef.current;
      if (target) {
        if (target === scrollerRef.current && !target.hasAttribute("tabindex"))
          target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
    }
    onJump();
  };
  return (
    <div
      ref={frame}
      className="absolute bottom-4 right-4 z-1 h-8 w-8 md:h-6 md:w-6"
    >
      <div
        ref={visual}
        className="relative h-full w-full"
        data-motion-state="hidden"
        style={{ display: "none" }}
      >
        <div
          className="absolute -inset-1.5"
          style={{ filter: `url(#${id})`, willChange: "filter" }}
        >
          <svg aria-hidden="true" className="absolute h-0 w-0">
            <defs>
              <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur
                  in="SourceGraphic"
                  result="blur"
                  stdDeviation="4"
                />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
                />
              </filter>
            </defs>
          </svg>
          <div
            className="absolute inset-0 m-auto h-8 w-8 md:h-6 md:w-6"
            ref={ball}
            data-drop-body=""
          >
            <div className="absolute inset-0 rounded-full border border-base-300 bg-base-200 shadow-sm" />
          </div>
          <div
            ref={anchor}
            className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-base-200 md:h-6 md:w-6"
            style={{ display: "none" }}
          />
          <div
            ref={bead}
            className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-base-200 md:h-6 md:w-6"
            style={{ display: "none" }}
            data-drop-incoming=""
          />
        </div>
        <button
          ref={button}
          aria-label="Jump to bottom"
          className="absolute inset-0 z-1 grid place-items-center rounded-full caps-focus-color"
          data-testid="jump-to-bottom"
          onClick={activate}
          title="Jump to bottom"
          type="button"
          tabIndex={-1}
        >
          <ArrowDownToLine ref={icon} className="text-base-content" size={13} />
        </button>
      </div>
    </div>
  );
});
