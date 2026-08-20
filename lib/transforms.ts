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
  | "spiral";

export interface TransformConfig {
  type: TransformType;
  angle?: number;
  segments?: number;
  overlayCount?: number;
  warpStrength?: number;
  center?: [number, number];
}

export type Point = [number, number];

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
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos] as Point);
}

export function kaleidoscope(points: Point[], segments: number): Point[][] {
  const sectorAngle = (2 * Math.PI) / segments;
  const result: Point[][] = [];

  for (let i = 0; i < segments; i++) {
    const baseAngle = i * sectorAngle;
    const rotated = rotatePoints(points, (baseAngle * 180) / Math.PI);
    result.push(rotated);

    const mirrored = rotated.map(([x, y]) => {
      const angle = Math.atan2(y, x);
      const r = Math.sqrt(x * x + y * y);
      const folded = angle % sectorAngle;
      const mirrorAngle =
        folded > sectorAngle / 2 ? sectorAngle - folded : folded;
      return [r * Math.cos(mirrorAngle + baseAngle), r * Math.sin(mirrorAngle + baseAngle)] as Point;
    });
    result.push(mirrored);
  }

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
): Point[] | Point[][] {
  switch (config.type) {
    case "mirror_h":
      return mirrorHorizontal(points);
    case "mirror_v":
      return mirrorVertical(points);
    case "mirror_both":
      return mirrorBoth(points);
    case "rotate":
      return rotatePoints(points, config.angle ?? 45);
    case "kaleidoscope":
      return kaleidoscope(points, config.segments ?? 6);
    case "radial_warp":
      return radialWarp(points, config.center ?? [0, 0]);
    case "domain_warp":
      return domainWarpPoints(points, config.warpStrength ?? 1);
    case "multi_overlay":
    case "spiral":
    case "none":
    default:
      return points;
  }
}

export function getTransformLabel(type: TransformType): string {
  const labels: Record<TransformType, string> = {
    none: "无变换",
    mirror_h: "水平镜像",
    mirror_v: "垂直镜像",
    mirror_both: "中心对称",
    rotate: "旋转",
    kaleidoscope: "万花筒",
    multi_overlay: "多曲线叠加",
    radial_warp: "径向扭曲",
    domain_warp: "域扭曲",
    spiral: "螺旋展开",
  };
  return labels[type];
}

export const TRANSFORM_OPTIONS: TransformType[] = [
  "none",
  "mirror_h",
  "mirror_v",
  "mirror_both",
  "rotate",
  "kaleidoscope",
  "multi_overlay",
  "radial_warp",
  "domain_warp",
];
