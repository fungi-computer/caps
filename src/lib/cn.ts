import { STIPE_SPACING_NAMES } from "@fungi.computer/stipe";
import { cva } from "class-variance-authority";
import { createCn } from "cn/config";

/** A conditional class value accepted by cn. */
export type { ClassValue } from "cn";
export { cva };

/** Merge conditional classes with Tailwind rules and Stipe's named spacing. */
export const cn = createCn({
  extend: { theme: { spacing: [...STIPE_SPACING_NAMES] } },
});

/** Resolve a typed React class-name prop before merging its classes. */
export function resolveClassName<State>(
  className: string | ((state: State) => string | undefined) | undefined,
  state: State,
): string | undefined {
  return typeof className === "function" ? className(state) : className;
}
