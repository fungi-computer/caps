import type { MaosaicoItemBinding } from "@fungi.computer/maosaico";
import { animate } from "animejs";
import { useLayoutEffect, useRef } from "react";
import { readMotion } from "../src/lib/motion.js";

/** Workbench adapter: Maosaico computes rectangles; Anime presents their changes. */
export function useWindowMotion(
  binding: MaosaicoItemBinding,
  interacting: boolean,
) {
  const element = useRef<HTMLElement>(null);
  const placed = useRef(false);
  const { x, y, width, height } = binding.frame;
  const stackingStyle = binding.stackingStyle;
  useLayoutEffect(() => {
    if (element.current) Object.assign(element.current.style, stackingStyle);
  }, [stackingStyle]);
  useLayoutEffect(() => {
    if (!element.current || !binding.visible) return;
    const timing = readMotion(element.current);
    const motion = animate(element.current, {
      x,
      y,
      width,
      height,
      duration:
        !placed.current || interacting || timing.reduced ? 0 : timing.normal,
      ease: "outQuad",
    });
    placed.current = true;
    return () => {
      motion.cancel();
    };
  }, [x, y, width, height, binding.visible, interacting]);
  return element;
}
