import {
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useId,
  useState,
} from "react";

import { cn } from "../lib/cn.js";

type TabsContextValue = {
  onValueChange: (value: string) => void;
  panelId: (value: string) => string;
  selectedValue: string | undefined;
  tabId: (value: string) => string;
};

const TabsContext = createContext<null | TabsContextValue>(null);

/** Props accepted by Tabs. */
export type TabsProps = {
  children: ReactNode;
  defaultValue?: string;
  /** Called after the active tab value changes. */
  onValueChange?: (value: string) => void;
  value?: string;
} & HTMLAttributes<HTMLDivElement>;

/** A tab-list controller with explicit controlled or uncontrolled value state. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { children, defaultValue, onValueChange, value: controlledValue, ...props },
  ref,
) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = controlledValue ?? uncontrolledValue;
  const rootId = useId();
  const setValue = (next: string) => {
    if (controlledValue === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  };
  const idFor = (prefix: string, value: string) =>
    `${rootId}-${prefix}-${encodeURIComponent(value)}`;

  return (
    <TabsContext.Provider
      value={{
        onValueChange: setValue,
        panelId: (value) => idFor("panel", value),
        selectedValue,
        tabId: (value) => idFor("tab", value),
      }}
    >
      <div {...props} className={cn("w-full", props.className)} ref={ref}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs parts must be used inside <Tabs>");
  return context;
}

/** Supported tab-list presentations. */
export type TabsListVariant = "bordered" | "segmented";

/** Props accepted by TabsList. */
export type TabsListProps = {
  /**
   * `bordered` underlines the selected tab. `segmented` presents a small set
   * of equal, mutually exclusive choices as one inset control.
   */
  variant?: TabsListVariant;
} & HTMLAttributes<HTMLDivElement>;

/** The tab-list layout for a Tabs controller. */
export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  function TabsList({ className, variant = "bordered", ...props }, ref) {
    return (
      <div
        {...props}
        aria-orientation={props["aria-orientation"] ?? "horizontal"}
        className={cn(
          variant === "segmented"
            ? "tabs caps-tabs-segmented w-full"
            : "tabs tabs-border flex w-full items-center gap-xs",
          className,
        )}
        data-variant={variant}
        ref={ref}
        role="tablist"
      />
    );
  },
);

/** Props accepted by TabsTrigger. */
export type TabsTriggerProps = {
  value: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/** A selectable tab in a Tabs controller. */
export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger(
    { className, disabled, onClick, onKeyDown, value, ...props },
    ref,
  ) {
    const tabs = useTabsContext();
    const selected = tabs.selectedValue === value;

    const focusTab = (event: KeyboardEvent<HTMLButtonElement>) => {
      const list = event.currentTarget.closest('[role="tablist"]');
      if (!(list instanceof HTMLElement)) return;
      const tabsInList = Array.from(
        list.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
      ).filter(
        (tab) => !tab.disabled && tab.getAttribute("aria-disabled") !== "true",
      );
      const currentIndex = tabsInList.indexOf(event.currentTarget);
      if (currentIndex < 0 || tabsInList.length === 0) return;
      let nextIndex: number;
      if (event.key === "ArrowRight")
        nextIndex = (currentIndex + 1) % tabsInList.length;
      else if (event.key === "ArrowLeft")
        nextIndex = (currentIndex - 1 + tabsInList.length) % tabsInList.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabsInList.length - 1;
      else return;
      event.preventDefault();
      const next = tabsInList[nextIndex];
      next?.focus();
      if (next) tabs.onValueChange(next.dataset.tabValue ?? value);
    };

    return (
      <button
        {...props}
        aria-controls={tabs.panelId(value)}
        aria-disabled={disabled ? true : undefined}
        aria-selected={selected}
        className={cn(
          "tab whitespace-nowrap text-base-content transition-colors focus-visible:outline-none focus-visible:ring-2 caps-focus-color",
          selected && "tab-active",
          className,
        )}
        data-tab-value={value}
        disabled={disabled}
        id={tabs.tabId(value)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && !disabled) tabs.onValueChange(value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (!event.defaultPrevented) focusTab(event);
        }}
        ref={ref}
        role="tab"
        tabIndex={disabled ? -1 : selected ? 0 : -1}
        type={props.type ?? "button"}
      />
    );
  },
);

/** Props accepted by TabsContent. */
export type TabsContentProps = {
  children: ReactNode;
  forceMount?: boolean;
  value: string;
} & HTMLAttributes<HTMLDivElement>;

/** The content panel associated with a Tabs value. */
export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent(
    { children, className, forceMount = false, value, ...props },
    ref,
  ) {
    const tabs = useTabsContext();
    const selected = tabs.selectedValue === value;
    if (!selected && !forceMount) return null;
    return (
      <div
        {...props}
        aria-labelledby={tabs.tabId(value)}
        className={cn("mt-md focus-visible:outline-none", className)}
        hidden={!selected}
        id={tabs.panelId(value)}
        ref={ref}
        role="tabpanel"
        tabIndex={0}
      >
        {children}
      </div>
    );
  },
);
