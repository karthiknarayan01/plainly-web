export interface RewriteRequestBody {
  fileName: string;
  pageCount: number;
  fileSizeBytes: number;
}

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
