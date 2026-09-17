"use client";

import { useEffect, useRef, useState } from "react";
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
  waitForRewriteJob,
  type RewriteProgress,
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

  // The shape of a page in the uploaded PDF, so the rewritten reader can
  // lay its pages out identically to the original one the reader just
  // came from. Falls back to US Letter until the real size resolves.
  const [sourcePageAspect, setSourcePageAspect] = useState(11 / 8.5);
  const [progress, setProgress] = useState<RewriteProgress | null>(null);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    doc
      .getPage(1)
      .then((page) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 });
        if (viewport.width > 0) {
          setSourcePageAspect(viewport.height / viewport.width);
        }
      })
      .catch(() => {
        /* keep the Letter fallback — page geometry is cosmetic */
      });
    return () => {
      cancelled = true;
    };
  }, [doc]);

  useEffect(() => {
    if (status !== "loading-document") return;
    if (docError) documentLoadFailed(docError);
    else if (doc) documentLoaded(doc.numPages);
  }, [status, doc, docError, documentLoaded, documentLoadFailed]);

  // Tracks the in-flight job's subscription independently of React's own
  // effect re-run cycle. This matters because rewriteSucceeded (called
  // from inside the subscription callback below) flips `status` from
  // "rewriting" to "reading-rewritten" — and since `status` is a
  // dependency of this effect, that change makes React tear down and
  // re-run it. If the subscription lived in the effect's own closure (a
  // plain local variable), that teardown would close the SSE connection
  // the instant the *first* page completed, and the re-run would exit
  // immediately on the status guard below without reopening it — every
  // page after the first would silently never arrive. Keeping it in a
  // ref means the effect's own re-runs can't touch it; only a genuinely
  // new file does.
  const activeJobRef = useRef<{ file: File | null; unsubscribe: (() => void) | null }>({
    file: null,
    unsubscribe: null,
  });

  useEffect(() => {
    if (status !== "rewriting" || !file || !doc) return;
    if (activeJobRef.current.file === file) return; // already started for this file

    activeJobRef.current.unsubscribe?.(); // in case a previous file's job is still open
    activeJobRef.current = { file, unsubscribe: null };

    // Guards only the async setup below (extract -> create job), not the
    // subscription's ongoing callbacks once established. Kept separate
    // from onUpdate/onError deliberately: this protects against a stale,
    // replaced attempt's in-flight setup clobbering activeJobRef after a
    // newer one has already taken over (e.g. the user picks a different
    // file while extraction/job-creation for the first one is still
    // running). It must NOT also gate onUpdate/onError — this effect's
    // own cleanup runs on every "rewriting" -> "reading-rewritten"
    // transition (see activeJobRef comment above), so gating the ongoing
    // callbacks on the same flag would silently neuter every update
    // after the first, even with the ref keeping the connection open.
    let setupCancelled = false;

    extractPageTexts(doc)
      .then((pages) => createRewriteJob(file.name, pages))
      .then((jobId) => {
        if (setupCancelled) return;
        // Waits for the ENTIRE document rather than revealing pages as
        // they finish. Pages complete out of order across the worker's
        // lanes, so a partial reveal could only ever show the run from
        // page 1 and looked like the rest had been lost.
        const abandon = waitForRewriteJob(
          jobId,
          file.name,
          setProgress,
          (body) => rewriteSucceeded(body),
          (message) => rewriteFailed(message)
        );
        activeJobRef.current.unsubscribe = abandon;
      })
      .catch((err: unknown) => {
        if (!setupCancelled) {
          rewriteFailed(err instanceof Error ? err.message : "Rewrite failed");
        }
      });

    return () => {
      setupCancelled = true;
      // Deliberately not closing the subscription here — see the
      // activeJobRef comment above. A genuinely new file (guarded at the
      // top of this effect) or an explicit reset (the effect below)
      // closes it instead.
    };
  }, [status, file, doc, rewriteSucceeded, rewriteFailed]);

  // Close the subscription on reset (back to "idle") — the effect above
  // won't, since its guard exits before touching the ref in that case.
  useEffect(() => {
    if (status === "idle") {
      activeJobRef.current.unsubscribe?.();
      activeJobRef.current = { file: null, unsubscribe: null };
    }
  }, [status]);

  if (status === "reading-original" && doc && file) {
    return <PdfReader doc={doc} fileName={file.name} onClose={reset} />;
  }

  if (status === "reading-rewritten" && rewrite) {
    return (
      <TextReader
        rewrite={rewrite}
        sourcePageAspect={sourcePageAspect}
        sourcePageCount={pageCount ?? rewrite.sections.length}
        onClose={reset}
      />
    );
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
        <RewriteLoadingState
          fileName={file.name}
          // Derived rather than cleared in an effect: progress is only
          // meaningful while a rewrite is running, so gating the read
          // avoids an extra setState-in-effect cascade.
          progress={status === "rewriting" ? progress : null}
        />
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
