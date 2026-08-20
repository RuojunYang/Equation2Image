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

/** Return exact intersection point of two segments, or null. */
function segmentIntersectionPoint(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
  const x1 = a1[0];
  const y1 = a1[1];
  const x2 = a2[0];
  const y2 = a2[1];
  const x3 = b1[0];
  const y3 = b1[1];
  const x4 = b2[0];
  const y4 = b2[1];

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-12) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
  }
  return null;
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

/**
 * Like drawing with a pen: walk along the curve and stop at the first
 * intersection with any already-drawn curve (excluding segments near hubs).
 */
export function trimCurveAtFirstCrossing(
  candidate: Point[],
  existing: Point[][],
  hubs: Point[],
  exclusionRadius = ANCHOR_EXCLUSION_RADIUS
): Point[] {
  if (candidate.length < 2 || existing.length === 0) return candidate;

  let earliestParam = Infinity;
  let cutSegmentIndex = -1;
  let cutPoint: Point | null = null;

  for (let i = 0; i < candidate.length - 1; i++) {
    const a1 = candidate[i];
    const a2 = candidate[i + 1];
    const segLen = Math.hypot(a2[0] - a1[0], a2[1] - a1[1]) || 1;

    if (segmentNearAnyAnchor(a1, a2, hubs, exclusionRadius)) continue;

    for (const other of existing) {
      for (let j = 0; j < other.length - 1; j++) {
        const b1 = other[j];
        const b2 = other[j + 1];

        if (segmentNearAnyAnchor(b1, b2, hubs, exclusionRadius)) continue;

        const pt = segmentIntersectionPoint(a1, a2, b1, b2);
        if (!pt) continue;

        const tOnSeg = Math.hypot(pt[0] - a1[0], pt[1] - a1[1]) / segLen;
        const param = i + tOnSeg;

        if (param < earliestParam) {
          earliestParam = param;
          cutSegmentIndex = i;
          cutPoint = pt;
        }
      }
    }
  }

  if (!cutPoint || cutSegmentIndex < 0) return candidate;

  const trimmed = candidate.slice(0, cutSegmentIndex + 1);
  trimmed.push(cutPoint);
  return trimmed;
}

export function curveLength(points: Point[]): number {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
  }
  return len;
}

/** Sequentially trim curves like pen-on-paper drawing order. */
export function trimCurvesLikeDrawing(
  curves: Point[][],
  exclusionRadius = ANCHOR_EXCLUSION_RADIUS,
  minLength = 0.02
): Point[][] {
  const drawn: Point[][] = [];
  const hubs: Point[] = [];

  for (const curve of curves) {
    if (curve.length < 2) continue;

    const trimmed = trimCurveAtFirstCrossing(curve, drawn, hubs, exclusionRadius);
    if (trimmed.length < 2 || curveLength(trimmed) < minLength) continue;

    drawn.push(trimmed);
    hubs.push([trimmed[0][0], trimmed[0][1]]);
  }

  return drawn;
}
