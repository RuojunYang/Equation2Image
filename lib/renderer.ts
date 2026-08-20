import { applyTransform, Point, TransformConfig } from "./transforms";

export const CANVAS_SIZE = 512;
const LINE_WIDTH = 2.5;
const PADDING = 40;

export interface RenderOptions {
  backgroundColor?: string;
  lineColor?: string;
  lineWidth?: number;
}

function filterValidPoints(points: Point[]): Point[] {
  return points.filter(
    (p) =>
      Array.isArray(p) &&
      p.length >= 2 &&
      Number.isFinite(p[0]) &&
      Number.isFinite(p[1])
  );
}

function computeBounds(points: Point[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  return { minX, maxX, minY, maxY };
}

function toCanvasCoords(
  x: number,
  y: number,
  size: number
): [number, number] {
  const drawSize = size - PADDING * 2;
  const px = PADDING + ((x + 1) / 2) * drawSize;
  const py = PADDING + ((1 - y) / 2) * drawSize;
  return [px, py];
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  size: number
) {
  if (points.length < 2) return;

  ctx.beginPath();
  const [startX, startY] = toCanvasCoords(points[0][0], points[0][1], size);
  ctx.moveTo(startX, startY);

  for (let i = 1; i < points.length; i++) {
    const [px, py] = toCanvasCoords(points[i][0], points[i][1], size);
    ctx.lineTo(px, py);
  }
  ctx.stroke();
}

export function renderCurves(
  canvas: HTMLCanvasElement,
  curveGroups: Point[][],
  transform: TransformConfig,
  options: RenderOptions = {}
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = CANVAS_SIZE;
  canvas.width = size;
  canvas.height = size;

  const bg = options.backgroundColor ?? "#ffffff";
  const lineColor = options.lineColor ?? "#000000";
  const lineWidth = options.lineWidth ?? LINE_WIDTH;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const allGroups: Point[][] = [];

  for (const rawPoints of curveGroups) {
    if (rawPoints.length === 0) continue;
    const groups = applyTransform(rawPoints, transform)
      .map(filterValidPoints)
      .filter((g) => g.length > 0);
    allGroups.push(...groups);
  }

  if (allGroups.length === 0) return;

  const flat = allGroups.flat();
  const bounds = computeBounds(flat);
  const rangeX = bounds.maxX - bounds.minX || 1;
  const rangeY = bounds.maxY - bounds.minY || 1;
  const scale = 1.8 / Math.max(rangeX, rangeY);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;

  for (const group of allGroups) {
    const normGroup = group.map(([x, y]) => [
      (x - cx) * scale,
      (y - cy) * scale,
    ] as Point);
    drawPath(ctx, normGroup, size);
  }
}

export function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = "equation-sketch.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
