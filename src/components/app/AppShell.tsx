"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Hero } from "@/components/landing/Hero";
import { FilePicker } from "@/components/landing/FilePicker";
import { RewritePrompt } from "@/components/flow/RewritePrompt";
import { RewriteLoadingState } from "@/components/flow/RewriteLoadingState";
import { RewriteErrorState } from "@/components/flow/RewriteErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { useDocumentStore } from "@/lib/state/documentStore";
import { usePdfDocument } from "@/lib/pdf/usePdfDocument";
import { extractPageTexts } from "@/lib/pdf/extractPageText";
import {
  createRewriteJob,
  snapshotToResponseBody,
  subscribeToRewriteJob,
} from "@/lib/rewrite/rewriteClient";

// The reader subtree touches pdf.js / browser-only file APIs — ssr:false
// here guarantees zero server-side module evaluation, not just no render.
const PdfReader = dynamic(() => import("@/components/reader/PdfReader"), {
  ssr: false,
});
const TextReader = dynamic(() => import("@/components/reader/TextReader"), {
  ssr: false,
});

export function AppShell() {
  const {
    status,
    file,
    arrayBuffer,
    pageCount,
    rewrite,
    errorMessage,
    pickFile,
    documentLoaded,
    documentLoadFailed,
    chooseReadOriginal,
    chooseRewrite,
    rewriteSucceeded,
    rewriteFailed,
    reset,
  } = useDocumentStore();

  const { doc, error: docError } = usePdfDocument(
    status === "idle" ? null : arrayBuffer
  );

  useEffect(() => {
    if (status !== "loading-document") return;
    if (docError) documentLoadFailed(docError);
    else if (doc) documentLoaded(doc.numPages);
  }, [status, doc, docError, documentLoaded, documentLoadFailed]);

  useEffect(() => {
    if (status !== "rewriting" || !file || !doc) return;
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    extractPageTexts(doc)
      .then((pages) => createRewriteJob(file.name, pages))
      .then((jobId) => {
        if (cancelled) return;
        unsubscribe = subscribeToRewriteJob(
          jobId,
          (snapshot) => {
            if (cancelled) return;
            const body = snapshotToResponseBody(file.name, snapshot);
            // Safe to call repeatedly — once already "reading-rewritten",
            // this just refreshes `rewrite` with newly-completed pages as
            // they land, rather than waiting for the whole document.
            if (body.sections.length > 0) rewriteSucceeded(body);
          },
          (message) => {
            if (!cancelled) rewriteFailed(message);
          }
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          rewriteFailed(err instanceof Error ? err.message : "Rewrite failed");
        }
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [status, file, doc, rewriteSucceeded, rewriteFailed]);

  if (status === "reading-original" && doc && file) {
    return <PdfReader doc={doc} fileName={file.name} onClose={reset} />;
  }

  if (status === "reading-rewritten" && rewrite) {
    return <TextReader rewrite={rewrite} onClose={reset} />;
  }

  return (
    <main className="flex flex-1 min-h-0 flex-col items-center justify-center overflow-y-auto px-6 py-16 sm:py-24">
      {status === "idle" && (
        <div className="flex flex-col gap-16 w-full items-center">
          <Hero />
          <FilePicker onFilePicked={pickFile} />
        </div>
      )}

      {status === "loading-document" && (
        <div className="flex flex-col items-center gap-4 text-foreground-subtle text-sm">
          <Spinner className="size-5 text-accent" />
          Reading {file?.name}…
        </div>
      )}

      {status === "document-error" && (
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <p className="text-red-400 text-sm">
            {errorMessage ?? "Couldn't open that PDF."}
          </p>
          <button
            onClick={reset}
            className="font-mono text-xs text-foreground-muted hover:text-foreground"
          >
            ← Try a different file
          </button>
        </div>
      )}

      {status === "prompt" && file && pageCount !== null && (
        <RewritePrompt
          fileName={file.name}
          pageCount={pageCount}
          onReadOriginal={chooseReadOriginal}
          onRewrite={chooseRewrite}
          onPickAnother={reset}
        />
      )}

      {status === "rewriting" && file && (
        <RewriteLoadingState fileName={file.name} />
      )}

      {status === "rewrite-error" && (
        <RewriteErrorState
          message={errorMessage ?? "Something went wrong."}
          onRetry={chooseRewrite}
          onReadOriginal={chooseReadOriginal}
        />
      )}
    </main>
  );
}
