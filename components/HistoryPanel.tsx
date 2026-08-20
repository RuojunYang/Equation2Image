"use client";

import { HistoryEntry } from "@/lib/app-state";

interface HistoryPanelProps {
  history: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
}

export default function HistoryPanel({ history, onRestore }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="text-sm text-zinc-500">暂无生成历史</div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {history.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onRestore(entry)}
          className="w-full flex items-center gap-3 p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors text-left"
        >
          {entry.resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.resultUrl}
              alt=""
              className="w-12 h-12 rounded object-cover flex-shrink-0"
            />
          ) : entry.sketchDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.sketchDataUrl}
              alt=""
              className="w-12 h-12 rounded object-cover flex-shrink-0 bg-white"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-zinc-800 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm text-zinc-300 truncate">
              {entry.state.expr || `${entry.state.exprX}, ${entry.state.exprY}`}
            </p>
            <p className="text-xs text-zinc-500">
              {new Date(entry.timestamp).toLocaleString()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
