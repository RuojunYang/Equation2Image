type Point = [number, number];

export const ANCHOR_EXCLUSION_RADIUS = 0.12;
const COLLISION_MAX_POINTS = 64;

/** Reduce point count for fast collision checks (drawing stays smooth). */
export function decimatePoints(points: Point[], maxPoints = COLLISION_MAX_POINTS): Point[] {
  if (points.length <= maxPoints) return points;
  const result: Point[] = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
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
  for (let k = 0; k < anchors.length; k++) {
    const [ax, ay] = anchors[k];
    if (
      nearAnchor(p1[0], p1[1], [ax, ay], radius) ||
      nearAnchor(p2[0], p2[1], [ax, ay], radius) ||
      nearAnchor(mx, my, [ax, ay], radius)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Walk along the curve and stop at the first intersection with any
 * already-drawn curve (excluding segments near hubs).
 */
export function trimCurveAtFirstCrossing(
  candidate: Point[],
  existing: Point[][],
  hubs: Point[],
  exclusionRadius = ANCHOR_EXCLUSION_RADIUS
): Point[] {
  if (candidate.length < 2 || existing.length === 0) return candidate;

  const sparse = decimatePoints(candidate);
  const existingSparse = existing.map((c) => decimatePoints(c));

  let earliestParam = Infinity;
  let cutSegmentIndex = -1;
  let cutT = 0;

  for (let i = 0; i < sparse.length - 1; i++) {
    if (earliestParam < i) break;

    const a1 = sparse[i];
    const a2 = sparse[i + 1];
    const segLen = Math.hypot(a2[0] - a1[0], a2[1] - a1[1]) || 1;

    if (segmentNearAnyAnchor(a1, a2, hubs, exclusionRadius)) continue;

    for (let e = 0; e < existingSparse.length; e++) {
      const other = existingSparse[e];
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
          cutT = tOnSeg;
        }
      }
    }
  }

  if (cutSegmentIndex < 0 || !Number.isFinite(earliestParam)) return candidate;

  return trimFullCurveAtSparseParam(candidate, sparse, cutSegmentIndex, cutT);
}

function trimFullCurveAtSparseParam(
  full: Point[],
  sparse: Point[],
  cutSegmentIndex: number,
  cutT: number
): Point[] {
  const a1 = sparse[cutSegmentIndex];
  const a2 = sparse[cutSegmentIndex + 1];
  const cutPoint: Point = [
    a1[0] + cutT * (a2[0] - a1[0]),
    a1[1] + cutT * (a2[1] - a1[1]),
  ];

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < full.length; i++) {
    const d = Math.hypot(full[i][0] - cutPoint[0], full[i][1] - cutPoint[1]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }

  const trimmed = full.slice(0, bestIdx + 1);
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

  for (let c = 0; c < curves.length; c++) {
    const curve = curves[c];
    if (curve.length < 2) continue;

    const trimmed = trimCurveAtFirstCrossing(curve, drawn, hubs, exclusionRadius);
    if (trimmed.length < 2 || curveLength(trimmed) < minLength) continue;

    drawn.push(trimmed);
    hubs.push([trimmed[0][0], trimmed[0][1]]);
  }

  return drawn;
}
