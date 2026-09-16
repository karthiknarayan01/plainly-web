// Sections/paragraphs stay the shape the reader (paginateText.ts,
// TextReader) already consumes — completed job chunks get mapped into
// this shape rather than changing the paginator.
export interface RewriteSection {
  heading: string;
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
