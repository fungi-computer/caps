import { ChevronDown, Ellipsis } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button.js";
import { Status, type StatusTone } from "./status.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu.js";
import { IconButton } from "./icon-button.js";

/** One place in the content's path; `siblings` makes it a switcher. */
export type WindowCrumb = {
  id: string;
  label: string;
  /** Other places at this level, offered by a ▾ switcher on the crumb. */
  siblings?: readonly { id: string; label: string }[];
};

/** A command the content offers in the header; the content owns its effect. */
export type WindowCommand = {
  id: string;
  label: string;
  /** Which Caps button a primary command wears; default `outline`. */
  variant?: "primary" | "outline" | "ghost";
  /** A menu item that removes or discards something. */
  tone?: "destructive";
  disabled?: boolean;
};

/** A quiet fact about the view: muted text led by the Caps status bead. */
export type WindowStatus = {
  id: string;
  label: string;
  tone?: Extract<
    StatusTone,
    "neutral" | "info" | "warning" | "success" | "error"
  >;
};

/** The longest path shown whole; longer paths fold the middle into "…". */
const CRUMBS_SHOWN = 4;

function Separator() {
  return (
    <span className="caps-window-crumb-separator" aria-hidden="true">
      ›
    </span>
  );
}

function Crumb({
  crumb,
  current,
  popover,
  onCrumb,
}: {
  crumb: WindowCrumb;
  current: boolean;
  popover?: HTMLElement | null | undefined;
  onCrumb?: ((crumbId: string, siblingId?: string) => void) | undefined;
}) {
  const label = <span className="caps-window-crumb-label">{crumb.label}</span>;
  const common = {
    "data-caps-window-crumb": crumb.id,
    "aria-current": current ? ("page" as const) : undefined,
  };
  if (crumb.siblings?.length) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          {...common}
          className="caps-window-crumb shrink"
          render={<Button size="sm" variant="ghost" />}
          aria-label={`${crumb.label}, switch`}
        >
          {label}
          <ChevronDown aria-hidden="true" className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" container={popover}>
          {crumb.siblings.map((sibling) => (
            <DropdownMenuItem
              key={sibling.id}
              onSelect={() => {
                onCrumb?.(crumb.id, sibling.id);
              }}
            >
              {sibling.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  if (current || onCrumb === undefined)
    return (
      <span {...common} className="caps-window-crumb">
        {label}
      </span>
    );
  return (
    <Button
      {...common}
      size="sm"
      variant="ghost"
      className="caps-window-crumb shrink"
      onClick={() => {
        onCrumb(crumb.id);
      }}
    >
      {label}
    </Button>
  );
}

/** The path as a trail; on a phone only `‹ parent › current` remain. */
export function WindowCrumbs({
  crumbs,
  popover,
  onCrumb,
}: {
  crumbs: readonly WindowCrumb[];
  popover?: HTMLElement | null | undefined;
  onCrumb?: ((crumbId: string, siblingId?: string) => void) | undefined;
}) {
  const folded = crumbs.length > CRUMBS_SHOWN;
  const head = folded ? crumbs.slice(0, 1) : crumbs.slice(0, -1);
  const middle = folded ? crumbs.slice(1, -2) : [];
  const tail = folded ? crumbs.slice(-2) : crumbs.slice(-1);
  const last = crumbs.at(-1);
  const parts: ReactNode[] = [];
  const add = (crumb: WindowCrumb) => {
    parts.push(
      <span
        key={crumb.id}
        className="caps-window-crumb-item"
        data-caps-crumb-position={
          crumb.id === last?.id
            ? "current"
            : crumb.id === crumbs.at(-2)?.id
              ? "parent"
              : "ancestor"
        }
      >
        {parts.length > 0 ? <Separator /> : null}
        <Crumb
          crumb={crumb}
          current={crumb.id === last?.id}
          popover={popover}
          onCrumb={onCrumb}
        />
      </span>,
    );
  };
  for (const crumb of head) add(crumb);
  if (middle.length > 0)
    parts.push(
      <span
        key="fold"
        className="caps-window-crumb-item"
        data-caps-crumb-position="ancestor"
      >
        <Separator />
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            className="caps-window-crumb"
            render={<Button size="sm" variant="ghost" />}
            aria-label="More of the path"
          >
            <Ellipsis aria-hidden="true" className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" container={popover}>
            {middle.map((crumb) => (
              <DropdownMenuItem
                key={crumb.id}
                onSelect={() => {
                  onCrumb?.(crumb.id);
                }}
              >
                {crumb.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </span>,
    );
  for (const crumb of tail) add(crumb);
  return (
    <nav className="caps-window-crumbs" aria-label="Path">
      {parts}
    </nav>
  );
}

/** Primary commands as buttons, the rest behind a ⋯ menu. */
export function WindowCommands({
  primary,
  menu,
  popover,
  onAction,
}: {
  primary?: readonly WindowCommand[] | undefined;
  menu?: readonly WindowCommand[] | undefined;
  popover?: HTMLElement | null | undefined;
  onAction?: ((id: string) => void) | undefined;
}) {
  if (!primary?.length && !menu?.length) return null;
  return (
    <div className="caps-window-commands" role="group" aria-label="Commands">
      {primary?.map((command) => (
        <Button
          key={command.id}
          size="sm"
          variant={command.variant ?? "outline"}
          disabled={command.disabled === true}
          onClick={() => {
            onAction?.(command.id);
          }}
        >
          {command.label}
        </Button>
      ))}
      {menu?.length ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            render={<IconButton icon={<Ellipsis />} aria-label="More" />}
          />
          <DropdownMenuContent align="end" container={popover}>
            {menu.map((command) => (
              <DropdownMenuItem
                key={command.id}
                disabled={command.disabled === true}
                variant={
                  command.tone === "destructive" ? "destructive" : "default"
                }
                onSelect={() => {
                  onAction?.(command.id);
                }}
              >
                {command.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/** Muted state text with the Caps status bead; hidden on a phone. */
export function WindowStatuses({
  status,
}: {
  status: readonly WindowStatus[];
}) {
  if (status.length === 0) return null;
  return (
    <div className="caps-window-statuses" role="group" aria-label="State">
      {status.map((item) => (
        <Status
          key={item.id}
          glyph="dot"
          size="compact"
          tone={item.tone ?? "neutral"}
          label={item.label}
          title={item.label}
          className="caps-window-status"
        />
      ))}
    </div>
  );
}
