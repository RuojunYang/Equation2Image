"use client";

import { AppState } from "@/lib/app-state";
import { TransformType, TRANSFORM_OPTIONS, getTransformLabel } from "@/lib/transforms";

interface TransformPanelProps {
  state: AppState;
  onChange: (patch: Partial<AppState>) => void;
}

export default function TransformPanel({ state, onChange }: TransformPanelProps) {
  const showRepeatCount = state.transform === "rotate";
  const showSegments =
    state.transform === "kaleidoscope" || state.transform === "gallery";
  const showAnchorDiverge = state.transform === "anchor_diverge";
  const showGallery = state.transform === "gallery";
  const showOverlay = state.transform === "multi_overlay";
  const showWarp = state.transform === "domain_warp";

  const handleRandomize = () => {
    onChange({ seed: Math.floor(Math.random() * 100000) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">变换控制</h2>
        <p className="text-sm text-zinc-400 mt-1">
          同一函数通过变换叠加成完整图案，位置与尺度可偏移（非原点对称）
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

      {showGallery && (
        <p className="text-xs text-zinc-500 leading-relaxed">
          Escher 画廊：曲线副本沿螺旋散布，各自缩放旋转、偏离原点，营造《版画画廊》式的递归错位感。
        </p>
      )}

      {showAnchorDiverge && (
        <p className="text-xs text-zinc-500 leading-relaxed">
          随机生成锚点，每个点在其扇区内发散曲线；自动检测并跳过交叉重叠的线段。
        </p>
      )}

      {showAnchorDiverge && (
        <>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              锚点数量: {state.segments}
            </label>
            <input
              type="range"
              min={2}
              max={8}
              value={state.segments}
              onChange={(e) => onChange({ segments: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              每点发散数: {state.overlayCount}
            </label>
            <input
              type="range"
              min={2}
              max={8}
              value={state.overlayCount}
              onChange={(e) => onChange({ overlayCount: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              散布范围: {state.spread.toFixed(1)}
            </label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={state.spread}
              onChange={(e) => onChange({ spread: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              锚点最小间距: {state.minAnchorSpacing.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.25}
              max={1.2}
              step={0.05}
              value={state.minAnchorSpacing}
              onChange={(e) => onChange({ minAnchorSpacing: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </>
      )}

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
            {showGallery ? "副本数量" : "对称扇数"}: {state.segments}
          </label>
          <input
            type="range"
            min={showGallery ? 5 : 2}
            max={showGallery ? 18 : 12}
            value={state.segments}
            onChange={(e) => onChange({ segments: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
      )}

      {showGallery && (
        <div>
          <label className="block text-sm text-zinc-400 mb-1">
            散布范围: {state.spread.toFixed(1)}
          </label>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={state.spread}
            onChange={(e) => onChange({ spread: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
      )}

      {(showGallery || showAnchorDiverge || showRepeatCount || state.transform === "kaleidoscope") && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-zinc-400">随机种子: {state.seed}</label>
            <button
              type="button"
              onClick={handleRandomize}
              className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              重新随机
            </button>
          </div>
          <input
            type="range"
            min={1}
            max={99999}
            value={state.seed}
            onChange={(e) => onChange({ seed: parseInt(e.target.value, 10) })}
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
