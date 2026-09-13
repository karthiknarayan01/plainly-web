"use client";

import { useEffect, useState } from "react";
import { getPdfjs, type PDFDocumentProxy } from "./pdfjsClient";

interface UsePdfDocumentResult {
  doc: PDFDocumentProxy | null;
  numPages: number | null;
  error: string | null;
  loading: boolean;
}

/**
 * pdf.js transfers (detaches) the ArrayBuffer it's given to its worker, so
 * each call gets its own copy — the caller's buffer stays reusable.
 */
export function usePdfDocument(
  arrayBuffer: ArrayBuffer | null
): UsePdfDocumentResult {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!arrayBuffer) return;

    let cancelled = false;
    const pdfjsLib = getPdfjs();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });

    loadingTask.promise
      .then((loadedDoc) => {
        if (cancelled) {
          loadingTask.destroy();
          return;
        }
        setDoc(loadedDoc);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
      setDoc(null);
      setError(null);
    };
  }, [arrayBuffer]);

  // Derived, not stored: fully determined by (arrayBuffer, doc, error), so
  // there's no separate flag that could drift out of sync with them.
  const loading = arrayBuffer !== null && doc === null && error === null;

  return { doc, numPages: doc?.numPages ?? null, error, loading };
}
