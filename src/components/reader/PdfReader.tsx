"use client";

import { useCallback, useEffect, useState } from "react";
import { BookReaderShell } from "./BookReaderShell";
import { PdfPageRenderer } from "./renderers/PdfPageRenderer";
import { useContentWidth } from "./useContentWidth";
import { computePageLayout, type PageSize } from "@/lib/pdf/computePageLayout";
import type { PDFDocumentProxy } from "@/lib/pdf/pdfjsClient";
import type { PageContentRenderer, PageSource } from "./types";

interface PdfReaderProps {
  doc: PDFDocumentProxy;
  fileName: string;
  onClose: () => void;
}

const FALLBACK_ASPECT = 1.3; // roughly A4/Letter, used before real sizes resolve

export default function PdfReader({ doc, fileName, onClose }: PdfReaderProps) {
  const { ref, width: contentWidth } = useContentWidth();
  const [pageSizes, setPageSizes] = useState<PageSize[] | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    computePageLayout(doc, (updates) => {
      if (cancelled) return;
      setPageSizes((prev) => {
        const next = prev ? [...prev] : new Array<PageSize>(doc.numPages);
        for (const { index, size } of updates) next[index] = size;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  const getPageSource = useCallback(
    (index: number): PageSource => ({ kind: "pdf", doc, pageNumber: index + 1 }),
    [doc]
  );

  const estimateSize = useCallback(
    (index: number) => {
      const size = pageSizes?.[index];
      const aspect = size ? size.height / size.width : FALLBACK_ASPECT;
      return contentWidth * zoom * aspect;
    },
    [pageSizes, contentWidth, zoom]
  );

  return (
    <div ref={ref} className="flex-1 min-h-0">
      {pageSizes ? (
        <BookReaderShell
          title={fileName}
          pageCount={doc.numPages}
          getPageSource={getPageSource}
          estimateSize={estimateSize}
          renderer={PdfPageRenderer as PageContentRenderer}
          contentWidth={contentWidth}
          onClose={onClose}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-foreground-subtle text-sm">
          Preparing document…
        </div>
      )}
    </div>
  );
}
