"use client";

import { CoordinateMode, PRESETS } from "@/lib/math-parser";
import { generateRandomEverything, generateRandomFunction } from "@/lib/random-function";
import { AppState } from "@/lib/app-state";

interface FunctionInputProps {
  state: AppState;
  onChange: (patch: Partial<AppState>) => void;
  error?: string;
}

const MODES: { value: CoordinateMode; label: string }[] = [
  { value: "cartesian", label: "笛卡尔 y=f(x)" },
  { value: "polar", label: "极坐标 r=f(θ)" },
  { value: "parametric", label: "参数 x=f(t), y=g(t)" },
];

export default function FunctionInput({ state, onChange, error }: FunctionInputProps) {
  const handleRandomFunction = () => {
    const result = generateRandomFunction(state.mode, Math.floor(Math.random() * 1_000_000));
    onChange({
      expr: result.expr,
      exprX: result.exprX,
      exprY: result.exprY,
      tMin: result.tMin,
      tMax: result.tMax,
      seed: result.seed,
    });
  };

  const handleRandomAll = () => {
    const result = generateRandomEverything();
    onChange({
      mode: result.mode,
      expr: result.expr,
      exprX: result.exprX,
      exprY: result.exprY,
      tMin: result.tMin,
      tMax: result.tMax,
      seed: result.seed,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">函数输入</h2>
        <p className="text-sm text-zinc-400 mt-1">
          {state.mode === "cartesian"
            ? "输入 f(x)，曲线将经变换组合成图案（非单条函数图像）"
            : "输入数学表达式，实时生成线条草图"}
        </p>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">坐标模式</label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange({ mode: m.value })}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                state.mode === m.value
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {state.mode === "parametric" ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">x(t) =</label>
            <input
              type="text"
              value={state.exprX}
              onChange={(e) => onChange({ exprX: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
              placeholder="sin(3*t)"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">y(t) =</label>
            <input
              type="text"
              value={state.exprY}
              onChange={(e) => onChange({ exprY: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
              placeholder="sin(4*t)"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            {state.mode === "polar" ? "r(θ) =" : "f(x) ="}
          </label>
          <input
            type="text"
            value={state.expr}
            onChange={(e) => onChange({ expr: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
            placeholder={state.mode === "polar" ? "sin(3*theta)" : "sin(x)"}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            {state.mode === "parametric" ? "t 最小" : state.mode === "polar" ? "θ 最小" : "x 最小"}
          </label>
          <input
            type="number"
            step="0.1"
            value={state.tMin}
            onChange={(e) => onChange({ tMin: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            {state.mode === "parametric" ? "t 最大" : state.mode === "polar" ? "θ 最大" : "x 最大"}
          </label>
          <input
            type="number"
            step="0.1"
            value={state.tMax}
            onChange={(e) => onChange({ tMax: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-zinc-400 mb-2">随机探索</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRandomFunction}
            className="px-3 py-1.5 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
          >
            随机函数
          </button>
          <button
            type="button"
            onClick={handleRandomAll}
            className="px-3 py-1.5 rounded-lg text-sm bg-violet-700 text-white hover:bg-violet-600 transition-colors"
          >
            随机全部（模式+函数+布局）
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          自动生成 sin/cos 组合、玫瑰线、Lissajous 等随机表达式，不必只用预设模板
        </p>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">预设模板</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onChange({
                  mode: preset.mode,
                  expr: preset.expr || state.expr,
                  exprX: preset.exprX || state.exprX,
                  exprY: preset.exprY || state.exprY,
                  tMin: preset.tMin,
                  tMax: preset.tMax,
                })
              }
              className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
