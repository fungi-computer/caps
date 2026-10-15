/**
 * A stable 32-bit FNV-1a hash: the same seed always lands on the same value,
 * and short, similar seeds spread apart. Used to pick a deterministic tone,
 * color, or pattern from an identity (a name, an Agent id) without state.
 */
export function seedHash(seed: string): number {
  let hash = 0x811c9dc5;
  for (const unit of seed) {
    hash ^= unit.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}
