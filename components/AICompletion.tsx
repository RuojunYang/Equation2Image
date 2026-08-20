"use client";

import { useState } from "react";
import { AppState, HistoryEntry, saveHistoryEntry } from "@/lib/app-state";

interface AICompletionProps {
  state: AppState;
  sketchDataUrl: string | null;
  onResult: (entry: HistoryEntry) => void;
}

export default function AICompletion({
  state,
  sketchDataUrl,
  onResult,
}: AICompletionProps) {
  const [prompt, setPrompt] = useState(state.prompt);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!sketchDataUrl) {
      setError("请先生成线条预览");
      return;
    }

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: sketchDataUrl,
          prompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setResultUrl(data.imageUrl);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        state: { ...state, prompt },
        sketchDataUrl,
        resultUrl: data.imageUrl,
      };
      onResult(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">AI 补全</h2>
        <p className="text-sm text-zinc-400 mt-1">ControlNet 根据线稿生成完整插画</p>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">风格描述 (Prompt)</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 resize-none"
          placeholder="watercolor painting, cherry blossoms, soft pastel colors"
        />
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !sketchDataUrl}
        className="w-full py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 text-white"
      >
        {loading ? "生成中..." : "AI 生成图片"}
      </button>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {resultUrl && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">生成结果</p>
          <div className="rounded-xl overflow-hidden border border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resultUrl} alt="AI generated result" className="w-full block" />
          </div>
          <a
            href={resultUrl}
            download="equation2image-result.png"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            下载结果
          </a>
        </div>
      )}

      {sketchDataUrl && resultUrl && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">对比：线稿 vs AI 结果</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg overflow-hidden border border-zinc-700 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sketchDataUrl} alt="Sketch" className="w-full block" />
            </div>
            <div className="rounded-lg overflow-hidden border border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Result" className="w-full block" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
