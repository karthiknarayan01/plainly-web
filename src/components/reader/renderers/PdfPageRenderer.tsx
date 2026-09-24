"use client";

import { useEffect, useRef, useState } from "react";
import { renderPageToCanvas, evictCanvas } from "@/lib/pdf/renderPageToCanvas";
import { scheduleIdle } from "@/lib/pdf/idlePrefetch";
import { RenderingCancelledException } from "@/lib/pdf/pdfjsClient";
import type { PageContentRendererProps, PageSource } from "../types";

type PdfSource = Extract<PageSource, { kind: "pdf" }>;

export function PdfPageRenderer({
  source,
  width,
  renderPriority,
  zoom,
}: PageContentRendererProps<PdfSource>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // A page that fails to draw used to leave a blank canvas and a line in
  // the console, which is invisible to anyone not holding DevTools open —
  // a reader full of blank pages and no explanation. Surfaced on the page
  // itself now, for the same reason the backend reports why a rewrite
  // failed instead of going quiet.
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (width <= 0) {
      // Not an error the reader can act on, but it must not be silent:
      // this is the one path that draws nothing and logs nothing.
      console.warn(
        "PDF page skipped: container width is not positive",
        source.pageNumber,
        width
      );
      return;
    }

    let cancel: (() => void) | null = null;
    let cancelIdle: (() => void) | null = null;

    const startRender = () => {
      const handle = renderPageToCanvas(
        source.doc,
        source.pageNumber,
        canvas,
        width,
        zoom
      );
      cancel = handle.cancel;
      handle.done
        .then(() => setRenderError(null))
        .catch((err: unknown) => {
          // A cancelled render (page scrolled away before it finished) is
          // expected and not worth surfacing — the page re-renders if it
          // becomes visible again. Anything else is a real failure.
          if (err instanceof RenderingCancelledException) return;
          console.error("PDF page render failed", source.pageNumber, err);
          setRenderError(err instanceof Error ? err.message : String(err));
        });
    };

    if (renderPriority === "high") {
      startRender();
    } else {
      cancelIdle = scheduleIdle(startRender);
    }

    return () => {
      cancelIdle?.();
      cancel?.();
    };
  }, [source.doc, source.pageNumber, width, zoom, renderPriority]);

  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) evictCanvas(canvas);
    };
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="rounded-sm shadow-lg shadow-black/40 bg-white"
      />
      {renderError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-sm bg-white/95 p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-red-500">
            Page {source.pageNumber} didn&apos;t render
          </p>
          <p className="max-w-sm text-xs text-neutral-600">{renderError}</p>
        </div>
      )}
    </div>
  );
}
