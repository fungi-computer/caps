import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in a browser, `useEffect` where there is no document. React
 * warns that a layout effect does nothing during server rendering; an effect
 * that never runs there is the same behavior without the warning.
 */
export const useIsomorphicLayoutEffect =
  "document" in globalThis ? useLayoutEffect : useEffect;
