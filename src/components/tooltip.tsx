import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { Slot } from "@radix-ui/react-slot";
import {
  createContext,
  useCallback,
  type MutableRefObject,
  type ButtonHTMLAttributes,
  type FocusEvent,
  forwardRef,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useOverlayRoot, useOverlayDismiss } from "./overlay-root.js";
import { cn } from "../lib/cn.js";
import { canAnimate, motionEasing, readMotion } from "../lib/motion.js";

/**
 * Tooltips are warm together: once one has opened, its neighbours open at
 * once until the pointer has rested away from every tooltip for a moment.
 * Moving along a toolbar then reads each label without waiting each time.
 */
type Warmth = {
  open: number;
  warm: boolean;
  cooling: ReturnType<typeof setTimeout> | undefined;
};
const warmth: Warmth = { open: 0, warm: false, cooling: undefined };
/** How long the group stays warm after the last tooltip closes. */
const coolingMs = 600;

/** Supported TooltipSide values. */
export type TooltipSide = "bottom" | "left" | "right" | "top";

type TooltipContextValue = {
  /** The tooltip opened while its group was warm: it swaps in, it doesn't arrive. */
  arrivedWarm: boolean;
  cancelClose: () => void;
  contentId: string;
  open: boolean;
  scheduleClose: () => void;
  scheduleOpen: () => void;
  side: TooltipSide;
  trigger: MutableRefObject<HTMLButtonElement | null>;
};

const TooltipContext = createContext<null | TooltipContextValue>(null);

/** Props accepted by Tooltip. */
export type TooltipProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  delayDuration?: number;
  /** Called after the tooltip open state changes. */
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  side?: TooltipSide;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

function useTooltipContext(): TooltipContextValue {
  const context = useContext(TooltipContext);
  if (!context) throw new Error("Tooltip parts must be used inside <Tooltip>");
  return context;
}

/** A tooltip controller with explicit controlled or uncontrolled open state. */
export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(
  function Tooltip(
    {
      children,
      className,
      defaultOpen = false,
      delayDuration = 300,
      onOpenChange,
      open: controlledOpen,
      side = "top",
      ...props
    },
    forwardedRef,
  ) {
    const trigger = useRef<HTMLButtonElement | null>(null);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const [arrivedWarm, setArrivedWarm] = useState(false);
    const open = controlledOpen ?? uncontrolledOpen;
    // Count this tooltip toward its group's warmth while it is open.
    useEffect(() => {
      if (!open) return;
      warmth.open += 1;
      warmth.warm = true;
      clearTimeout(warmth.cooling);
      return () => {
        warmth.open -= 1;
        if (warmth.open > 0) return;
        warmth.cooling = setTimeout(() => {
          warmth.warm = false;
        }, coolingMs);
      };
    }, [open]);
    const contentId = `${useId()}-content`;
    const timer = useRef<null | ReturnType<typeof setTimeout>>(null);
    const clearTimer = () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    const setOpen = (next: boolean) => {
      clearTimer();
      if (controlledOpen === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
    useOverlayDismiss(() => {
      setOpen(false);
    });
    const scheduleOpen = () => {
      clearTimer();
      if (open) return;
      const warm = warmth.warm;
      timer.current = setTimeout(
        () => {
          setArrivedWarm(warm);
          setOpen(true);
        },
        warm ? 0 : Math.max(0, delayDuration),
      );
    };
    const scheduleClose = () => {
      clearTimer();
      if (!open) return;
      timer.current = setTimeout(() => {
        setOpen(false);
      }, 0);
    };
    useEffect(() => clearTimer, []);
    return (
      <TooltipContext.Provider
        value={{
          arrivedWarm,
          cancelClose: clearTimer,
          contentId,
          open,
          scheduleClose,
          scheduleOpen,
          side,
          trigger,
        }}
      >
        <BaseTooltip.Root open={open} onOpenChange={setOpen}>
          <span
            {...props}
            className={cn("relative inline-flex", className)}
            ref={forwardedRef}
          >
            {children}
          </span>
        </BaseTooltip.Root>
      </TooltipContext.Provider>
    );
  },
);

/** Props accepted by TooltipTrigger. */
export type TooltipTriggerProps = {
  asChild?: boolean;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/** The trigger control for a Tooltip. */
export const TooltipTrigger = forwardRef<
  HTMLButtonElement,
  TooltipTriggerProps
>(function TooltipTrigger(
  {
    asChild = false,
    children,
    className,
    onBlur,
    onFocus,
    onPointerEnter,
    onPointerLeave,
    ...props
  },
  forwardedRef,
) {
  const tooltip = useTooltipContext();
  const attach = useCallback(
    (node: HTMLButtonElement | null) => {
      tooltip.trigger.current = node;
    },
    [tooltip.trigger],
  );
  useImperativeHandle<HTMLButtonElement | null, HTMLButtonElement | null>(
    forwardedRef,
    () => tooltip.trigger.current,
  );
  const { "aria-describedby": callerDescribedBy, ...nativeProps } = props;
  const triggerProps = {
    ...nativeProps,
    "aria-describedby":
      [callerDescribedBy, tooltip.open ? tooltip.contentId : undefined]
        .filter(Boolean)
        .join(" ") || undefined,
    "data-state": tooltip.open ? "open" : "closed",
    onBlur: (event: FocusEvent<HTMLButtonElement>) => {
      onBlur?.(event);
      if (!event.defaultPrevented) tooltip.scheduleClose();
    },
    onFocus: (event: FocusEvent<HTMLButtonElement>) => {
      onFocus?.(event);
      if (!event.defaultPrevented) tooltip.scheduleOpen();
    },
    onPointerEnter: (event: PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(event);
      if (!event.defaultPrevented) tooltip.scheduleOpen();
    },
    onPointerLeave: (event: PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(event);
      if (!event.defaultPrevented) tooltip.scheduleClose();
    },
  };
  if (asChild) {
    return (
      <Slot {...triggerProps} className={cn(className)} ref={attach}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      {...triggerProps}
      className={cn("btn", className)}
      ref={attach}
      type={props.type ?? "button"}
    >
      {children}
    </button>
  );
});

/** Props accepted by TooltipContent. */
export type TooltipContentProps = {
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

/** The positioned content region for a Tooltip. */
export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent(
    { children, className, onPointerEnter, onPointerLeave, ...props },
    ref,
  ) {
    const tooltip = useTooltipContext();
    const root = useOverlayRoot("tooltip");
    const [node, setNode] = useState<HTMLDivElement | null>(null);
    useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
      ref,
      () => node,
      [node],
    );
    // A cold tooltip arrives from its trigger; a warm one simply swaps in.
    useLayoutEffect(() => {
      const element = node;
      if (!tooltip.open || !element || !canAnimate(element)) return;
      const motion = readMotion(element);
      const travel = tooltip.arrivedWarm ? 0 : motion.distance;
      const offset = {
        bottom: `0 ${String(-travel)}px`,
        left: `${String(travel)}px 0`,
        right: `${String(-travel)}px 0`,
        top: `0 ${String(travel)}px`,
      }[tooltip.side];
      const arrival = element.animate(
        [
          { opacity: 0, translate: offset },
          { opacity: 1, translate: "0 0" },
        ],
        {
          duration: tooltip.arrivedWarm ? motion.fast : motion.normal,
          easing: motionEasing(motion, motion.ease),
          composite: "add",
        },
      );
      return () => {
        arrival.cancel();
      };
    }, [node, tooltip.open, tooltip.arrivedWarm, tooltip.side]);
    if (!tooltip.open || !root) return null;
    return (
      <BaseTooltip.Portal container={root}>
        <BaseTooltip.Positioner
          anchor={tooltip.trigger}
          side={tooltip.side}
          sideOffset={8}
          collisionPadding={8}
          collisionBoundary={root === document.body ? undefined : root}
          className="pointer-events-auto z-(--stipe-layer-tooltip)"
        >
          <BaseTooltip.Popup
            {...props}
            aria-live="polite"
            className={cn(
              "pointer-events-auto max-w-(--container-xs) rounded-box bg-base-content px-md py-sm text-xs text-base-100 shadow-lg",
              className,
            )}
            id={tooltip.contentId}
            onPointerEnter={(event) => {
              onPointerEnter?.(event);
              if (!event.defaultPrevented) tooltip.cancelClose();
            }}
            onPointerLeave={(event) => {
              onPointerLeave?.(event);
              if (!event.defaultPrevented) tooltip.scheduleClose();
            }}
            ref={setNode}
            role="tooltip"
          >
            {children}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    );
  },
);
