import { getCappedDpr } from "@/lib/utils/dpr";
import type { PDFDocumentProxy } from "./pdfjsClient";

export interface RenderHandle {
  cancel: () => void;
  done: Promise<void>;
}

/** Renders one page into `canvas`, sized to `cssWidth` (times `zoom`), at a
 * devicePixelRatio-aware (capped) backing resolution. Returns a handle whose
 * `cancel()` calls pdf.js's own RenderTask.cancel() — actually stops the
 * in-flight render, unlike debouncing alone. */
export function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  cssWidth: number,
  zoom: number = 1
): RenderHandle {
  let cancelled = false;
  let renderTask: ReturnType<
    Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]
  > | null = null;

  const done = (async () => {
    const page = await doc.getPage(pageNumber);
    if (cancelled) return;

    const unscaledViewport = page.getViewport({ scale: 1 });
    const displayWidth = cssWidth * zoom;
    const displayHeight =
      (displayWidth * unscaledViewport.height) / unscaledViewport.width;
    const dpr = getCappedDpr();
    const viewport = page.getViewport({
      scale: (displayWidth * dpr) / unscaledViewport.width,
    });

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    if (cancelled) return;

    renderTask = page.render({ canvas, viewport });
    await renderTask.promise;
  })();

  return {
    cancel: () => {
      cancelled = true;
      renderTask?.cancel();
    },
    done,
  };
}

/** Zeroes a canvas's backing store so browsers actually release the memory
 * (some retain it after unmount alone) — matters most on memory-constrained
 * mobile Safari when scrolling past hundreds of rendered pages. */
export function evictCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0;
  canvas.height = 0;
}
