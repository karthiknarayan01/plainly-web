import type {
  RewriteJobSnapshot,
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
 * The reader renders plain prose into <p> elements, so any Markdown the
 * writer model emits would reach the page as literal punctuation —
 * confirmed on a real page, where the writer produced
 * "**Why Management and Leadership**" and the reader would have shown the
 * asterisks. The prompt already asks for plain text with no headings;
 * this is the belt-and-braces version, since one model ignoring that
 * instruction shouldn't put asterisks in front of a reader.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // "## Heading" -> "Heading"
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2") // italic, leaving ** alone
    .replace(/^\s*[-*]\s+/gm, "") // list bullets
    .trim();
}

/**
 * Maps chunks into the shape the reader already knows how to paginate —
 * but only the longest unbroken run starting at the first page, stopping
 * at the first one that isn't done yet. The worker processes pages
 * concurrently (16 lanes), so completion order isn't sequential — page
 * 50 can easily finish before page 10. Revealing whatever's done in
 * whatever order it finished would show the reader pages out of order;
 * this instead withholds anything past the first gap, so what the reader
 * sees always advances 1, 2, 3, ... even though the backend behind it
 * isn't working in that order. A page with no text (a blank/divider page
 * the worker correctly skipped) still counts as "done" for this purpose
 * — it just contributes no section — so it doesn't block later pages
 * from appearing once it's their turn.
 */
export function chunksToSections(snapshot: RewriteJobSnapshot): RewriteSection[] {
  const sorted = [...snapshot.chunks].sort((a, b) => a.chunk_index - b.chunk_index);
  const sections: RewriteSection[] = [];
  for (const c of sorted) {
    // Only stop for work that hasn't finished yet — those pages are still
    // coming, and showing later ones first would put the document out of
    // order. A FAILED chunk is finished; it is never going to arrive, so
    // stopping on it used to hide every remaining page of the document
    // forever, even after the job completed. One failed page in a 259-page
    // book meant the reader got everything before it and nothing after —
    // the "I only got one page back" report. Skip it and keep going.
    if (c.status === "pending" || c.status === "processing") break;
    if (c.status === "failed") continue;
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
      sections.push({ paragraphs });
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
  };
}

/**
 * Opens the SSE stream and calls onUpdate for every snapshot the server
 * sends, until the job reaches a terminal status or onError fires.
 * Returns a function that closes the connection early (e.g. on unmount).
 */
export function subscribeToRewriteJob(
  jobId: string,
  onUpdate: (snapshot: RewriteJobSnapshot) => void,
  onError: (message: string) => void
): () => void {
  const source = new EventSource(`/api/rewrite-jobs/${jobId}/stream`);

  source.addEventListener("update", (event) => {
    try {
      const snapshot = JSON.parse((event as MessageEvent).data) as RewriteJobSnapshot;
      onUpdate(snapshot);
      if (snapshot.job.status === "completed" || snapshot.job.status === "failed") {
        source.close();
        if (snapshot.job.status === "failed") onError("Rewrite failed");
      }
    } catch {
      onError("Received a malformed update from the server");
      source.close();
    }
  });

  source.addEventListener("error", () => {
    // EventSource retries transient network errors on its own; if the
    // connection is already closed (terminal status reached above) this
    // fires harmlessly after close() and is ignored downstream.
    if (source.readyState === EventSource.CLOSED) {
      onError("Lost connection to the server");
    }
  });

  return () => source.close();
}
