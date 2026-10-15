import {
  useOverlayRoot,
  useOverlayDismiss,
} from "../components/overlay-root.js";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { animate, stagger, type JSAnimation } from "animejs";
import { motionDefaults, readMotion, useReducedMotion } from "../lib/motion.js";
import { themedEase, themedSpring } from "../lib/motion-spring.js";
import { PanelsTopLeft, X } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type AppBarStyle = CSSProperties & {
  "--caps-app-bar-notch-left": string;
};

/** A caller-owned running App window or available App launcher. */
export type AppBarItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  /** Request focusing a running window or opening an available App. */
  onSelect: () => void;
  /** Request closing; the caller owns disposal and removal. */
  onClose?: () => void;
};

/** Caller-owned apps and actions; AppBar owns only presentation and disclosure. */
export type AppBarProps = {
  /** Portal container for the App dial; defaults to the document body. */
  container?: HTMLElement | null;
  windows: readonly AppBarItem[];
  /** Team Apps available to launch from the speed dial. */
  launchers: readonly AppBarItem[];
  /** Recent Sessions supplied by the shell's session owner. */
  sessions?: readonly AppBarItem[];
  /** Keep long launcher names readable instead of truncating them. */
  launcherLabels?: "truncate" | "wrap";
  alwaysExpanded?: boolean;
  /** Control the compact App dial from the surrounding shell. */
  isOpen?: boolean;
  /** Report requests to open or dismiss the compact App dial. */
  onOpenChange?: (open: boolean) => void;
  emptyLabel?: ReactNode;
  launcher: { label: string; icon?: ReactNode };
  /** A primary action revealed above the launcher, such as starting a chat. */
  primaryAction?: {
    label: string;
    icon: ReactNode;
    /** Invoke the caller-owned primary action. */
    onSelect: () => void;
  };
};

function AppBarItemView({
  item,
  available,
  expanded,
  onSelect,
  onClose,
  session = false,
  launcherLabels = "truncate",
}: {
  item: AppBarItem;
  available: boolean;
  expanded: boolean;
  onSelect: () => void;
  onClose: () => void;
  session?: boolean;
  launcherLabels?: "truncate" | "wrap";
}) {
  const icon = useRef<HTMLSpanElement>(null);
  const motion = useRef<JSAnimation>();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced && icon.current) {
      motion.current?.cancel();
      motion.current = animate(icon.current, { y: 0, scale: 1, duration: 0 });
    }
  }, [reduced]);
  useEffect(
    () => () => {
      motion.current?.cancel();
    },
    [],
  );
  const lift = (raised: boolean) => {
    if (!icon.current) return;
    motion.current?.cancel();
    const feel = readMotion(icon.current);
    motion.current = animate(icon.current, {
      y: raised && !reduced ? -feel.distance : 0,
      scale: raised && !reduced ? 1.12 : 1,
      ...themedSpring(feel, { bounce: 0.4, duration: 320 }),
    });
  };
  const tabIndex = !expanded ? -1 : 0;
  return (
    <div
      className="caps-app-bar-item"
      data-app-bar-item-id={item.id}
      data-launcher-labels={available ? launcherLabels : undefined}
      data-session={session ? "true" : undefined}
    >
      <button
        type="button"
        className="caps-app-bar-button"
        aria-label={item.label}
        title={item.label}
        aria-pressed={available ? undefined : item.active === true}
        data-active={item.active === true ? "true" : undefined}
        data-running={available ? undefined : "true"}
        tabIndex={tabIndex}
        onClick={onSelect}
        onPointerEnter={() => {
          lift(true);
        }}
        onPointerLeave={() => {
          lift(false);
        }}
        onFocus={() => {
          lift(true);
        }}
        onBlur={() => {
          lift(false);
        }}
      >
        <span ref={icon} className="caps-app-bar-icon" aria-hidden="true">
          {item.icon ?? <PanelsTopLeft />}
        </span>
        {available ? (
          <span className="caps-app-bar-item-label">{item.label}</span>
        ) : null}
      </button>
      {item.onClose ? (
        <button
          type="button"
          className="caps-app-bar-close"
          aria-label={`Close ${item.label}`}
          tabIndex={tabIndex}
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/** An anchored launcher between persistent running apps and a spring-out app tray. */
export function AppBar({
  container,
  windows,
  launchers,
  sessions = [],
  launcherLabels = "truncate",
  alwaysExpanded = false,
  isOpen,
  onOpenChange,
  emptyLabel,
  launcher,
  primaryAction,
}: AppBarProps) {
  const popoverRoot = useOverlayRoot("popover");
  const portalContainer = container ?? popoverRoot;
  const [internalOpen, setInternalOpen] = useState(false);
  const [notchLeft, setNotchLeft] = useState(0);
  const open = isOpen ?? internalOpen;
  useOverlayDismiss(() => {
    setOpen(false);
  });
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  const expanded = alwaysExpanded || open;
  const root = useRef<HTMLElement>(null);
  const runningRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const availableRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const previous = useRef(expanded);
  const previousAction = useRef(open);
  const reduced = useReducedMotion();
  const id = useId();
  const availableId = `caps-apps-${id}`;
  const actionId = `caps-app-action-${id}`;
  const activeId = windows.find((item) => item.active)?.id;
  const hasPrimaryAction = primaryAction !== undefined;

  useLayoutEffect(() => {
    const revealActive = () => {
      const region = runningRef.current;
      const selected = region?.querySelector<HTMLElement>(
        '[data-active="true"]',
      );
      if (!region || !selected) return;
      const tray = region.getBoundingClientRect();
      const item = selected.getBoundingClientRect();
      region.scrollLeft +=
        Math.max(0, item.right - tray.right) +
        Math.min(0, item.left - tray.left);
      region.scrollTop +=
        Math.max(0, item.bottom - tray.bottom) +
        Math.min(0, item.top - tray.top);
    };
    revealActive();
    window.addEventListener("resize", revealActive);
    return () => {
      window.removeEventListener("resize", revealActive);
    };
  }, [activeId, windows.length]);

  useLayoutEffect(() => {
    const updateNotch = () => {
      const nav = root.current;
      const button = launcherRef.current;
      if (nav && button) {
        const navBounds = nav.getBoundingClientRect();
        const buttonBounds = button.getBoundingClientRect();
        setNotchLeft(
          buttonBounds.left - navBounds.left + buttonBounds.width / 2,
        );
      }
    };
    updateNotch();
    window.addEventListener("resize", updateNotch);
    return () => {
      window.removeEventListener("resize", updateNotch);
    };
  }, [windows.length]);

  useLayoutEffect(() => {
    const immediate = reduced || previous.current === expanded;
    previous.current = expanded;
    if (!availableRef.current) return;
    const feel = readMotion(availableRef.current);
    const { duration, ease } = immediate
      ? { duration: reduced ? feel.fast : 0, ease: "linear" }
      : expanded
        ? themedSpring(feel, { bounce: 0.4, duration: 420 })
        : themedEase(feel, { ease: "inOutQuad", duration: 150 });
    const motions: JSAnimation[] = [];
    if (immediate)
      motions.push(
        animate(availableRef.current.querySelectorAll(".caps-app-bar-item"), {
          y: 0,
          scale: 1,
          duration: 0,
        }),
      );
    if (reduced)
      motions.push(
        animate(availableRef.current, { x: 0, scale: 1, duration: 0 }),
      );
    motions.push(
      animate(availableRef.current, {
        opacity: expanded ? 1 : 0,
        x: reduced || expanded ? 0 : -feel.distance * 3,
        scale: reduced || expanded ? 1 : 0.88,
        duration,
        ease,
      }),
    );
    if (expanded && !immediate)
      motions.push(
        animate(availableRef.current.querySelectorAll(".caps-app-bar-item"), {
          y: [8, 0],
          scale: [0.9, 1],
          delay: stagger(feel.stagger * (28 / motionDefaults.stagger)),
          ...themedSpring(feel, { bounce: 0.35, duration: 360 }),
        }),
      );

    return () => {
      motions.forEach((motion) => {
        motion.cancel();
      });
    };
  }, [expanded, reduced]);

  useLayoutEffect(() => {
    const immediate = reduced || previousAction.current === open;
    previousAction.current = open;
    const target = actionRef.current ?? launcherRef.current;
    if (!target) return;
    const feel = readMotion(target);
    const settle = immediate
      ? { duration: reduced ? feel.fast : 0, ease: "linear" }
      : themedSpring(feel, { bounce: 0.35, duration: 320 });
    const motions: JSAnimation[] = [];
    if (actionRef.current && reduced)
      motions.push(animate(actionRef.current, { y: 0, scale: 1, duration: 0 }));
    if (actionRef.current)
      motions.push(
        animate(actionRef.current, {
          opacity: open ? 1 : 0,
          y: reduced || open ? 0 : feel.distance * 3.5,
          scale: reduced || open ? 1 : 0.88,
          ...settle,
        }),
      );
    if (launcherRef.current && !immediate) {
      const squash = themedEase(feel, { ease: "outQuad", duration: 65 });
      const release = themedSpring(feel, { bounce: 0.45, duration: 360 });
      motions.push(
        animate(launcherRef.current, {
          scaleX: [
            { to: 1.07, duration: squash.duration },
            { to: 1, ...release },
          ],
          scaleY: [
            { to: 0.91, duration: squash.duration },
            { to: 1, ...release },
          ],
          y: [
            { to: 2, duration: squash.duration },
            { to: 0, ...release },
          ],
        }),
      );
    }
    if (launcherRef.current && immediate)
      motions.push(
        animate(launcherRef.current, {
          scaleX: 1,
          scaleY: 1,
          y: 0,
          duration: 0,
        }),
      );
    return () => {
      motions.forEach((motion) => {
        motion.cancel();
      });
    };
  }, [open, reduced, hasPrimaryAction]);

  const close = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };
  const select = (onSelect: () => void) => {
    // Restore disclosure focus first, so the host may deliberately focus its app.
    if (expanded) close();
    onSelect();
  };
  const renderItem = (
    item: AppBarItem,
    available: boolean,
    session = false,
  ) => (
    <AppBarItemView
      key={item.id}
      item={item}
      available={available}
      expanded={available ? expanded : true}
      onSelect={() => {
        select(item.onSelect);
      }}
      onClose={() => {
        launcherRef.current?.focus();
        item.onClose?.();
      }}
      launcherLabels={launcherLabels}
      session={session}
    />
  );
  const appBarStyle: AppBarStyle = {
    "--caps-app-bar-notch-left": `${String(notchLeft)}px`,
  };

  const changeOpen = (
    next: boolean,
    details: BasePopover.Root.ChangeEventDetails,
  ) => {
    const target = details.event.target;
    if (
      !next &&
      details.reason === "outside-press" &&
      target instanceof Node &&
      (root.current?.contains(target) ||
        availableRef.current?.contains(target) ||
        actionRef.current?.contains(target))
    ) {
      details.cancel();
      return;
    }
    if (!next && details.reason === "escape-key") close();
    else setOpen(next);
  };

  return (
    <BasePopover.Root open={expanded} onOpenChange={changeOpen} modal={false}>
      <nav
        ref={root}
        style={appBarStyle}
        className="caps-app-bar"
        aria-label="Team Apps and Sessions launcher"
        data-open={expanded ? "true" : "false"}
      >
        <div
          ref={runningRef}
          className="caps-app-bar-region caps-app-bar-items"
          role="group"
          aria-label="Running apps"
          aria-hidden="false"
        >
          {windows.map((item) => renderItem(item, false))}
        </div>
        <div className="caps-app-bar-launcher">
          <button
            ref={launcherRef}
            type="button"
            className="caps-app-bar-launcher-button"
            aria-label={launcher.label}
            title={launcher.label}
            aria-expanded={expanded}
            aria-controls={primaryAction ? actionId : availableId}
            onClick={() => {
              setOpen(!open);
            }}
          >
            <span className="caps-app-bar-mascot" aria-hidden="true">
              {launcher.icon ?? <PanelsTopLeft />}
            </span>
          </button>
        </div>
        {portalContainer ? (
          <BasePopover.Portal container={portalContainer} keepMounted>
            <BasePopover.Positioner
              anchor={root}
              side="bottom"
              align="start"
              sideOffset={4}
              collisionPadding={8}
              collisionBoundary={
                portalContainer === document.body ? undefined : portalContainer
              }
              className="caps-app-bar-positioner"
            >
              <BasePopover.Popup
                initialFocus={false}
                finalFocus={false}
                style={appBarStyle}
                ref={availableRef}
                id={availableId}
                className="caps-app-bar-region caps-app-bar-launchers"
                role="group"
                aria-label="Speed dial"
                aria-hidden={!expanded}
              >
                {launchers.length > 0 ? (
                  <div
                    className="caps-app-bar-section"
                    role="group"
                    aria-label="Team Apps"
                  >
                    <span className="caps-app-bar-section-label">
                      Team Apps
                    </span>
                    <div className="caps-app-bar-app-list">
                      {launchers.map((item) => renderItem(item, true))}
                    </div>
                  </div>
                ) : null}
                {sessions.length > 0 ? (
                  <div
                    className="caps-app-bar-section caps-app-bar-sessions"
                    role="group"
                    aria-label="Recent Sessions"
                  >
                    <span className="caps-app-bar-section-label">
                      Recent Sessions
                    </span>
                    <div className="caps-app-bar-session-list">
                      {sessions.map((item) => renderItem(item, true, true))}
                    </div>
                  </div>
                ) : null}
                {launchers.length === 0 &&
                sessions.length === 0 &&
                emptyLabel ? (
                  <span className="caps-app-bar-empty" role="status">
                    {emptyLabel}
                  </span>
                ) : null}
              </BasePopover.Popup>
            </BasePopover.Positioner>
          </BasePopover.Portal>
        ) : null}
        {primaryAction && portalContainer ? (
          <BasePopover.Root open={open} onOpenChange={changeOpen} modal={false}>
            <BasePopover.Portal container={portalContainer} keepMounted>
              <BasePopover.Positioner
                anchor={launcherRef}
                side="bottom"
                align="end"
                sideOffset={8}
                collisionPadding={8}
                collisionBoundary={
                  portalContainer === document.body
                    ? undefined
                    : portalContainer
                }
                className="caps-app-bar-positioner"
              >
                <BasePopover.Popup initialFocus={false} finalFocus={false}>
                  <button
                    ref={actionRef}
                    id={actionId}
                    type="button"
                    className="caps-app-bar-primary"
                    aria-hidden={!open}
                    tabIndex={open ? 0 : -1}
                    onClick={() => {
                      select(primaryAction.onSelect);
                    }}
                  >
                    <span aria-hidden="true">{primaryAction.icon}</span>
                    {primaryAction.label}
                  </button>
                </BasePopover.Popup>
              </BasePopover.Positioner>
            </BasePopover.Portal>
          </BasePopover.Root>
        ) : null}
      </nav>
    </BasePopover.Root>
  );
}
