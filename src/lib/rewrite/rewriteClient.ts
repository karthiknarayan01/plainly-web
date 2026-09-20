import type {
  RewriteJobSnapshot,
  RewriteJobStatus,
  RewritePageInput,
  RewriteResponseBody,
  RewriteSection,
} from "./types";

export async function createRewriteJob(
  filename: string,
  pages: RewritePageInput[]
): Promise<string> {
  const res = await fetch("/api/rewrite-jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, pages }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? "Failed to create rewrite job");
  }
  const { job_id } = (await res.json()) as { job_id: string };
  return job_id;
}

/**
 * Strips the Markdown the reader can't render, and KEEPS \*\*bold\*\*,
 * which it can — the prompt asks the writer to highlight the handful of
 * figures and defined terms that carry a page, and TextPageRenderer turns
 * those into real <strong> elements.
 *
 * Everything else still has to go: headings, bullets and italics reach a
 * plain-prose page as literal punctuation. Confirmed on a real page,
 * where the writer emitted "## Why Management and Leadership" and the
 * reader would have shown the hashes.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // "## Heading" -> "Heading"
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2") // italic, leaving ** alone
    .replace(/^\s*[-*]\s+/gm, "") // list bullets
    .trim();
}

/**
 * Maps a finished job's chunks into the shape the reader paginates.
 *
 * This used to reveal only the longest unbroken run starting at page 1,
 * because pages streamed in as they finished and the worker completes
 * them out of order (8 lanes). That made a long job in flight show a
 * fraction of the document, which read as "the rest was lost". The client
 * now waits for the job to finish, so every chunk here is already
 * terminal and the whole document is assembled at once. A failed chunk
 * contributes nothing rather than hiding everything after it.
 */
export function chunksToSections(snapshot: RewriteJobSnapshot): RewriteSection[] {
  const sorted = [...snapshot.chunks].sort((a, b) => a.chunk_index - b.chunk_index);
  const sections: RewriteSection[] = [];
  for (const c of sorted) {
    if (c.status !== "completed") continue; // failed/never-ran adds nothing
    if (c.rewrite_text) {
      // No heading: chunks map to source PDF pages, not to the document's
      // own structure, so a per-chunk label here would be a fabricated
      // divider ("Page 6") breaking up continuous prose — the toolbar
      // already shows the reader's actual page position.
      //
      // Split on blank lines: the writer model returns a chunk's rewrite
      // as multiple \n\n-separated paragraphs, but nothing downstream
      // (TextPageRenderer renders each paragraphs[] entry as one <p>, and
      // CSS has no white-space: pre-line) preserves a bare "\n\n" inside a
      // single string — browsers collapse it, so the whole page rendered
      // as one dense, unbroken block of text. Splitting here, once, is
      // what actually gives each real paragraph its own <p> and CSS
      // margin.
      const paragraphs = c.rewrite_text
        .split(/\n\s*\n/)
        .map((p) => stripMarkdown(p.trim()))
        .filter(Boolean);
      sections.push({ paragraphs, sourcePage: c.chunk_index });
    }
  }
  return sections;
}

export function snapshotToResponseBody(
  filename: string,
  snapshot: RewriteJobSnapshot
): RewriteResponseBody {
  return {
    status: "ok",
    sourceFileName: filename,
    generatedAt: snapshot.job.updated_at,
    sections: chunksToSections(snapshot),
    failedPages: snapshot.chunks.filter((c) => c.status === "failed").length,
  };
}

export interface RewriteProgress {
  status: RewriteJobStatus;
  total: number;
  completed: number;
  failed: number;
  /** True once any page has failed specifically because the AI service
   *  has run out of credits. One such failure means every other page —
   *  in flight now, or not yet started — is failing the identical way,
   *  since an empty balance affects every call, not just one page. */
  insufficientCredits: boolean;
}

async function fetchProgress(jobId: string): Promise<RewriteProgress> {
  const res = await fetch(`/api/rewrite-jobs/${jobId}/progress`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Lost contact with the server");
  const body = await res.json();
  return {
    status: body.job.status as RewriteJobStatus,
    total: Number(body.total ?? 0),
    completed: Number(body.completed ?? 0),
    failed: Number(body.failed ?? 0),
    insufficientCredits: Boolean(body.insufficient_credits),
  };
}

/** Shown in place of the AI service's own error, which is written for a
 *  developer ("insufficient_credits", or a raw provider error string),
 *  not the person waiting on their document. */
export const INSUFFICIENT_CREDITS_MESSAGE =
  "We're sorry, we can't generate a response right now — the AI service has run out of available credits. Please try again later.";

const POLL_INTERVAL_MS = 2000;

/**
 * Waits for the whole document, reporting progress while it works.
 *
 * Replaced an SSE stream on 2026-09-17. Streaming pages as they completed
 * only ever surfaced the completed run from page 1, so a 200-page job
 * mid-flight showed ~19 pages and looked broken. Waiting for the finished
 * document and showing "N of M pages" while it runs is both simpler and
 * honest about what's happening.
 *
 * Returns a function that abandons the wait (e.g. on unmount).
 */
export function waitForRewriteJob(
  jobId: string,
  filename: string,
  onProgress: (progress: RewriteProgress) => void,
  onDone: (body: RewriteResponseBody) => void,
  onError: (message: string) => void
): () => void {
  let cancelled = false;

  (async () => {
    // Network blips shouldn't kill a job that may run for many minutes —
    // only give up once they persist.
    let consecutiveFailures = 0;
    while (!cancelled) {
      try {
        const progress = await fetchProgress(jobId);
        consecutiveFailures = 0;
        if (cancelled) return;

        // Stop waiting the instant this is known, rather than at the job's
        // eventual terminal status. One page failing this way means every
        // other page is failing it too, so waiting out the rest of a
        // large document would only delay telling the reader something
        // they already need to know — and produce a document with most of
        // its pages silently missing if some pages had already succeeded
        // before the balance ran out.
        if (progress.insufficientCredits) {
          onError(INSUFFICIENT_CREDITS_MESSAGE);
          return;
        }

        onProgress(progress);

        if (progress.status === "completed" || progress.status === "failed") {
          const res = await fetch(`/api/rewrite-jobs/${jobId}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error("Couldn't load the finished document");
          const snapshot = (await res.json()) as RewriteJobSnapshot;
          if (cancelled) return;
          const body = snapshotToResponseBody(filename, snapshot);
          if (body.sections.length === 0) {
            onError("The rewrite finished but produced no pages.");
            return;
          }
          onDone(body);
          return;
        }
      } catch (err) {
        if (cancelled) return;
        consecutiveFailures += 1;
        if (consecutiveFailures >= 5) {
          onError(
            err instanceof Error ? err.message : "Lost contact with the server"
          );
          return;
        }
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  })();

  return () => {
    cancelled = true;
  };
}
