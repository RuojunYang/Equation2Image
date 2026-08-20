"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FunctionInput from "@/components/FunctionInput";
import TransformPanel from "@/components/TransformPanel";
import CanvasPreview from "@/components/CanvasPreview";
import AICompletion from "@/components/AICompletion";
import HistoryPanel from "@/components/HistoryPanel";
import {
  AppState,
  DEFAULT_STATE,
  HistoryEntry,
  decodeStateFromUrl,
  encodeStateToUrl,
  loadHistory,
  saveHistoryEntry,
  toFunctionConfig,
  toTransformConfig,
} from "@/lib/app-state";
import { sampleCurve, sampleMultipleCurves } from "@/lib/math-parser";
import { Point } from "@/lib/transforms";

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [sketchDataUrl, setSketchDataUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const partial = decodeStateFromUrl(window.location.search.replace("?", ""));
    if (Object.keys(partial).length > 0) {
      setState((s) => ({ ...s, ...partial }));
    }
    setHistory(loadHistory());
  }, []);

  const updateState = useCallback((patch: Partial<AppState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const { curves, parseError } = useMemo(() => {
    const config = toFunctionConfig(state);

    if (state.transform === "multi_overlay") {
      const sampled = sampleMultipleCurves(config, state.overlayCount);
      const error = sampled.find((c) => c.error)?.error;
      return {
        curves: sampled.map((c) => c.points),
        parseError: error,
      };
    }

    const sampled = sampleCurve(config);
    return {
      curves: [sampled.points],
      parseError: sampled.error,
    };
  }, [state]);

  const transformConfig = useMemo(() => toTransformConfig(state), [state]);

  const handleSketchReady = useCallback((dataUrl: string) => {
    setSketchDataUrl(dataUrl);
  }, []);

  const handleResult = useCallback((entry: HistoryEntry) => {
    const updated = saveHistoryEntry(entry);
    setHistory(updated);
  }, []);

  const handleRestore = useCallback((entry: HistoryEntry) => {
    setState(entry.state);
  }, []);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?${encodeStateToUrl(state)}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [state]);

  const totalPoints = curves.reduce((sum, c) => sum + c.length, 0);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">Equation2Image</h1>
            <p className="text-zinc-400 mt-1">数学函数 → 线条草图 → AI 补全插画</p>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="self-start px-4 py-2 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            {shareCopied ? "链接已复制!" : "分享当前配置"}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <FunctionInput state={state} onChange={updateState} error={parseError} />
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <TransformPanel state={state} onChange={updateState} />
          </div>
        </section>

        <section className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <CanvasPreview
            curves={curves as Point[][]}
            transform={transformConfig}
            onSketchReady={handleSketchReady}
          />
          <p className="text-xs text-zinc-500 mt-3">
            采样点数: {totalPoints} · 变换: {state.transform}
          </p>
        </section>

        <section className="space-y-6">
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <AICompletion
              state={state}
              sketchDataUrl={sketchDataUrl}
              onResult={handleResult}
            />
          </div>
          <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-100 mb-3">生成历史</h2>
            <HistoryPanel history={history} onRestore={handleRestore} />
          </div>
        </section>
      </div>
    </main>
  );
}
