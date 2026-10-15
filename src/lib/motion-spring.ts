import { spring, steps, type EasingParam } from "animejs";

import {
  motionBounce,
  motionSpringTime,
  motionTime,
  type Motion,
} from "./motion.js";

/** Anime.js timing for one tween or segment. */
export type MotionTiming = Readonly<{ ease: EasingParam; duration: number }>;

/** Timing for a change that must land at once. */
export const immediateTiming: MotionTiming = Object.freeze({
  ease: "linear",
  duration: 0,
});

/** A component's own spring, as authored for today's default feel. */
export type AuthoredSpring = Readonly<{ bounce: number; duration: number }>;

/**
 * Anime.js timing for an authored spring, in the theme's feel: bounce and
 * settle time scale with `--stipe-motion-bounce` and
 * `--stipe-motion-spring-duration`, and a stepped theme moves in
 * `--stipe-motion-steps` discrete steps instead. Today's themes reproduce the
 * authored spring exactly.
 */
export function themedSpring(
  motion: Motion,
  authored: AuthoredSpring,
): MotionTiming {
  const duration = motionSpringTime(motion, authored.duration);
  if (duration <= 0) return immediateTiming;
  if (motion.steps > 0) return { ease: steps(motion.steps), duration };
  return {
    ease: spring({ bounce: motionBounce(motion, authored.bounce), duration }),
    duration,
  };
}

/**
 * Anime.js timing for an authored eased segment: the duration scales with the
 * theme's tempo, and a stepped theme replaces the curve with steps.
 */
export function themedEase(
  motion: Motion,
  authored: MotionTiming,
): MotionTiming {
  const duration = motionTime(motion, authored.duration);
  return {
    ease: motion.steps > 0 ? steps(motion.steps) : authored.ease,
    duration,
  };
}
