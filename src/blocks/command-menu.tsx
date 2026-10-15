import {
  forwardRef,
  useEffect,
  useId,
  useCallback,
  useImperativeHandle,
  useRef,
  type HTMLAttributes,
} from "react";
import { useGlide } from "../lib/glide.js";
import { useSelectableCollection } from "../components/selectable.js";

/** Caller-provided command menu item data. */
export type CommandMenuItem = {
  description?: string;
  disabled?: boolean;
  id: string;
  label: string;
  /** Key hint shown before the label, e.g. `z` in a which-key list. */
  shortcut?: string;
};

/** Props accepted by CommandMenu. */
export type CommandMenuProps = Omit<
  HTMLAttributes<HTMLUListElement>,
  "children" | "onSelect"
> & {
  items: readonly CommandMenuItem[];
  /** Called after a non-disabled item is selected. */
  onSelect: (id: string) => void;
  /** Caller-owned selected state; distinct from local keyboard focus. */
  selected?: string;
};

/** A single-focus listbox with local navigation and caller-owned selection. */
export const CommandMenu = forwardRef<HTMLUListElement, CommandMenuProps>(
  function CommandMenu(
    { className, items, onKeyDown, onSelect, selected, ...props },
    ref,
  ) {
    const instanceId = useId();
    const list = useRef<HTMLUListElement | null>(null);
    useImperativeHandle<HTMLUListElement | null, HTMLUListElement | null>(
      ref,
      () => list.current,
    );
    const glide = useGlide('[role="option"][data-active]');
    const attach = useCallback(
      (node: HTMLUListElement | null) => {
        list.current = node;
        glide(node);
      },
      [glide],
    );
    const collection = useSelectableCollection({
      getKey: (item) => item.id,
      isDisabled: (item) => item.disabled === true,
      items,
    });
    const { activeKey: activeId, enabledItems: enabled } = collection;
    useEffect(() => {
      if (activeId && enabled.some((item) => item.id === activeId)) return;
      collection.setActiveKey(
        selected && enabled.some((item) => item.id === selected)
          ? selected
          : (enabled[0]?.id ?? null),
      );
    }, [activeId, collection.setActiveKey, enabled, selected]);
    const optionId = (id: string) =>
      `${instanceId}-option-${encodeURIComponent(id)}`;
    return (
      <ul
        {...props}
        ref={attach}
        aria-activedescendant={activeId ? optionId(activeId) : undefined}
        className={[
          "menu max-h-56 overflow-y-auto rounded-none bg-base-100 shadow-lg",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || !enabled.length) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            collection.move(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            collection.move(-1);
          } else if (event.key === "Home") {
            event.preventDefault();
            collection.move(-1, "start");
          } else if (event.key === "End") {
            event.preventDefault();
            collection.move(1, "end");
          } else if ((event.key === "Enter" || event.key === " ") && activeId) {
            event.preventDefault();
            onSelect(activeId);
          }
        }}
        role="listbox"
        tabIndex={0}
      >
        {items.map((item) => (
          <li key={item.id} role="none">
            <div
              aria-disabled={item.disabled === true ? true : undefined}
              aria-selected={selected === item.id}
              data-active={activeId === item.id || undefined}
              className={[
                "flex w-full items-center gap-sm px-md py-xs text-left text-xs",
                activeId === item.id
                  ? "bg-base-300 text-base-content"
                  : "text-base-content",
                item.disabled
                  ? "cursor-not-allowed bg-[var(--stipe-surface)] text-base-content outline outline-1 outline-dashed outline-base-300"
                  : "cursor-pointer",
              ].join(" ")}
              aria-keyshortcuts={item.shortcut}
              data-search-option={item.id}
              id={optionId(item.id)}
              onClick={() => {
                if (!item.disabled) onSelect(item.id);
              }}
              role="option"
            >
              {item.shortcut ? (
                <kbd className="kbd kbd-sm min-w-6 shrink-0">
                  {item.shortcut}
                </kbd>
              ) : null}
              <span className="flex-1 truncate">{item.label}</span>
              {item.description ? (
                <span className="text-xs text-base-content">
                  {item.description}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );
  },
);
