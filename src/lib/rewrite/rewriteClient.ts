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

/** Maps completed chunks into the shape the reader already knows how to
 * paginate — chunks still in progress simply aren't included yet, so the
 * reader naturally fills in page by page as more of them land. */
export function chunksToSections(snapshot: RewriteJobSnapshot): RewriteSection[] {
  return snapshot.chunks
    .filter((c) => c.status === "completed" && c.rewrite_text)
    .sort((a, b) => a.chunk_index - b.chunk_index)
    .map((c) => ({
      heading: `Page ${c.chunk_index}`,
      paragraphs: [c.rewrite_text as string],
    }));
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
