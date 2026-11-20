import { useEffect, useMemo, useState } from "react";

export type SelectableCollectionOptions<T> = {
  getKey: (item: T) => string;
  isDisabled?: (item: T) => boolean;
  items: readonly T[];
  /**
   * The row that is active while no enabled row has been chosen, worked out
   * from the enabled rows during render. Without it nothing is active until a
   * row is moved to or pointed at.
   */
  getFallbackKey?: (enabled: readonly T[]) => string | null;
};

export function useSelectableCollection<T>({
  getKey,
  isDisabled = () => false,
  items,
  getFallbackKey,
}: SelectableCollectionOptions<T>) {
  const enabledItems = useMemo(() => {
    const keys = items.map(getKey);
    if (keys.some((key) => !key))
      throw new Error("Selectable items require non-empty keys");
    if (new Set(keys).size !== keys.length)
      throw new Error("Selectable items require unique keys");
    return items.filter((item) => !isDisabled(item));
  }, [getKey, isDisabled, items]);
  const [chosenKey, setActiveKey] = useState<string | null>(null);
  // The active row is decided now, from the rows now: a filter that removes
  // the chosen row hands the lit row over in the same render, so a key pressed
  // at once reads the row the person sees.
  const fallbackKey = getFallbackKey?.(enabledItems) ?? null;
  const activeKey =
    chosenKey !== null &&
    enabledItems.some((item) => getKey(item) === chosenKey)
      ? chosenKey
      : fallbackKey !== null &&
          enabledItems.some((item) => getKey(item) === fallbackKey)
        ? fallbackKey
        : null;
  useEffect(() => {
    if (
      chosenKey !== null &&
      !enabledItems.some((item) => getKey(item) === chosenKey)
    )
      setActiveKey(null);
  }, [chosenKey, enabledItems, getKey]);
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
