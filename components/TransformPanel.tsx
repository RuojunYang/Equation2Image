"use client";

import { AppState } from "@/lib/app-state";
import { TransformType, TRANSFORM_OPTIONS, getTransformLabel } from "@/lib/transforms";

interface TransformPanelProps {
  state: AppState;
  onChange: (patch: Partial<AppState>) => void;
}

export default function TransformPanel({ state, onChange }: TransformPanelProps) {
  const showRepeatCount = state.transform === "rotate";
  const showSegments = state.transform === "kaleidoscope";
  const showOverlay = state.transform === "multi_overlay";
  const showWarp = state.transform === "domain_warp";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">变换控制</h2>
        <p className="text-sm text-zinc-400 mt-1">
          同一函数通过变换叠加成完整图案，所有线条均来自 f(x)
        </p>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">组合模式</label>
        <div className="grid grid-cols-2 gap-2">
          {TRANSFORM_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ transform: type })}
              className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                state.transform === type
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {getTransformLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {showRepeatCount && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            重复份数: {state.segments}
          </label>
          <input
            type="range"
            min={2}
            max={12}
            value={state.segments}
            onChange={(e) => onChange({ segments: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
      )}

      {showSegments && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            对称扇数: {state.segments}
          </label>
          <input
            type="range"
            min={2}
            max={12}
            value={state.segments}
            onChange={(e) => onChange({ segments: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
      )}

      {showOverlay && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            叠加层数: {state.overlayCount}
          </label>
          <input
            type="range"
            min={1}
            max={8}
            value={state.overlayCount}
            onChange={(e) => onChange({ overlayCount: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
      )}

      {showWarp && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            扭曲强度: {state.warpStrength.toFixed(1)}
          </label>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={state.warpStrength}
            onChange={(e) => onChange({ warpStrength: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

export type { TransformType };
