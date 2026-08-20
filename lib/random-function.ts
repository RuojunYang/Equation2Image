import { CoordinateMode, compileFunction } from "./math-parser";

export interface RandomFunctionResult {
  mode: CoordinateMode;
  expr: string;
  exprX: string;
  exprY: string;
  tMin: number;
  tMax: number;
  seed: number;
}

function createRng(seed: number) {
  let s = seed >>> 0;
  return {
    next(): number {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    },
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
    chance(p: number): boolean {
      return this.next() < p;
    },
  };
}

function isValidExpr(expr: string, variable: string): boolean {
  const fn = compileFunction(expr, variable);
  return !("error" in fn);
}

function trigTerm(rng: ReturnType<typeof createRng>, v: string): string {
  const fn = rng.pick(["sin", "cos"] as const);
  const freq = rng.int(1, 7);
  const amp = rng.int(1, 5);

  let inner = `${freq}*${v}`;
  if (rng.chance(0.35)) {
    inner = `${inner} + ${rng.pick(["pi/4", "pi/3", "pi/2", "pi"])}`;
  } else if (rng.chance(0.25)) {
    inner = `${rng.int(2, 5)}*${v}`;
  }

  let term = `${amp}*${fn}(${inner})`;
  if (rng.chance(0.3)) {
    term = `${term}^${rng.int(2, 3)}`;
  }
  return term;
}

function buildCartesian(rng: ReturnType<typeof createRng>): string {
  const count = rng.int(1, 3);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    if (rng.chance(0.25)) {
      parts.push(`${rng.int(1, 3)}*${rng.pick(["x", trigTerm(rng, "x")])}`);
    } else if (rng.chance(0.2)) {
      parts.push(`exp(${rng.pick(["sin(x)", "cos(x)", "-x^2/5"])})`);
    } else {
      parts.push(trigTerm(rng, "x"));
    }
  }
  return parts.join(rng.chance(0.45) ? " * " : " + ");
}

function buildPolar(rng: ReturnType<typeof createRng>): string {
  const style = rng.int(0, 4);
  const n = rng.int(2, 9);
  const m = rng.int(2, 7);
  const a = rng.int(1, 4);

  switch (style) {
    case 0:
      return `${a}*sin(${n}*theta)`;
    case 1:
      return `${a}*cos(${n}*theta)`;
    case 2:
      return `${a}*(1 + cos(${n}*theta))`;
    case 3:
      return `${a}*sin(${n}*theta)*cos(${m}*theta)`;
    default:
      return `${a}*cos(${n}*theta)^2 + sin(${m}*theta)`;
  }
}

function buildParametric(rng: ReturnType<typeof createRng>): { exprX: string; exprY: string } {
  const fx = rng.int(2, 6);
  const fy = rng.int(2, 6);
  const ax = rng.int(1, 8);
  const ay = rng.int(1, 8);

  if (rng.chance(0.25)) {
    return {
      exprX: `${ax}*sin(t)^3`,
      exprY: `${ay}*cos(t) - ${rng.int(2, 5)}*cos(2*t)`,
    };
  }

  if (rng.chance(0.2)) {
    return {
      exprX: `${ax}*sin(${fx}*t)*cos(t)`,
      exprY: `${ay}*sin(${fy}*t)*sin(t)`,
    };
  }

  const xPhase = rng.chance(0.4) ? ` + ${rng.pick(["pi/4", "pi/2"])}` : "";
  const yPhase = rng.chance(0.4) ? ` + ${rng.pick(["pi/3", "pi/2"])}` : "";
  const xFn = rng.pick(["sin", "cos"] as const);
  const yFn = rng.pick(["sin", "cos"] as const);

  return {
    exprX: `${ax}*${xFn}(${fx}*t${xPhase})`,
    exprY: `${ay}*${yFn}(${fy}*t${yPhase})`,
  };
}

function rangeForMode(rng: ReturnType<typeof createRng>, mode: CoordinateMode): [number, number] {
  if (mode === "cartesian") {
    const span = rng.pick([6.28, 9.42, 12.56]);
    return [-span / 2, span / 2];
  }
  if (mode === "polar") {
    return [0, rng.pick([6.28, 9.42, 12.56])];
  }
  return [0, rng.pick([6.28, 12.56, 18.84])];
}

export function generateRandomFunction(
  mode: CoordinateMode,
  seed = Math.floor(Math.random() * 1_000_000)
): RandomFunctionResult {
  for (let attempt = 0; attempt < 24; attempt++) {
    const rng = createRng(seed + attempt);
    const [tMin, tMax] = rangeForMode(rng, mode);

    if (mode === "cartesian") {
      const expr = buildCartesian(rng);
      if (isValidExpr(expr, "x")) {
        return {
          mode,
          expr,
          exprX: "sin(3*t)",
          exprY: "sin(4*t)",
          tMin,
          tMax,
          seed: seed + attempt,
        };
      }
    } else if (mode === "polar") {
      const expr = buildPolar(rng);
      if (isValidExpr(expr, "theta")) {
        return {
          mode,
          expr,
          exprX: "sin(3*t)",
          exprY: "sin(4*t)",
          tMin,
          tMax,
          seed: seed + attempt,
        };
      }
    } else {
      const { exprX, exprY } = buildParametric(rng);
      if (isValidExpr(exprX, "t") && isValidExpr(exprY, "t")) {
        return {
          mode,
          expr: "sin(x)",
          exprX,
          exprY,
          tMin,
          tMax,
          seed: seed + attempt,
        };
      }
    }
  }

  return {
    mode,
    expr: "sin(x)*cos(2*x)",
    exprX: "sin(3*t)",
    exprY: "cos(4*t)",
    tMin: -6.28,
    tMax: 6.28,
    seed,
  };
}

export function generateRandomEverything(baseSeed?: number): RandomFunctionResult {
  const seed = baseSeed ?? Math.floor(Math.random() * 1_000_000);
  const rng = createRng(seed);
  const mode = rng.pick(["cartesian", "polar", "parametric"] as CoordinateMode[]);
  return generateRandomFunction(mode, seed);
}
