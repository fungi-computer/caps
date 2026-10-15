/** @internal Velocities are signed pixels/ms. Only meaningful speed changes deform the thumb. */
export function scrollImpulse(
  previousVelocity: number,
  velocity: number,
  elapsed: number,
) {
  const acceleration =
    (Math.abs(velocity) - Math.abs(previousVelocity)) / Math.max(16, elapsed);
  if (Math.abs(acceleration) < 0.035) return null;
  const amount = Math.min(0.04, Math.abs(acceleration) * 0.3);
  const stretching = acceleration > 0;
  const direction = Math.sign(velocity || previousVelocity);
  return {
    scaleY: 1 + (stretching ? amount : -amount),
    scaleX: 1 + (stretching ? -amount / 2 : amount / 2),
    origin: (stretching ? direction > 0 : direction < 0)
      ? "center top"
      : "center bottom",
  };
}

/** @internal Wheel/trackpad pressure at an edge compresses toward that edge. */
export function overscrollImpulse(
  position: number,
  maximum: number,
  delta: number,
) {
  if (maximum <= 0 || Math.abs(delta) < 4) return null;
  const top = position <= 0 && delta < 0;
  const bottom = position >= maximum - 1 && delta > 0;
  if (!top && !bottom) return null;
  const amount = Math.min(0.06, (Math.abs(delta) / 120) * 0.06);
  return {
    scaleY: 1 - amount,
    scaleX: 1 + amount / 2,
    origin: top ? "center top" : "center bottom",
  };
}
