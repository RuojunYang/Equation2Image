import { create, all } from "mathjs";

const math = create(all);

export type CoordinateMode = "cartesian" | "polar" | "parametric";

export interface FunctionConfig {
  mode: CoordinateMode;
  expr: string;
  exprX?: string;
  exprY?: string;
  variable: string;
  tMin: number;
  tMax: number;
  sampleCount: number;
}

export interface SampledCurve {
  points: [number, number][];
  error?: string;
}

const MAX_EXPR_LENGTH = 500;
const Y_THRESHOLD = 100;

/** Map common variable names to the active mode's variable. */
function normalizeExpression(expr: string, variable: string): string {
  let normalized = expr.trim();

  if (variable === "theta") {
    normalized = normalized.replace(/\bx\b/g, "theta");
    normalized = normalized.replace(/θ/g, "theta");
  } else if (variable === "x") {
    normalized = normalized.replace(/\btheta\b/g, "x");
    normalized = normalized.replace(/θ/g, "x");
  } else if (variable === "t") {
    normalized = normalized.replace(/\bx\b/g, "t");
    normalized = normalized.replace(/\btheta\b/g, "t");
  }

  // math.js uses ^ for power; accept ** from users
  normalized = normalized.replace(/\*\*/g, "^");

  return normalized;
}

function validateExpression(expr: string): string | null {
  if (!expr.trim()) return "Expression cannot be empty";
  if (expr.length > MAX_EXPR_LENGTH) return "Expression is too long";
  return null;
}

export function compileFunction(
  expr: string,
  variable = "x"
): ((value: number) => number) | { error: string } {
  const validationError = validateExpression(expr);
  if (validationError) return { error: validationError };

  try {
    const normalized = normalizeExpression(expr, variable);
    const node = math.parse(normalized);
    const code = node.compile();
    return (value: number) => {
      try {
        const result = code.evaluate({ [variable]: value });
        return typeof result === "number" && Number.isFinite(result) ? result : NaN;
      } catch {
        return NaN;
      }
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Invalid expression" };
  }
}

function isValidPoint(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(y) < Y_THRESHOLD;
}

function sampleRange(min: number, max: number, count: number): number[] {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

export function sampleCurve(config: FunctionConfig): SampledCurve {
  const { mode, expr, exprX, exprY, variable, tMin, tMax, sampleCount } = config;
  const points: [number, number][] = [];
  const values = sampleRange(tMin, tMax, sampleCount);

  if (mode === "cartesian") {
    const fn = compileFunction(expr, variable);
    if ("error" in fn) return { points: [], error: fn.error };

    let lastValid = false;
    for (const t of values) {
      const y = fn(t);
      const valid = isValidPoint(t, y);
      if (valid) {
        points.push([t, y]);
        lastValid = true;
      } else if (lastValid) {
        lastValid = false;
      }
    }
    return { points, error: points.length === 0 ? "No valid points — check expression and range" : undefined };
  }

  if (mode === "polar") {
    const polarVar = variable === "x" ? "theta" : variable;
    const fn = compileFunction(expr, polarVar);
    if ("error" in fn) return { points: [], error: fn.error };

    let lastValid = false;
    for (const theta of values) {
      const r = fn(theta);
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const valid = Number.isFinite(x) && Number.isFinite(y) && Math.abs(r) < Y_THRESHOLD;
      if (valid) {
        points.push([x, y]);
        lastValid = true;
      } else if (lastValid) {
        lastValid = false;
      }
    }
    return {
      points,
      error: points.length === 0 ? "No valid points — check expression and range" : undefined,
    };
  }

  // parametric
  const fnX = compileFunction(exprX || "cos(t)", "t");
  const fnY = compileFunction(exprY || "sin(t)", "t");
  if ("error" in fnX) return { points: [], error: fnX.error };
  if ("error" in fnY) return { points: [], error: fnY.error };

  let lastValid = false;
  for (const t of values) {
    const x = fnX(t);
    const y = fnY(t);
    const valid = isValidPoint(x, y) && Math.abs(x) < Y_THRESHOLD;
    if (valid) {
      points.push([x, y]);
      lastValid = true;
    } else if (lastValid) {
      lastValid = false;
    }
  }
  return {
    points,
    error: points.length === 0 ? "No valid points — check expression and range" : undefined,
  };
}

export function sampleMultipleCurves(
  config: FunctionConfig,
  overlayCount: number
): SampledCurve[] {
  const curves: SampledCurve[] = [];
  const baseRange = config.tMax - config.tMin;

  for (let i = 0; i < overlayCount; i++) {
    const phase = (baseRange / overlayCount) * i;
    const scale = 1 - i * 0.08;

    if (config.mode === "cartesian") {
      const offsetExpr =
        overlayCount === 1
          ? config.expr
          : `(${scale}) * (${config.expr.replace(/\bx\b/g, `(x/${scale} - ${phase})`)})`;
      curves.push(
        sampleCurve({
          ...config,
          expr: overlayCount === 1 ? config.expr : offsetExpr,
        })
      );
    } else if (config.mode === "polar") {
      curves.push(
        sampleCurve({
          ...config,
          expr:
            overlayCount === 1
              ? config.expr
              : `(${scale}) * (${config.expr.replace(/\btheta\b/g, `(theta - ${phase})`)})`,
        })
      );
    } else {
      curves.push(sampleCurve(config));
    }
  }

  return curves;
}

export const PRESETS = [
  {
    id: "sine",
    name: "正弦波",
    mode: "cartesian" as CoordinateMode,
    expr: "sin(x)",
    tMin: -6.28,
    tMax: 6.28,
  },
  {
    id: "rose",
    name: "玫瑰线",
    mode: "polar" as CoordinateMode,
    expr: "sin(3*theta)",
    tMin: 0,
    tMax: 6.28,
  },
  {
    id: "heart",
    name: "心形线",
    mode: "parametric" as CoordinateMode,
    exprX: "16*sin(t)^3",
    exprY: "13*cos(t) - 5*cos(2*t) - 2*cos(3*t) - cos(4*t)",
    tMin: 0,
    tMax: 6.28,
  },
  {
    id: "butterfly",
    name: "蝴蝶曲线",
    mode: "polar" as CoordinateMode,
    expr: "exp(cos(theta)) - 2*cos(4*theta) + sin(theta/12)^5",
    tMin: 0,
    tMax: 12.56,
  },
  {
    id: "lissajous",
    name: "Lissajous",
    mode: "parametric" as CoordinateMode,
    exprX: "sin(3*t)",
    exprY: "sin(4*t)",
    tMin: 0,
    tMax: 6.28,
  },
  {
    id: "spiral",
    name: "螺旋",
    mode: "parametric" as CoordinateMode,
    exprX: "t*cos(t)",
    exprY: "t*sin(t)",
    tMin: 0,
    tMax: 18.84,
  },
];
