"use client";

import { useEffect, useRef } from "react";
import { renderCurves, downloadCanvas, CANVAS_SIZE } from "@/lib/renderer";
import { Point } from "@/lib/transforms";
import { TransformConfig } from "@/lib/transforms";

interface CanvasPreviewProps {
  curves: Point[][];
  transform: TransformConfig;
  onSketchReady?: (dataUrl: string) => void;
}

export default function CanvasPreview({
  curves,
  transform,
  onSketchReady,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onSketchReadyRef = useRef(onSketchReady);
  onSketchReadyRef.current = onSketchReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderCurves(canvas, curves, transform);
    onSketchReadyRef.current?.(canvas.toDataURL("image/png"));
  }, [curves, transform]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">线条预览</h2>
          <p className="text-sm text-zinc-400 mt-1">{CANVAS_SIZE}×{CANVAS_SIZE} 线稿</p>
        </div>
        <button
          type="button"
          onClick={() => canvasRef.current && downloadCanvas(canvasRef.current)}
          className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          导出 PNG
        </button>
      </div>

      <div className="rounded-xl overflow-hidden border border-zinc-700 bg-white inline-block">
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block max-w-full h-auto" />
      </div>
    </div>
  );
}
