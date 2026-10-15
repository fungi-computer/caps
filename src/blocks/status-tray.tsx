import { X } from "lucide-react";
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { IconButton } from "../components/icon-button.js";
import { Popover, PopoverAnchor } from "../components/popover.js";
import {
  Status,
  type StatusGlyph,
  type StatusMotion,
  type StatusTone,
} from "../components/status.js";
import { cn } from "../lib/cn.js";

/**
 * One footer readout and the small tray it opens. Semantic data only: the
 * chip's finish, the tray's material and the seam between them come from
 * theme tokens (`--caps-status-tray-*`), never from a prop.
 */
export type StatusTrayItem = Readonly<{
  id: string;
  /** Short readout, e.g. "Ports". */
  label: ReactNode;
  /** Positive counts render after the label; zero is hidden. */
  count?: number;
  /** A live-state bead before the label. Omit for none. */
  tone?: StatusTone;
  glyph?: StatusGlyph;
  motion?: StatusMotion;
  /** Accessible name when the label alone is ambiguous. */
  accessibleLabel?: string;
  /** Tray heading; defaults to the label. */
  title?: ReactNode;
  /** Tray header actions such as Refresh. */
  actions?: ReactNode;
  /** Tray body. */
  content: ReactNode;
  /** Keep the chip but disable opening, e.g. no Computer. */
  disabled?: boolean;
  /**
   * Controls placed right after this chip, in DOM and keyboard order, so a
   * host can interleave its own controls between chips.
   */
  after?: ReactNode;
}>;

/** Controlled selection and structural slots for a row of footer trays. */
export type StatusTrayProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Readouts and their tray contents in display order. */
  items: readonly StatusTrayItem[];
  /** Which tray is open. The host owns this state. */
  openId: string | null;
  /** Requests a selection change or dismissal. */
  onOpenChange: (id: string | null) => void;
  /** Leading readouts that never open a tray (connection state, etc.). */
  leading?: ReactNode;
  /** Trailing controls after the chips (Send, Expand, …). */
  trailing?: ReactNode;
  /**
   * Structural seat. `housing` sits on the plastic below a screen; `screen`
   * sits inside a Display as flat, screen-native text (the wiki's screen
   * material rule); `host` means a host's own chrome draws the chips, so
   * only the open tray renders here. The look of each seat is theme-owned.
   */
  placement?: "housing" | "screen" | "host";
  /** Which edge the tray aligns to. */
  align?: "start" | "end";
  /**
   * For `host` placement: where the host's trigger starts, in CSS pixels from
   * this tray's inline start, so the open tray sits above it.
   */
  hostInset?: number;
};

/** A footer row of readout chips; one opens its tray above the row at a time. */
export function StatusTray({
  items,
  openId,
  onOpenChange,
  leading,
  trailing,
  placement = "housing",
  align = "end",
  hostInset,
  className,
  ...props
}: StatusTrayProps) {
  const scope = useId();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const open = items.find((item) => item.id === openId && !item.disabled);
  const activeId = open?.id;
  const close = () => {
    if (activeId) triggers.current.get(activeId)?.focus();
    onOpenChange(null);
  };
  useEffect(() => {
    if (activeId) panel.current?.focus();
  }, [activeId]);
  useEffect(() => {
    // A dynamic position is a custom property; the stylesheet clamps it.
    if (hostInset === undefined)
      root.current?.style.removeProperty("--caps-status-tray-host-inset");
    else
      root.current?.style.setProperty(
        "--caps-status-tray-host-inset",
        `${String(Math.max(0, hostInset))}px`,
      );
  }, [hostInset]);
  useEffect(() => {
    if (!activeId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      triggers.current.get(activeId)?.focus();
      onOpenChange(null);
    };
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        onOpenChange(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [activeId, onOpenChange]);
  return (
    <PopoverAnchor
      {...props}
      ref={root}
      className={cn("caps-status-tray", className)}
      data-placement={placement}
      data-align={align}
    >
      {open ? (
        <Popover
          open
          ref={panel}
          tabIndex={-1}
          side="top"
          id={`${scope}-${open.id}`}
          role="dialog"
          aria-labelledby={`${scope}-title`}
          className="caps-status-tray-panel"
          data-status-tray-panel={open.id}
        >
          <div className="caps-status-tray-head">
            {open.tone ? (
              <Status
                size="compact"
                tone={open.tone}
                glyph={open.glyph ?? "dot"}
              />
            ) : null}
            <span id={`${scope}-title`} className="caps-status-tray-title">
              {open.title ?? open.label}
            </span>
            {open.actions}
            <IconButton
              aria-label="Close tray"
              icon={<X aria-hidden="true" />}
              onClick={close}
            />
          </div>
          <div className="caps-status-tray-body">{open.content}</div>
        </Popover>
      ) : null}
      {placement === "host" ? null : (
        <div className="caps-status-tray-row">
          {leading}
          <div className="caps-status-tray-chips">
            {items.map((item) => (
              <Fragment key={item.id}>
                <button
                  ref={(node) => {
                    if (node) triggers.current.set(item.id, node);
                    else triggers.current.delete(item.id);
                  }}
                  type="button"
                  className="caps-status-tray-chip"
                  aria-expanded={activeId === item.id}
                  aria-controls={
                    activeId === item.id ? `${scope}-${item.id}` : undefined
                  }
                  aria-label={item.accessibleLabel}
                  disabled={item.disabled}
                  title={item.disabled ? item.accessibleLabel : undefined}
                  aria-haspopup="dialog"
                  data-status-tray-chip={item.id}
                  onClick={() => {
                    onOpenChange(openId === item.id ? null : item.id);
                  }}
                >
                  {item.tone ? (
                    <Status
                      size="compact"
                      glyph={item.glyph ?? "dot"}
                      motion={item.motion ?? "none"}
                      tone={item.tone}
                    />
                  ) : null}
                  <span className="caps-status-tray-label">{item.label}</span>
                  {item.count !== undefined && item.count > 0 ? (
                    <span className="caps-status-tray-count">{item.count}</span>
                  ) : null}
                </button>
                {item.after}
              </Fragment>
            ))}
          </div>
          {trailing}
        </div>
      )}
    </PopoverAnchor>
  );
}

/** A group of tray rows. Precede it with a DataListHeading to label it. */
export function StatusTrayList({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("caps-status-tray-list", className)}>
      {children}
    </div>
  );
}

/**
 * One line: the host's icon, a title, a muted detail that truncates, and a
 * quiet text action (a ghost Button) at the end.
 */
export function StatusTrayRow({
  icon,
  primary,
  secondary,
  actions,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** The App's own icon for this kind of row, e.g. a Sigil or a Status. */
  icon?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div {...props} className={cn("caps-status-tray-item", className)}>
      {icon ? <span className="caps-status-tray-icon">{icon}</span> : null}
      <span className="caps-status-tray-text">
        <span className="caps-status-tray-primary">{primary}</span>
        {secondary ? (
          <span className="caps-status-tray-secondary">{secondary}</span>
        ) : null}
      </span>
      {actions ? (
        <span className="caps-status-tray-actions">{actions}</span>
      ) : null}
    </div>
  );
}

/**
 * A quiet sentence for an empty or unavailable feed. Empty reads "All caught
 * up." unless the host says otherwise; unavailable takes a `title`.
 */
export function StatusTrayNote({
  children = "All caught up.",
  title,
}: {
  children?: ReactNode;
  title?: string;
}) {
  return (
    <div className="caps-status-tray-note">
      {title ? (
        <strong className="caps-status-tray-note-title">{title}</strong>
      ) : null}
      <p>{children}</p>
    </div>
  );
}
