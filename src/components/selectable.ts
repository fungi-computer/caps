import { useEffect, useMemo, useState } from "react";

export type SelectableCollectionOptions<T> = {
  getKey: (item: T) => string;
  isDisabled?: (item: T) => boolean;
  items: readonly T[];
};

export function useSelectableCollection<T>({
  getKey,
  isDisabled = () => false,
  items,
}: SelectableCollectionOptions<T>) {
  const enabledItems = useMemo(() => {
    const keys = items.map(getKey);
    if (keys.some((key) => !key))
      throw new Error("Selectable items require non-empty keys");
    if (new Set(keys).size !== keys.length)
      throw new Error("Selectable items require unique keys");
    return items.filter((item) => !isDisabled(item));
  }, [getKey, isDisabled, items]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  useEffect(() => {
    if (
      activeKey !== null &&
      !enabledItems.some((item) => getKey(item) === activeKey)
    )
      setActiveKey(null);
  }, [activeKey, enabledItems, getKey]);
  const activeItem = enabledItems.find((item) => getKey(item) === activeKey);
  const activeIndex = activeItem
    ? enabledItems.findIndex((item) => getKey(item) === activeKey)
    : -1;

  const move = (direction: 1 | -1, edge?: "start" | "end") => {
    if (enabledItems.length === 0) return;
    const nextIndex = edge
      ? edge === "start"
        ? 0
        : enabledItems.length - 1
      : activeIndex < 0
        ? direction > 0
          ? 0
          : enabledItems.length - 1
        : (activeIndex + direction + enabledItems.length) % enabledItems.length;
    const next = enabledItems[nextIndex];
    if (next) setActiveKey(getKey(next));
  };

  return {
    activeIndex,
    activeItem,
    activeKey,
    enabledItems,
    move,
    setActiveKey,
  };
}
