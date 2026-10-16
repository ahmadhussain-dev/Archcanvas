// Plan layout shared by the 3D stairs, the floor opening above them and the
// 2D symbol, so all three put the stairs in the same place.

/**
 * L-shaped stairs are built around their first flight, with the second
 * flight running off to one side (left when mirrored). The stairs' x, z is
 * the centre of the whole L, as drawn on the 2D plan, so the flights shift
 * by this much along the stairs' own x axis.
 */
export function lShapeOffsetX(stairs, width, depth) {
  const runAfterCorner = Math.max(0.2, Number(stairs.runAfterCorner ?? (depth - width)));
  return (stairs.mirrored ? 1 : -1) * runAfterCorner / 2;
}
