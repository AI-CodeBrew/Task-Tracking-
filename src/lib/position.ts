// Fractional-indexing helper: computes a position value that sorts strictly
// between two existing positions, so a dropped card only needs its own row
// updated instead of re-writing every sibling's position.
export function positionBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return 0;
  if (before === undefined) return after! - 1;
  if (after === undefined) return before + 1;
  return (before + after) / 2;
}
