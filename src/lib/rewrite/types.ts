// Sections/paragraphs stay the shape the reader (paginateText.ts,
// TextReader) already consumes — completed job chunks get mapped into
// this shape rather than changing the paginator. heading is optional:
// chunks map 1:1 to source PDF pages, not to the document's own
// structure, so there is no real heading to show per chunk — forcing one
// in (e.g. "Page 6") fragmented continuous prose with a label that
// duplicates the toolbar's own page indicator. Left in as optional in
// case a future chunking strategy is structure-aware and has a real
// heading to show.
export interface RewriteSection {
  heading?: string;
  paragraphs: string[];
}

export interface RewriteResponseBody {
  status: "ok";
  sourceFileName: string;
  generatedAt: string;
  sections: RewriteSection[];
}

export interface RewriteErrorBody {
  status: "error";
  message: string;
}

export interface RewritePageInput {
  page_number: number;
  text: string;
}

export type RewriteJobStatus = "pending" | "processing" | "completed" | "failed";

export interface RewriteChunk {
  id: string;
  chunk_index: number;
  status: RewriteJobStatus;
  rewrite_text: string | null;
  scores: Record<string, number> | null;
  approved: boolean | null;
  attempt_count: number;
}

export interface RewriteJob {
  id: string;
  filename: string;
  status: RewriteJobStatus;
  created_at: string;
  updated_at: string;
}

export interface RewriteJobSnapshot {
  job: RewriteJob;
  chunks: RewriteChunk[];
}
