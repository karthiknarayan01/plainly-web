"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;

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
      handle.done.catch((err: unknown) => {
        // A cancelled render (page scrolled away before it finished) is
        // expected and not worth surfacing — the page re-renders if it
        // becomes visible again. Anything else is a real failure.
        if (err instanceof RenderingCancelledException) return;
        console.error("PDF page render failed", source.pageNumber, err);
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
    <canvas
      ref={canvasRef}
      className="rounded-sm shadow-lg shadow-black/40 bg-white"
    />
  );
}
