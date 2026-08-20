export type TransformType =
  | "none"
  | "mirror_h"
  | "mirror_v"
  | "mirror_both"
  | "rotate"
  | "kaleidoscope"
  | "multi_overlay"
  | "radial_warp"
  | "domain_warp"
  | "spiral"
  | "gallery"
  | "anchor_diverge";

export interface TransformConfig {
  type: TransformType;
  angle?: number;
  segments?: number;
  overlayCount?: number;
  warpStrength?: number;
  center?: [number, number];
  seed?: number;
  spread?: number;
  minAnchorSpacing?: number;
}

export type Point = [number, number];

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function translatePoints(points: Point[], dx: number, dy: number): Point[] {
  return points.map(([x, y]) => [x + dx, y + dy] as Point);
}

export function scalePoints(
  points: Point[],
  scale: number,
  center: Point = [0, 0]
): Point[] {
  const [cx, cy] = center;
  return points.map(([x, y]) => [
    cx + (x - cx) * scale,
    cy + (y - cy) * scale,
  ] as Point);
}

export function rotatePointsAround(
  points: Point[],
  angleDeg: number,
  center: Point = [0, 0]
): Point[] {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const [cx, cy] = center;
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos] as Point;
  });
}

export function mirrorHorizontal(points: Point[]): Point[] {
  return points.map(([x, y]) => [-x, y] as Point);
}

export function mirrorVertical(points: Point[]): Point[] {
  return points.map(([x, y]) => [x, -y] as Point);
}

export function mirrorBoth(points: Point[]): Point[] {
  return points.map(([x, y]) => [-x, -y] as Point);
}

export function rotatePoints(points: Point[], angleDeg: number): Point[] {
  return rotatePointsAround(points, angleDeg);
}

/** Offset base curve away from origin so compositions don't all anchor at (0,0). */
export function offsetFromOrigin(points: Point[], seed: number): Point[] {
  const rng = seededRandom(seed);
  const dx = (rng() - 0.5) * 1.6;
  const dy = (rng() - 0.5) * 1.6;
  return translatePoints(points, dx, dy);
}

export function radialRepeat(points: Point[], count: number, seed = 42): Point[][] {
  const rng = seededRandom(seed);
  const pivot: Point = [(rng() - 0.5) * 1.2, (rng() - 0.5) * 1.2];
  const base = offsetFromOrigin(points, seed);

  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i + (rng() - 0.5) * 12;
    const orbit = 0.15 + rng() * 0.35;
    const placed = translatePoints(base, pivot[0] + orbit * Math.cos((angle * Math.PI) / 180), pivot[1] + orbit * Math.sin((angle * Math.PI) / 180));
    return rotatePointsAround(placed, angle, pivot);
  });
}

export function mirrorComposeHorizontal(points: Point[]): Point[][] {
  const base = offsetFromOrigin(points, 11);
  return [base, mirrorHorizontal(base)];
}

export function mirrorComposeVertical(points: Point[]): Point[][] {
  const base = offsetFromOrigin(points, 13);
  return [base, mirrorVertical(base)];
}

export function mirrorComposeBoth(points: Point[]): Point[][] {
  const base = offsetFromOrigin(points, 17);
  return [base, mirrorHorizontal(base), mirrorVertical(base), mirrorBoth(base)];
}

export function kaleidoscope(points: Point[], segments: number, seed = 42): Point[][] {
  const rng = seededRandom(seed);
  const pivot: Point = [(rng() - 0.5) * 1.4, (rng() - 0.5) * 1.4];
  const base = translatePoints(points, pivot[0] * 0.3, pivot[1] * 0.3);
  const sectorAngle = (2 * Math.PI) / segments;
  const result: Point[][] = [];

  for (let i = 0; i < segments; i++) {
    const baseAngle = i * sectorAngle + (rng() - 0.5) * 0.08;
    const rotated = rotatePointsAround(base, (baseAngle * 180) / Math.PI, pivot);
    result.push(rotated);

    const mirrored = rotated.map(([x, y]) => {
      const dx = x - pivot[0];
      const dy = y - pivot[1];
      const angle = Math.atan2(dy, dx);
      const r = Math.sqrt(dx * dx + dy * dy);
      const local = angle - baseAngle;
      const folded = ((local % sectorAngle) + sectorAngle) % sectorAngle;
      const mirrorAngle =
        folded > sectorAngle / 2 ? sectorAngle - folded : folded;
      const finalAngle = mirrorAngle + baseAngle;
      return [
        pivot[0] + r * Math.cos(finalAngle),
        pivot[1] + r * Math.sin(finalAngle),
      ] as Point;
    });
    result.push(mirrored);
  }

  return result;
}

/**
 * Escher Print Gallery feel: scaled, rotated copies scattered on a spiral,
 * each offset from origin — recursive, dizzying, off-center composition.
 */
export function escherGallery(
  points: Point[],
  count: number,
  seed: number,
  spread = 1
): Point[][] {
  const rng = seededRandom(seed);
  const result: Point[][] = [];

  const baseShiftX = (rng() - 0.5) * 1.2 * spread;
  const baseShiftY = (rng() - 0.5) * 1.2 * spread;
  const base = translatePoints(points, baseShiftX, baseShiftY);

  const golden = Math.PI * (3 - Math.sqrt(5));
  const focusX = (rng() - 0.5) * 0.8 * spread;
  const focusY = (rng() - 0.5) * 0.8 * spread;

  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const spiralAngle = i * golden + rng() * 0.6;
    const radius = (0.2 + t * 1.4 + rng() * 0.25) * spread;

    const px = focusX + Math.cos(spiralAngle) * radius + (rng() - 0.5) * 0.35 * spread;
    const py = focusY + Math.sin(spiralAngle) * radius + (rng() - 0.5) * 0.35 * spread;

    const scale = (0.35 + rng() * 0.45) * (1 - t * 0.25);
    const rotation = (rng() - 0.5) * 70 + t * 180 + i * 8;

    let copy = scalePoints(base, scale);
    copy = rotatePoints(copy, rotation);
    copy = translatePoints(copy, px, py);

    if (i % 3 === 0 && scale > 0.4) {
      const inner = scalePoints(copy, 0.55);
      const innerRot = rotatePoints(inner, rotation * 0.5 + 15);
      result.push(innerRot);
    }

    result.push(copy);
  }

  const warpCorner: Point = [focusX + spread * 0.6, focusY - spread * 0.4];
  const warped = base.map(([x, y]) => {
    const dx = x - warpCorner[0];
    const dy = y - warpCorner[1];
    const r = Math.sqrt(dx * dx + dy * dy) || 0.001;
    const pull = 1 + 0.15 / (1 + r);
    return [warpCorner[0] + dx * pull, warpCorner[1] + dy * pull] as Point;
  });
  result.push(translatePoints(warped, (rng() - 0.5) * 0.5, (rng() - 0.5) * 0.5));

  return result;
}

function curveCentroid(points: Point[]): Point {
  if (points.length === 0) return [0, 0];
  let sx = 0;
  let sy = 0;
  for (const [x, y] of points) {
    sx += x;
    sy += y;
  }
  return [sx / points.length, sy / points.length];
}

/**
 * Relative free space at a position: origin has the most room,
 * points near edges/corners have less — drives curve length.
 */
export function computeSpaceAt(ax: number, ay: number, spread = 1): number {
  const distOrigin = Math.hypot(ax, ay);
  const originFactor = 1 / (1 + distOrigin * 0.85);

  const bound = 1.1 * spread;
  const edgeDist = Math.min(bound - Math.abs(ax), bound - Math.abs(ay));
  const edgeFactor = Math.max(0.15, Math.min(1, edgeDist / bound));

  return originFactor * edgeFactor;
}

function isAnchorTooClose(
  px: number,
  py: number,
  anchors: Point[],
  minSpacing: number
): boolean {
  return anchors.some(([ax, ay]) => Math.hypot(px - ax, py - ay) < minSpacing);
}

function generateAnchors(
  count: number,
  seed: number,
  spread: number,
  minSpacing: number
): Point[] {
  const rng = seededRandom(seed);
  const anchors: Point[] = [[0, 0]];
  const effectiveMin = minSpacing * spread;
  const bounds = 0.9 * spread;
  const maxAttempts = 120;

  for (let i = 1; i < count; i++) {
    let placed = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const px = (rng() - 0.5) * 2 * bounds;
      const py = (rng() - 0.5) * 2 * bounds;

      if (!isAnchorTooClose(px, py, anchors, effectiveMin)) {
        anchors.push([px, py]);
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Relax spacing slightly on repeated failure, but never below 60% of target
      const relaxedMin = effectiveMin * 0.6;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const px = (rng() - 0.5) * 2 * bounds;
        const py = (rng() - 0.5) * 2 * bounds;
        if (!isAnchorTooClose(px, py, anchors, relaxedMin)) {
          anchors.push([px, py]);
          placed = true;
          break;
        }
      }
    }

    // Skip anchor if no valid position — better than overlapping
  }

  return anchors;
}

function spreadAngles(centerDeg: number, sectorDeg: number, count: number): number[] {
  if (count <= 1) return [centerDeg];
  const start = centerDeg - sectorDeg / 2;
  const step = sectorDeg / (count - 1);
  return Array.from({ length: count }, (_, i) => start + step * i);
}

function nearestNeighborAngle(
  ax: number,
  ay: number,
  anchors: Point[],
  selfIndex: number
): { minDist: number; angleDeg: number } {
  let minDist = Infinity;
  let angleDeg = 0;

  for (let i = 0; i < anchors.length; i++) {
    if (i === selfIndex) continue;
    const [ox, oy] = anchors[i];
    const d = Math.hypot(ax - ox, ay - oy);
    if (d < minDist) {
      minDist = d;
      angleDeg = (Math.atan2(oy - ay, ox - ax) * 180) / Math.PI;
    }
  }

  return { minDist, angleDeg };
}

/** Assign ray angles in non-overlapping sectors, pointing away from neighbors. */
function computeRayAngles(
  ax: number,
  ay: number,
  anchorIndex: number,
  anchors: Point[],
  rayCount: number,
  spread: number,
  minSpacing: number
): number[] {
  const isOrigin = Math.hypot(ax, ay) < 0.01;

  if (isOrigin && anchors.length > 1) {
    const angles = anchors
      .filter((_, i) => i !== anchorIndex)
      .map(([x, y]) => Math.atan2(y, x))
      .sort((a, b) => a - b);

    let maxGap = 0;
    let gapMid = 0;
    for (let i = 0; i < angles.length; i++) {
      const cur = angles[i];
      const next = angles[(i + 1) % angles.length];
      const gap = i === angles.length - 1 ? next + 2 * Math.PI - cur : next - cur;
      if (gap > maxGap) {
        maxGap = gap;
        gapMid = cur + gap / 2;
      }
    }
    const sectorDeg = Math.min((maxGap * 180) / Math.PI * 0.8, 150);
    const centerDeg = (gapMid * 180) / Math.PI;
    return spreadAngles(centerDeg, sectorDeg, rayCount);
  }

  const { minDist, angleDeg } = nearestNeighborAngle(ax, ay, anchors, anchorIndex);
  const outward = angleDeg + 180;
  const spacing = minSpacing * spread;
  const sectorDeg = Math.min(100, Math.max(35, (minDist / spacing) * 55));
  return spreadAngles(outward, sectorDeg, rayCount);
}

function crowdFactor(
  ax: number,
  ay: number,
  anchorIndex: number,
  anchors: Point[],
  minSpacing: number,
  spread: number
): number {
  const { minDist } = nearestNeighborAngle(ax, ay, anchors, anchorIndex);
  if (!Number.isFinite(minDist) || minDist === Infinity) return 1;
  return Math.max(0.35, Math.min(1, minDist / (minSpacing * spread * 1.4)));
}

/**
 * Random anchor points; from each, diverge several function curves.
 * Curve length scales with available space at that anchor (origin = longest).
 * Rays are sector-limited; crossing segments are trimmed at render time.
 */
export function anchorDiverge(
  points: Point[],
  anchorCount: number,
  raysPerAnchor: number,
  seed: number,
  spread = 1,
  minAnchorSpacing = 0.5
): Point[][] {
  const centroid = curveCentroid(points);
  const centered = translatePoints(points, -centroid[0], -centroid[1]);
  const anchors = generateAnchors(anchorCount, seed, spread, minAnchorSpacing);
  const result: Point[][] = [];

  anchors.forEach(([ax, ay], anchorIndex) => {
    const space = computeSpaceAt(ax, ay, spread);
    const crowd = crowdFactor(ax, ay, anchorIndex, anchors, minAnchorSpacing, spread);
    const lengthScale = (0.15 + space * 1.1) * spread * crowd;
    const rayCount = Math.max(1, Math.min(raysPerAnchor, Math.ceil(raysPerAnchor * crowd)));
    const angles = computeRayAngles(
      ax,
      ay,
      anchorIndex,
      anchors,
      rayCount,
      spread,
      minAnchorSpacing
    );

    for (const angle of angles) {
      let copy = scalePoints(centered, lengthScale, [0, 0]);
      copy = rotatePointsAround(copy, angle, [0, 0]);
      copy = translatePoints(copy, ax, ay);
      result.push(copy);
    }
  });

  return result;
}

export function radialWarp(
  points: Point[],
  center: [number, number] = [0, 0]
): Point[] {
  const [cx, cy] = center;
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    const theta = Math.atan2(dy, dx);
    const warpedR = r + 0.3 * Math.sin(theta * 5);
    return [cx + warpedR * Math.cos(theta), cy + warpedR * Math.sin(theta)] as Point;
  });
}

export function domainWarpPoints(
  points: Point[],
  strength: number
): Point[] {
  return points.map(([x, y]) => {
    const warp = strength * Math.sin(x * 2);
    return [x + warp * 0.3, y + warp * 0.1] as Point;
  });
}

export function applyTransform(
  points: Point[],
  config: TransformConfig
): Point[][] {
  const seed = config.seed ?? 42;
  const spread = config.spread ?? 1;

  switch (config.type) {
    case "anchor_diverge":
      return anchorDiverge(
        points,
        config.segments ?? 4,
        config.overlayCount ?? 4,
        seed,
        spread,
        config.minAnchorSpacing ?? 0.5
      );
    case "gallery":
      return escherGallery(points, config.segments ?? 10, seed, spread);
    case "mirror_h":
      return mirrorComposeHorizontal(points);
    case "mirror_v":
      return mirrorComposeVertical(points);
    case "mirror_both":
      return mirrorComposeBoth(points);
    case "rotate":
      return radialRepeat(points, config.segments ?? 8, seed);
    case "kaleidoscope":
      return kaleidoscope(points, config.segments ?? 6, seed);
    case "radial_warp":
      return [offsetFromOrigin(points, seed), radialWarp(points, config.center ?? [0, 0])];
    case "domain_warp":
      return [offsetFromOrigin(points, seed), domainWarpPoints(points, config.warpStrength ?? 1)];
    case "multi_overlay":
    case "spiral":
    case "none":
    default:
      return [offsetFromOrigin(points, seed)];
  }
}

export function getTransformLabel(type: TransformType): string {
  const labels: Record<TransformType, string> = {
    none: "仅单线",
    anchor_diverge: "锚点发散",
    gallery: "Escher 画廊",
    mirror_h: "原曲线 + 水平镜像",
    mirror_v: "原曲线 + 垂直镜像",
    mirror_both: "原曲线 + 四向对称",
    rotate: "旋转重复",
    kaleidoscope: "万花筒",
    multi_overlay: "多曲线叠加",
    radial_warp: "径向扭曲",
    domain_warp: "域扭曲",
    spiral: "螺旋展开",
  };
  return labels[type];
}

export const TRANSFORM_OPTIONS: TransformType[] = [
  "anchor_diverge",
  "gallery",
  "kaleidoscope",
  "rotate",
  "mirror_h",
  "mirror_v",
  "mirror_both",
  "multi_overlay",
  "radial_warp",
  "domain_warp",
  "none",
];
