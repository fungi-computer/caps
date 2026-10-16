import {
  ArrowLeft,
  ArrowUpRight,
  Columns2,
  Maximize2,
  Minimize2,
  Minus,
  PanelsTopLeft,
  X,
} from "lucide-react";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn.js";
import { IconButton } from "./icon-button.js";
import {
  WindowCommands,
  WindowCrumbs,
  WindowStatuses,
  type WindowStatus,
  type WindowCommand,
  type WindowCrumb,
} from "./window-crumbs.js";

export type {
  WindowCommand,
  WindowCrumb,
  WindowStatus,
} from "./window-crumbs.js";

/** Window presentation only. The host owns geometry, focus order and lifecycle. */
export type WindowFrameProps = HTMLAttributes<HTMLElement> & {
  active?: boolean;
  floating?: boolean;
  /** Shrink a floating panel to its contents, up to the host's max-height. */
  fitContent?: boolean;
};

/** A clipped, rounded shell for either a tiled or floating application. */
export const WindowFrame = forwardRef<HTMLElement, WindowFrameProps>(
  function WindowFrame(
    {
      active = false,
      floating = false,
      fitContent = false,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <section
        {...props}
        ref={ref}
        className={cn("caps-window", className)}
        data-active={active}
        data-floating={floating}
        data-fit-content={fitContent}
      />
    );
  },
);

/** Decorative snap destination. Geometry and visibility belong to the layout owner. */
export function WindowSnapPreview({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("caps-window-snap-preview", className)}
    />
  );
}

/** A host-owned request to go back inside the window's content. */
export type WindowBackAction = {
  /** Accessible name, e.g. "Back in Games". */
  label: string;
  /** Request going back; the host owns the history and the outcome. */
  onBack: () => void;
  /** Tooltip text, e.g. the keyboard route to the same action. */
  hint?: string;
};

/** Supply handleProps only when the title is an interactive layout handle. */
export type WindowHeaderProps = Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children"
> & {
  title: string;
  /** Where the content is now, shown after the title and truncated first. */
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  /** Present only while there is somewhere to go back to. */
  back?: WindowBackAction;
  /**
   * The content's path, shown in place of the title and subtitle. The last
   * crumb is the current place; earlier ones are links, and a crumb with
   * siblings is a switcher.
   */
  crumbs?: readonly WindowCrumb[];
  /** Selected crumb, or the sibling chosen from a switcher crumb. */
  onCrumb?: (crumbId: string, siblingId?: string) => void;
  /** Quiet facts about the view, such as "Valid" or "Saved", with beads. */
  status?: readonly WindowStatus[];
  /** The view's own commands, as buttons before the window controls. */
  primary?: readonly WindowCommand[];
  /** Less common commands, behind a ⋯ menu. */
  menu?: readonly WindowCommand[];
  /** A primary or menu command the person used, by its id. */
  onAction?: (id: string) => void;
  /** Where header menus open; the host's popover layer. */
  popover?: HTMLElement | null;
  /** `compact` is a slim bar for tiled layouts; touch targets keep 44px. */
  density?: "regular" | "compact";
  handleProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "type"
  >;
};

/** The handle, Back and actions are siblings, so presses never start a drag. */
export function WindowHeader({
  title,
  subtitle,
  icon,
  actions,
  back,
  crumbs,
  onCrumb,
  primary,
  menu,
  status,
  onAction,
  popover,
  density = "regular",
  handleProps,
  className,
  ...props
}: WindowHeaderProps) {
  const label = subtitle ? `${title} · ${subtitle}` : title;
  const trail = crumbs !== undefined && crumbs.length > 0;
  const content = trail ? null : (
    <>
      {icon && (
        <span className="caps-window-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="caps-window-name">{title}</span>
      {subtitle && (
        <span className="caps-window-subtitle">
          <span aria-hidden="true">·</span> {subtitle}
        </span>
      )}
    </>
  );
  return (
    <header
      {...props}
      className={cn("caps-window-header", className)}
      data-density={density}
    >
      {back && (
        <IconButton
          className="caps-window-back"
          aria-label={back.label}
          title={back.hint ?? back.label}
          icon={<ArrowLeft />}
          onClick={back.onBack}
        />
      )}
      {trail ? (
        <>
          {icon && (
            <span className="caps-window-icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <WindowCrumbs crumbs={crumbs} popover={popover} onCrumb={onCrumb} />
        </>
      ) : null}
      {handleProps ? (
        <button
          {...handleProps}
          type="button"
          data-caps-window-handle
          className={cn("caps-window-title", handleProps.className)}
          title={label}
          {...(trail ? { "aria-label": label } : {})}
        >
          {content}
        </button>
      ) : (
        <div
          className="caps-window-title"
          title={label}
          {...(trail ? { "aria-hidden": true } : {})}
        >
          {content}
        </div>
      )}
      {status ? <WindowStatuses status={status} /> : null}
      <WindowCommands
        primary={primary}
        menu={menu}
        popover={popover}
        onAction={onAction}
      />
      {actions}
    </header>
  );
}

/** Available callbacks determine available controls; no inert placeholder actions. */
export type WindowActionsProps = {
  title: string;
  floating?: boolean;
  maximized?: boolean;
  /** Request making this window the main tiled window. */
  onPromote?: () => void;
  /** Request switching between floating and tiled placement. */
  onToggleFloating?: () => void;
  /** Request toggling maximized presentation. */
  onToggleMaximize?: () => void;
  /** Request minimizing; the caller owns window visibility. */
  onMinimize?: () => void;
  /** Request closing; the caller owns disposal and removal. */
  onClose?: () => void;
  /** Select a compact game panel for reading on a narrow screen. */
  onSelect?: () => void;
};

/** Consistent icons, ordering and accessible names for host-owned commands. */
export function WindowActions({
  title,
  floating = false,
  maximized = false,
  onPromote,
  onToggleFloating,
  onToggleMaximize,
  onMinimize,
  onClose,
  onSelect,
}: WindowActionsProps) {
  return (
    <div
      className="caps-window-actions"
      role="group"
      aria-label={`${title} window actions`}
    >
      {onSelect && (
        <IconButton
          aria-label={`Show ${title}`}
          title={`Show ${title}`}
          icon={<Maximize2 />}
          onClick={onSelect}
        />
      )}
      {onPromote && (
        <IconButton
          aria-label={`Make ${title} main`}
          title="Make main"
          icon={<ArrowUpRight />}
          onClick={onPromote}
        />
      )}
      {onToggleFloating && (
        <IconButton
          aria-label={`${floating ? "Tile" : "Float"} ${title}`}
          title={floating ? "Tile" : "Float"}
          icon={floating ? <Columns2 /> : <PanelsTopLeft />}
          onClick={onToggleFloating}
        />
      )}
      {onToggleMaximize && (
        <IconButton
          aria-label={`${maximized ? "Restore" : "Zoom"} ${title}`}
          title={maximized ? "Restore" : "Zoom"}
          icon={maximized ? <Minimize2 /> : <Maximize2 />}
          onClick={onToggleMaximize}
        />
      )}
      {onMinimize && (
        <IconButton
          aria-label={`Minimize ${title}`}
          title="Minimize"
          icon={<Minus />}
          onClick={onMinimize}
        />
      )}
      {onClose && (
        <IconButton
          aria-label={`Close ${title}`}
          title="Close"
          tone="destructive"
          icon={<X />}
          onClick={onClose}
        />
      )}
    </div>
  );
}

/** The scrolling region stays inside the shell, beneath a stationary title bar. */
export const WindowBody = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function WindowBody({ className, ...props }, ref) {
  return (
    <div {...props} ref={ref} className={cn("caps-window-body", className)} />
  );
});

/** Reading rhythm for compact game-window blocks and action keys. */
export const GameWindowContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function GameWindowContent({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("caps-game-window-content", className)}
    />
  );
});
