import type { KeyboardEvent } from "react";
import * as z from "zod/mini";

// Some browsers clear isComposing before dispatching the confirmation key.
const compositionConfirmation = z.object({ keyCode: z.literal(229) });

/** Native composition, including confirmation events whose flag is already false. */
export function isImeComposing(
  event: Pick<KeyboardEvent, "nativeEvent">,
): boolean {
  return (
    event.nativeEvent.isComposing ||
    z.safeParse(compositionConfirmation, event.nativeEvent).success
  );
}
