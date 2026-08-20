type Point = [number, number];

export const ANCHOR_EXCLUSION_RADIUS = 0.12;

function orient(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): number {
  return (cy - ay) * (bx - ax) - (cx - ax) * (by - ay);
}

function onSegment(px: number, py: number, qx: number, qy: number, rx: number, ry: number): boolean {
  return (
    Math.min(px, qx) <= rx &&
    rx <= Math.max(px, qx) &&
    Math.min(py, qy) <= ry &&
    ry <= Math.max(py, qy)
  );
}

function segmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const o1 = orient(a1[0], a1[1], a2[0], a2[1], b1[0], b1[1]);
  const o2 = orient(a1[0], a1[1], a2[0], a2[1], b2[0], b2[1]);
  const o3 = orient(b1[0], b1[1], b2[0], b2[1], a1[0], a1[1]);
  const o4 = orient(b1[0], b1[1], b2[0], b2[1], a2[0], a2[1]);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a1[0], a1[1], a2[0], a2[1], b1[0], b1[1])) return true;
  if (o2 === 0 && onSegment(a1[0], a1[1], a2[0], a2[1], b2[0], b2[1])) return true;
  if (o3 === 0 && onSegment(b1[0], b1[1], b2[0], b2[1], a1[0], a1[1])) return true;
  if (o4 === 0 && onSegment(b1[0], b1[1], b2[0], b2[1], a2[0], a2[1])) return true;
  return false;
}

function nearAnchor(x: number, y: number, anchor: Point, radius: number): boolean {
  return Math.hypot(x - anchor[0], y - anchor[1]) < radius;
}

function segmentNearAnyAnchor(
  p1: Point,
  p2: Point,
  anchors: Point[],
  radius: number
): boolean {
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  return anchors.some(
    ([ax, ay]) =>
      nearAnchor(p1[0], p1[1], [ax, ay], radius) ||
      nearAnchor(p2[0], p2[1], [ax, ay], radius) ||
      nearAnchor(mx, my, [ax, ay], radius)
  );
}

/** Check if two polylines cross (ignoring segments near anchor hubs). */
export function curvesCross(
  curveA: Point[],
  curveB: Point[],
  anchors: Point[],
  exclusionRadius = ANCHOR_EXCLUSION_RADIUS,
  step = 3
): boolean {
  for (let i = 0; i < curveA.length - 1; i += step) {
    const a1 = curveA[i];
    const a2 = curveA[Math.min(i + 1, curveA.length - 1)];

    for (let j = 0; j < curveB.length - 1; j += step) {
      const b1 = curveB[j];
      const b2 = curveB[Math.min(j + 1, curveB.length - 1)];

      if (segmentNearAnyAnchor(a1, a2, anchors, exclusionRadius)) continue;
      if (segmentNearAnyAnchor(b1, b2, anchors, exclusionRadius)) continue;

      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

export function crossesExisting(
  candidate: Point[],
  existing: Point[][],
  anchors: Point[],
  exclusionRadius = ANCHOR_EXCLUSION_RADIUS
): boolean {
  for (const other of existing) {
    if (curvesCross(candidate, other, anchors, exclusionRadius)) return true;
  }
  return false;
}
