import { CoordinateMode, FunctionConfig } from "./math-parser";
import { TransformConfig, TransformType } from "./transforms";

export interface AppState {
  mode: CoordinateMode;
  expr: string;
  exprX: string;
  exprY: string;
  tMin: number;
  tMax: number;
  transform: TransformType;
  angle: number;
  segments: number;
  overlayCount: number;
  warpStrength: number;
  seed: number;
  spread: number;
  minAnchorSpacing: number;
  prompt: string;
}

export const DEFAULT_STATE: AppState = {
  mode: "cartesian",
  expr: "sin(x) * cos(2*x)",
  exprX: "sin(3*t)",
  exprY: "sin(4*t)",
  tMin: -6.28,
  tMax: 6.28,
  transform: "anchor_diverge",
  angle: 45,
  segments: 4,
  overlayCount: 4,
  warpStrength: 1,
  seed: 42,
  spread: 1,
  minAnchorSpacing: 0.5,
  prompt: "M.C. Escher style, Print Gallery, recursive perspective, lithograph, dizzying architecture",
};

export function toFunctionConfig(state: AppState): FunctionConfig {
  return {
    mode: state.mode,
    expr: state.expr,
    exprX: state.exprX,
    exprY: state.exprY,
    variable: state.mode === "parametric" ? "t" : state.mode === "polar" ? "theta" : "x",
    tMin: state.tMin,
    tMax: state.tMax,
    sampleCount: 800,
  };
}

export function toTransformConfig(state: AppState): TransformConfig {
  return {
    type: state.transform,
    angle: state.angle,
    segments: state.segments,
    overlayCount: state.overlayCount,
    warpStrength: state.warpStrength,
    seed: state.seed,
    spread: state.spread,
    minAnchorSpacing: state.minAnchorSpacing,
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  state: AppState;
  sketchDataUrl?: string;
  resultUrl?: string;
}

const HISTORY_KEY = "equation2image_history";
const MAX_HISTORY = 20;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const history = loadHistory();
  const updated = [entry, ...history.filter((h) => h.id !== entry.id)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function encodeStateToUrl(state: AppState): string {
  const params = new URLSearchParams();
  params.set("mode", state.mode);
  params.set("expr", state.expr);
  if (state.mode === "parametric") {
    params.set("exprX", state.exprX);
    params.set("exprY", state.exprY);
  }
  params.set("tMin", String(state.tMin));
  params.set("tMax", String(state.tMax));
  params.set("transform", state.transform);
  params.set("angle", String(state.angle));
  params.set("segments", String(state.segments));
  params.set("overlay", String(state.overlayCount));
  params.set("warp", String(state.warpStrength));
  params.set("seed", String(state.seed));
  params.set("spread", String(state.spread));
  params.set("anchorGap", String(state.minAnchorSpacing));
  if (state.prompt) params.set("prompt", state.prompt);
  return params.toString();
}

export function decodeStateFromUrl(search: string): Partial<AppState> {
  const params = new URLSearchParams(search);
  const partial: Partial<AppState> = {};

  const mode = params.get("mode");
  if (mode === "cartesian" || mode === "polar" || mode === "parametric") {
    partial.mode = mode;
  }
  if (params.has("expr")) partial.expr = params.get("expr")!;
  if (params.has("exprX")) partial.exprX = params.get("exprX")!;
  if (params.has("exprY")) partial.exprY = params.get("exprY")!;
  if (params.has("tMin")) partial.tMin = parseFloat(params.get("tMin")!);
  if (params.has("tMax")) partial.tMax = parseFloat(params.get("tMax")!);
  if (params.has("transform")) partial.transform = params.get("transform") as TransformType;
  if (params.has("angle")) partial.angle = parseFloat(params.get("angle")!);
  if (params.has("segments")) partial.segments = parseInt(params.get("segments")!, 10);
  if (params.has("overlay")) partial.overlayCount = parseInt(params.get("overlay")!, 10);
  if (params.has("warp")) partial.warpStrength = parseFloat(params.get("warp")!);
  if (params.has("seed")) partial.seed = parseInt(params.get("seed")!, 10);
  if (params.has("spread")) partial.spread = parseFloat(params.get("spread")!);
  if (params.has("anchorGap")) partial.minAnchorSpacing = parseFloat(params.get("anchorGap")!);
  if (params.has("prompt")) partial.prompt = params.get("prompt")!;

  return partial;
}
