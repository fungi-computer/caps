import type { Motion } from "../lib/motion.js";

/** Scroll layout used to measure the distance from the latest content. */
export type ScrollDirection = "forward" | "reverse";
/** The native geometry needed by the drop, in CSS pixels. */
export type ScrollGeometry = Readonly<{
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
}>;
/** Distance from the visual end; column-reverse ends at scrollTop zero. */
export function distanceToBottom(
  geometry: ScrollGeometry,
  direction: ScrollDirection,
): number {
  return Math.max(
    0,
    direction === "reverse"
      ? -geometry.scrollTop
      : geometry.scrollHeight - geometry.clientHeight - geometry.scrollTop,
  );
}
/** Theme-resolved physics and accessibility settings. */
export type DropTokens = Pick<
  Motion,
  "springDuration" | "bounce" | "stretch" | "fast" | "reduced"
>;
/** Continuous drop state; no DOM or timers are needed to advance it. */
export type DropState = Readonly<{
  phase: "hidden" | "welling" | "resting" | "tugged" | "merging";
  shown: boolean;
  jumped: boolean;
  velocity: number;
  y: number;
  vy: number;
  volume: number;
  vv: number;
  opacity: number;
  unread: number;
  bead: number;
}>;
/** One frame's scroll displacement, end distance, unread count and jump intent. */
export type DropInput = Readonly<{
  distance: number;
  delta: number;
  unread: number;
  jump?: boolean;
}>;
/** A drop starts hidden until its scroller is more than 48px from the end. */
export function createDropState(): DropState {
  return {
    phase: "hidden",
    shown: false,
    jumped: false,
    velocity: 0,
    y: 0,
    vy: 0,
    volume: 0,
    vv: 0,
    opacity: 0,
    unread: 0,
    bead: 0,
  };
}
/** Subtle unread volume, capped at fifteen percent. */
export function unreadVolume(unread: number): number {
  return 1 + Math.min(0.15, 0.06 * Math.log2(1 + Math.max(0, unread)));
}
function spring(
  x: number,
  v: number,
  target: number,
  dt: number,
  omega: number,
  damping: number,
): [number, number] {
  const nextV =
    v + (-omega * omega * (x - target) - 2 * damping * omega * v) * dt;
  return [x + nextV * dt, nextV];
}
/** Advance with bounded substeps so long browser frames cannot destabilize the springs. */
export function stepDrop(
  previous: DropState,
  input: DropInput,
  elapsed: number,
  tokens: DropTokens,
): DropState {
  const state = { ...previous };
  const ms = Math.max(1, Math.min(64, elapsed));
  const merging = input.jump === true || previous.jumped;
  state.jumped = merging;
  if (merging) {
    state.phase = "merging";
    state.shown = false;
    state.unread = 0;
    state.velocity = 0;
  } else {
    if (input.distance > 48) state.shown = true;
    else if (input.distance < 8) state.shown = false;
    state.unread = state.shown ? Math.max(0, input.unread) : 0;
    if (state.unread > previous.unread && state.shown && !tokens.reduced)
      state.bead = 1;
    state.velocity +=
      (input.delta / ms - state.velocity) * (1 - Math.exp(-ms / 50));
  }
  if (!state.shown && previous.phase !== "hidden") state.phase = "merging";
  if (state.shown && !previous.shown) state.phase = "welling";
  const target = state.shown ? unreadVolume(state.unread) : 0;
  if (previous.phase === "hidden" && state.shown) {
    state.phase = "welling";
    state.y = tokens.reduced ? 0 : 5;
  }
  if (tokens.reduced) {
    state.y = 0;
    state.vy = 0;
    state.velocity = 0;
    state.vv = 0;
    state.bead = 0;
    state.volume = unreadVolume(state.unread);
    const fade = ms / Math.max(1, tokens.fast);
    state.opacity = state.shown
      ? Math.min(1, state.opacity + fade)
      : Math.max(0, state.opacity - fade);
  } else {
    const omega = (2 * Math.PI) / Math.max(0.08, tokens.springDuration / 1000);
    const damping = Math.max(0.08, 1 - tokens.bounce);
    const pull = Math.max(-9, Math.min(9, -state.velocity * 7));
    const yTarget = merging ? 12 : state.shown ? pull : 4;
    const steps = Math.ceil(ms / 8);
    for (let n = 0; n < steps; n++) {
      [state.y, state.vy] = spring(
        state.y,
        state.vy,
        yTarget,
        ms / steps / 1000,
        omega,
        damping,
      );
      [state.volume, state.vv] = spring(
        state.volume,
        state.vv,
        target,
        ms / steps / 1000,
        merging ? omega / 1.7 : omega,
        merging ? 1 : damping,
      );
    }
    state.opacity = Math.min(1, Math.max(0, state.volume * 1.4));
    state.bead = Math.max(0, state.bead - ms / 580);
  }
  if (
    !state.shown &&
    (tokens.reduced
      ? state.opacity === 0
      : state.volume < 0.002 && Math.abs(state.vv) < 0.02)
  )
    return createDropState();
  if (
    state.shown &&
    Math.abs(state.volume - target) < 0.001 &&
    Math.abs(state.vv) < 0.01 &&
    Math.abs(state.y) < 0.02 &&
    Math.abs(state.vy) < 0.2 &&
    state.bead === 0
  ) {
    state.phase = "resting";
    state.volume = target;
    state.vv = 0;
    state.y = 0;
    state.vy = 0;
    state.velocity = 0;
  } else if (state.shown && state.volume > 0.95) state.phase = "tugged";
  return state;
}
